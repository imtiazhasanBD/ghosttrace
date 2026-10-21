import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { redactSql } from '@ghosttrace/shared-types';
import { LiveTailService } from '../live-tail/live-tail.service';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /authorization/i,
  /token/i,
  /cookie/i,
  /bearer/i,
  /card.*number/i,
  /cvv/i,
  /ssn/i,
  /api.*key/i,
];

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly liveTailService?: LiveTailService,
  ) {}

  // Parse OTLP AnyValue object to JavaScript primitive
  private parseAnyValue(val: any): any {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('intValue' in val) return Number(val.intValue);
    if ('doubleValue' in val) return Number(val.doubleValue);
    if ('boolValue' in val) return Boolean(val.boolValue);
    if ('arrayValue' in val && val.arrayValue?.values) {
      return val.arrayValue.values.map((v: any) => this.parseAnyValue(v));
    }
    if ('kvlistValue' in val && val.kvlistValue?.values) {
      return this.parseAttributes(val.kvlistValue.values);
    }
    return JSON.stringify(val);
  }

  // Convert OTLP KeyValue array to key-value record with redaction
  private parseAttributes(attrs: any[]): Record<string, any> {
    if (!Array.isArray(attrs)) return {};
    const result: Record<string, any> = {};

    for (const item of attrs) {
      if (!item || !item.key) continue;
      const key = item.key;
      let isSensitive = false;
      for (const pattern of SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(key)) {
          isSensitive = true;
          break;
        }
      }

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else {
        const val = this.parseAnyValue(item.value);
        if ((key === 'db.statement' || key === 'sql') && typeof val === 'string') {
          result[key] = redactSql(val);
        } else {
          result[key] = val;
        }
      }
    }
    return result;
  }

  // Normalize ID (base64 or hex) to lowercase hex string
  private normalizeId(id: any, expectedLength: number): string {
    if (!id) return '';
    if (typeof id === 'string') {
      // Check if already hex
      if (/^[0-9a-fA-F]+$/.test(id) && id.length === expectedLength) {
        return id.toLowerCase();
      }
      // Check if base64
      try {
        const buf = Buffer.from(id, 'base64');
        const hex = buf.toString('hex').toLowerCase();
        if (hex.length === expectedLength) return hex;
      } catch {
        // Fall back
      }
      return id.toLowerCase().padStart(expectedLength, '0').slice(-expectedLength);
    }
    if (Buffer.isBuffer(id) || Array.isArray(id)) {
      return Buffer.from(id).toString('hex').toLowerCase();
    }
    return String(id).toLowerCase();
  }

  // Normalize Span Kind
  private normalizeKind(kind: any): string {
    if (typeof kind === 'number') {
      switch (kind) {
        case 1:
          return 'INTERNAL';
        case 2:
          return 'SERVER';
        case 3:
          return 'CLIENT';
        case 4:
          return 'PRODUCER';
        case 5:
          return 'CONSUMER';
        default:
          return 'INTERNAL';
      }
    }
    if (typeof kind === 'string') {
      const clean = kind.replace(/^SPAN_KIND_/, '').toUpperCase();
      if (['INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER'].includes(clean)) {
        return clean;
      }
    }
    return 'INTERNAL';
  }

  // Normalize Status
  private normalizeStatus(status: any): { code: 'UNSET' | 'OK' | 'ERROR'; message?: string } {
    if (!status) return { code: 'UNSET' };
    let code: 'UNSET' | 'OK' | 'ERROR' = 'UNSET';
    const rawCode = status.code;

    if (rawCode === 1 || rawCode === 'STATUS_CODE_OK' || rawCode === 'OK') {
      code = 'OK';
    } else if (rawCode === 2 || rawCode === 'STATUS_CODE_ERROR' || rawCode === 'ERROR') {
      code = 'ERROR';
    }

    return {
      code,
      message: status.message || undefined,
    };
  }

  // Ingest OTLP Traces payload
  async ingestTraces(payload: any, projectId: string): Promise<{ acceptedSpans: number; rejectedSpans: number }> {
    let accepted = 0;
    let rejected = 0;

    const resourceSpans = payload?.resourceSpans || [];
    if (!Array.isArray(resourceSpans) || resourceSpans.length === 0) {
      return { acceptedSpans: 0, rejectedSpans: 0 };
    }

    for (const rs of resourceSpans) {
      const resourceAttrs = this.parseAttributes(rs.resource?.attributes || []);
      const serviceName = resourceAttrs['service.name'] || 'unknown-service';

      const scopeSpans = rs.scopeSpans || [];
      for (const ss of scopeSpans) {
        const spans = ss.spans || [];
        for (const rawSpan of spans) {
          try {
            await this.persistSpan(rawSpan, projectId, serviceName, resourceAttrs);
            accepted++;
          } catch (err: any) {
            this.logger.error(`Failed to persist span: ${err.message}`, err.stack);
            rejected++;
          }
        }
      }
    }

    return { acceptedSpans: accepted, rejectedSpans: rejected };
  }

  private async persistSpan(
    rawSpan: any,
    projectId: string,
    serviceName: string,
    resourceAttrs: Record<string, any>,
  ): Promise<void> {
    const traceId = this.normalizeId(rawSpan.traceId, 32);
    const spanId = this.normalizeId(rawSpan.spanId, 16);
    const parentSpanId = rawSpan.parentSpanId ? this.normalizeId(rawSpan.parentSpanId, 16) : null;
    const name = rawSpan.name || 'unnamed-span';
    const kind = this.normalizeKind(rawSpan.kind);

    const startNano = BigInt(rawSpan.startTimeUnixNano || rawSpan.timeUnixNano || '0');
    const endNano = BigInt(rawSpan.endTimeUnixNano || rawSpan.startTimeUnixNano || '0');
    const durationMs = Number(endNano - startNano) / 1_000_000;

    const status = this.normalizeStatus(rawSpan.status);
    const attributes = {
      ...resourceAttrs,
      ...this.parseAttributes(rawSpan.attributes || []),
    };

    // Parse events
    const rawEvents = rawSpan.events || [];
    let errorGroupHash: string | null = null;
    let exceptionDetails: { type: string; message: string; stack?: string } | null = null;

    const parsedEvents = rawEvents.map((evt: any) => {
      const eventName = evt.name || '';
      const eventAttrs = this.parseAttributes(evt.attributes || []);
      const eventNano = String(evt.timeUnixNano || '0');

      if (eventName === 'exception') {
        const errType = eventAttrs['exception.type'] || 'Error';
        const errMsg = eventAttrs['exception.message'] || 'An exception occurred';
        const stack = eventAttrs['exception.stacktrace'] || '';

        exceptionDetails = {
          type: String(errType),
          message: String(errMsg),
          stack: String(stack),
        };

        // Create stable hash for grouping
        const topStackFrame = stack.split('\n')[1] || '';
        const hashPayload = `${errType}:${errMsg}:${topStackFrame.trim()}`;
        errorGroupHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      }

      return {
        name: eventName,
        timeUnixNano: eventNano,
        attributes: eventAttrs,
      };
    });

    // If span has ERROR status but no exception event was emitted, generate error group from status
    if (status.code === 'ERROR' && !errorGroupHash) {
      const errMessage = status.message || name;
      const hashPayload = `SpanError:${serviceName}:${errMessage}`;
      errorGroupHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      exceptionDetails = {
        type: 'SpanError',
        message: errMessage,
      };
    }

    // Upsert Error Group if present
    if (errorGroupHash && exceptionDetails) {
      await this.prisma.errorGroup.upsert({
        where: { stackHash: errorGroupHash },
        update: {
          count: { increment: 1 },
          lastSeenAt: new Date(),
        },
        create: {
          projectId,
          serviceName,
          errorType: (exceptionDetails as any).type,
          message: (exceptionDetails as any).message,
          stackHash: errorGroupHash,
          sampleStackTrace: (exceptionDetails as any).stack || null,
        },
      });
    }

    // 1. Upsert Trace record
    const isRootSpan = !parentSpanId;
    const isError = status.code === 'ERROR';

    await this.prisma.trace.upsert({
      where: { id: traceId },
      update: {
        serviceName,
        ...(isRootSpan ? { rootSpanName: name, rootSpanKind: kind } : {}),
        spanCount: { increment: 1 },
        ...(isError ? { errorCount: { increment: 1 }, statusCode: 'ERROR' } : {}),
      },
      create: {
        id: traceId,
        projectId,
        serviceName,
        rootSpanName: name,
        rootSpanKind: kind,
        startTimeUnixNano: startNano,
        endTimeUnixNano: endNano,
        durationMs: Math.max(durationMs, 0),
        statusCode: status.code,
        errorCount: isError ? 1 : 0,
        spanCount: 1,
      },
    });

    // 2. Upsert Span record (Idempotent: updates existing span if retransmitted)
    await this.prisma.span.upsert({
      where: {
        projectId_traceId_id: {
          projectId,
          traceId,
          id: spanId,
        },
      },
      update: {
        parentSpanId,
        name,
        kind,
        startTimeUnixNano: startNano,
        endTimeUnixNano: endNano,
        durationMs: Math.max(durationMs, 0),
        statusCode: status.code,
        statusMessage: status.message || null,
        attributes,
        events: parsedEvents,
        errorGroupHash,
      },
      create: {
        id: spanId,
        traceId,
        projectId,
        parentSpanId,
        name,
        kind,
        startTimeUnixNano: startNano,
        endTimeUnixNano: endNano,
        durationMs: Math.max(durationMs, 0),
        statusCode: status.code,
        statusMessage: status.message || null,
        attributes,
        events: parsedEvents,
        errorGroupHash,
      },
    });

    // 3. Publish to Live Tail stream only after successful persistence
    if (this.liveTailService) {
      const isSlow =
        durationMs >= 50 &&
        (attributes['db.system'] || name.startsWith('prisma.') || name.startsWith('db.'));

      this.liveTailService.publishEvent({
        type: isError ? 'error' : 'trace',
        projectId,
        data: {
          traceId,
          spanId,
          serviceName,
          name,
          kind,
          durationMs: Number(durationMs.toFixed(2)),
          statusCode: status.code,
          statusMessage: status.message || null,
          errorType: exceptionDetails ? (exceptionDetails as any).type : undefined,
          dbOperation: attributes['db.operation'],
          dbModel: attributes['db.sql.table'],
          isSlow,
        },
      });
    }
  }
}
