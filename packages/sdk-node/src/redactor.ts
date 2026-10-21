import { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';

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

const BEARER_REGEX = /^Bearer\s+[A-Za-z0-9\-._~+/]+=*$/i;
const JWT_REGEX = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
const CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$/;

import { redactSql } from '@ghosttrace/shared-types';

export function redactValue(key: string, value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Key-based matching
  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    if (pattern.test(key)) {
      return '[REDACTED]';
    }
  }

  // SQL Statement redaction
  if (key === 'db.statement' || key === 'sql') {
    return redactSql(value);
  }

  // Value-based matching
  if (BEARER_REGEX.test(value) || JWT_REGEX.test(value) || CREDIT_CARD_REGEX.test(value.replace(/[\s-]/g, ''))) {
    return '[REDACTED]';
  }

  return value;
}

export function redactAttributes(attributes: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(attributes)) {
    result[k] = redactValue(k, v);
  }
  return result;
}

export class RedactingSpanProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onStart(_span: any, _parentContext: Context): void {}

  onEnd(span: ReadableSpan): void {
    // Redact mutable attributes in place if possible
    if (span.attributes) {
      for (const [k, v] of Object.entries(span.attributes)) {
        const redacted = redactValue(k, v);
        if (redacted !== v) {
          (span.attributes as any)[k] = redacted;
        }
      }
    }
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
