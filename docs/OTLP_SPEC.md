# GhostTrace OTLP Trace Ingestion Specification

GhostTrace implements a standards-compliant OpenTelemetry OTLP/HTTP ingestion endpoint.

## 1. Endpoint Details

- **Path**: `POST /v1/traces`
- **Supported Content-Types**:
  - `application/json` (OpenTelemetry v1 JSON Trace format)
  - `application/x-protobuf` (OpenTelemetry v1 Binary Protobuf Trace format)
- **Authentication**:
  - Header `x-ghosttrace-key: <api_key>` OR `Authorization: Bearer <api_key>`
  - API Key format: `gt_live_[a-zA-Z0-9_-]+`

## 2. Ingestion Lifecycle & Idempotency

1. **Authentication Check**:
   - The SHA-256 hash of the received key is computed in constant time and verified against the `api_keys` database table.
   - If missing, invalid, or revoked (`revokedAt IS NOT NULL`), a `401 Unauthorized` response is immediately returned.
2. **Payload Size & Rate Limit**:
   - Payloads exceeding 5MB are rejected with `413 Payload Too Large`.
3. **Span Normalization & Deduplication**:
   - `traceId` (32 hex characters) and `spanId` (16 hex characters) are validated.
   - Nano timestamps are converted to BigInt and elapsed `durationMs` is computed.
   - Spans are upserted with compound key `(projectId, traceId, spanId)`. If an identical span is re-transmitted (e.g. SDK retry on network hiccup), the existing record is updated idempotently rather than duplicated.
4. **Error Grouping**:
   - When a span records `statusCode === 'ERROR'` or contains exception events, a stable SHA-256 `stackHash` is derived from the error name and sanitized top-frames of the stack trace.
   - The error group count is incremented and linked to the span.
5. **Trace Aggregate Update**:
   - The parent `Trace` record is updated with cumulative `spanCount`, `errorCount`, updated `durationMs`, and status.
6. **Response**:
   - Returns standard HTTP 200 with `{ "acceptedSpans": N, "rejectedSpans": 0 }`.
