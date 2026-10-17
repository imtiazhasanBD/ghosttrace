import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TraceEntity,
  SpanEntity,
  OverviewMetrics,
  TraceFilterParams,
  TraceComparisonResult,
} from '@ghosttrace/shared-types';

@Injectable()
export class TracesService {
  constructor(private readonly prisma: PrismaService) {}

  // List traces with filtering and pagination
  async listTraces(params: TraceFilterParams): Promise<{ traces: TraceEntity[]; total: number }> {
    const {
      projectId,
      serviceName,
      statusCode,
      minDurationMs,
      maxDurationMs,
      search,
      limit = 50,
      offset = 0,
    } = params;

    const where: any = { projectId };

    if (serviceName) {
      where.serviceName = serviceName;
    }

    if (statusCode) {
      where.statusCode = statusCode;
    }

    if (
      (minDurationMs !== undefined && !isNaN(Number(minDurationMs))) ||
      (maxDurationMs !== undefined && !isNaN(Number(maxDurationMs)))
    ) {
      where.durationMs = {};
      if (minDurationMs !== undefined && !isNaN(Number(minDurationMs))) {
        where.durationMs.gte = Number(minDurationMs);
      }
      if (maxDurationMs !== undefined && !isNaN(Number(maxDurationMs))) {
        where.durationMs.lte = Number(maxDurationMs);
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { rootSpanName: { contains: search, mode: 'insensitive' } },
        { serviceName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const parsedLimit = limit && !isNaN(Number(limit)) ? Math.min(Number(limit), 100) : 50;
    const parsedOffset = offset && !isNaN(Number(offset)) ? Number(offset) : 0;

    const [total, records] = await Promise.all([
      this.prisma.trace.count({ where }),
      this.prisma.trace.findMany({
        where,
        orderBy: { startTimeUnixNano: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      }),
    ]);

    const traces: TraceEntity[] = records.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      serviceName: t.serviceName,
      rootSpanName: t.rootSpanName,
      rootSpanKind: t.rootSpanKind as any,
      startTimeUnixNano: t.startTimeUnixNano.toString(),
      endTimeUnixNano: t.endTimeUnixNano.toString(),
      durationMs: t.durationMs,
      statusCode: t.statusCode as any,
      errorCount: t.errorCount,
      spanCount: t.spanCount,
      createdAt: t.createdAt.toISOString(),
    }));

    return { traces, total };
  }

  // Get trace details with hierarchical span tree
  async getTraceDetails(traceId: string, projectId?: string): Promise<TraceEntity> {
    const where: any = { id: traceId };
    if (projectId) where.projectId = projectId;

    const traceRecord = await this.prisma.trace.findUnique({
      where,
      include: {
        spans: {
          orderBy: { startTimeUnixNano: 'asc' },
        },
      },
    });

    if (!traceRecord) {
      throw new NotFoundException(`Trace with ID ${traceId} not found`);
    }

    // Convert spans and build parent-child tree
    const spanMap = new Map<string, SpanEntity>();
    const rootSpans: SpanEntity[] = [];

    const spansList: SpanEntity[] = traceRecord.spans.map((s) => ({
      id: s.id,
      traceId: s.traceId,
      projectId: s.projectId,
      parentSpanId: s.parentSpanId,
      name: s.name,
      kind: s.kind as any,
      startTimeUnixNano: s.startTimeUnixNano.toString(),
      endTimeUnixNano: s.endTimeUnixNano.toString(),
      durationMs: s.durationMs,
      statusCode: s.statusCode as any,
      statusMessage: s.statusMessage,
      attributes: (s.attributes as any) || {},
      events: ((s.events as any[]) || []).map((e) => ({
        name: e.name,
        timeUnixNano: e.timeUnixNano,
        attributes: e.attributes,
      })),
      errorGroupHash: s.errorGroupHash,
      createdAt: s.createdAt.toISOString(),
      children: [],
    }));

    for (const span of spansList) {
      spanMap.set(span.id, span);
    }

    for (const span of spansList) {
      if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
        const parent = spanMap.get(span.parentSpanId)!;
        parent.children = parent.children || [];
        parent.children.push(span);
      } else {
        rootSpans.push(span);
      }
    }

    return {
      id: traceRecord.id,
      projectId: traceRecord.projectId,
      serviceName: traceRecord.serviceName,
      rootSpanName: traceRecord.rootSpanName,
      rootSpanKind: traceRecord.rootSpanKind as any,
      startTimeUnixNano: traceRecord.startTimeUnixNano.toString(),
      endTimeUnixNano: traceRecord.endTimeUnixNano.toString(),
      durationMs: traceRecord.durationMs,
      statusCode: traceRecord.statusCode as any,
      errorCount: traceRecord.errorCount,
      spanCount: traceRecord.spanCount,
      createdAt: traceRecord.createdAt.toISOString(),
      spans: spansList,
    };
  }

  // Get project overview metrics
  async getOverviewMetrics(projectId: string): Promise<OverviewMetrics> {
    const traces = await this.prisma.trace.findMany({
      where: { projectId },
      select: {
        statusCode: true,
        durationMs: true,
        serviceName: true,
      },
    });

    const totalTraces = traces.length;
    if (totalTraces === 0) {
      return {
        totalTraces: 0,
        errorTraces: 0,
        errorRate: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        avgDurationMs: 0,
        services: [],
      };
    }

    const errorTraces = traces.filter((t) => t.statusCode === 'ERROR').length;
    const errorRate = (errorTraces / totalTraces) * 100;

    const durations = traces.map((t) => t.durationMs).sort((a, b) => a - b);
    const avgDurationMs = durations.reduce((acc, v) => acc + v, 0) / totalTraces;

    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

    const services = Array.from(new Set(traces.map((t) => t.serviceName)));

    return {
      totalTraces,
      errorTraces,
      errorRate: Number(errorRate.toFixed(2)),
      p50LatencyMs: Number(p50.toFixed(2)),
      p95LatencyMs: Number(p95.toFixed(2)),
      p99LatencyMs: Number(p99.toFixed(2)),
      avgDurationMs: Number(avgDurationMs.toFixed(2)),
      services,
    };
  }

  // Differential Comparison between two traces
  async compareTraces(baseTraceId: string, targetTraceId: string, projectId?: string): Promise<TraceComparisonResult> {
    const [base, target] = await Promise.all([
      this.getTraceDetails(baseTraceId, projectId),
      this.getTraceDetails(targetTraceId, projectId),
    ]);

    const baseSpans = base.spans || [];
    const targetSpans = target.spans || [];

    const baseSpanNames = new Set(baseSpans.map((s) => s.name));
    const targetSpanNames = new Set(targetSpans.map((s) => s.name));

    const missingSpansInTarget = Array.from(baseSpanNames).filter((name) => !targetSpanNames.has(name));
    const extraSpansInTarget = Array.from(targetSpanNames).filter((name) => !baseSpanNames.has(name));

    const divergentSpans: TraceComparisonResult['divergentSpans'] = [];

    for (const bSpan of baseSpans) {
      const tSpan = targetSpans.find((s) => s.name === bSpan.name);
      if (tSpan) {
        const isStatusDivergent = bSpan.statusCode !== tSpan.statusCode;
        const isLatencyDivergent = Math.abs(bSpan.durationMs - tSpan.durationMs) > 10;

        if (isStatusDivergent || isLatencyDivergent) {
          divergentSpans.push({
            name: bSpan.name,
            baseDurationMs: bSpan.durationMs,
            targetDurationMs: tSpan.durationMs,
            baseStatus: bSpan.statusCode,
            targetStatus: tSpan.statusCode,
            errorMessageDiff: {
              base: bSpan.statusMessage,
              target: tSpan.statusMessage,
            },
          });
        }
      }
    }

    return {
      baseTrace: base,
      targetTrace: target,
      durationDiffMs: Number((target.durationMs - base.durationMs).toFixed(2)),
      spanCountDiff: target.spanCount - base.spanCount,
      missingSpansInTarget,
      extraSpansInTarget,
      divergentSpans,
    };
  }
}
