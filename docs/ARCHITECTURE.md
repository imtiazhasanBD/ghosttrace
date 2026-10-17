# GhostTrace Architecture & Design Specification

GhostTrace is an evidence-first backend observability platform tailored for high-reliability distributed Node.js applications, NestJS services, and Prisma database pipelines.

## High-Level Topology

```
+-------------------------------------------------------------------------+
| Instrumented Application (e.g. apps/demo-api)                           |
|                                                                         |
|  [HTTP Inbound Route]                                                   |
|          |                                                              |
|          v                                                              |
|  [@ghosttrace/instrumentation-nest]                                     |
|          |  (Creates root SERVER span, captures HTTP status & latency)   |
|          v                                                              |
|  [Prisma Database Query]                                                |
|          |                                                              |
|          v                                                              |
|  [@ghosttrace/instrumentation-prisma]                                   |
|          |  (Creates child CLIENT/DB span, records sanitized query)     |
|          v                                                              |
|  [Async Background Job / Event]                                         |
|          |  (Context propagation via OTel traceparent context)          |
|          v                                                              |
|  [@ghosttrace/sdk-node]                                                 |
|          |  (Bounded buffer, PII redactor, retry/backoff)               |
+----------|--------------------------------------------------------------+
           |
           | OTLP/HTTP POST /v1/traces (Protobuf / JSON)
           | Authorization: Bearer gt_live_...
           v
+-------------------------------------------------------------------------+
| GhostTrace Ingestion & API (apps/api)                                   |
|                                                                         |
|  1. API Key Guard (SHA-256 constant-time hash lookup & tenant isolation)|
|  2. Redaction Pipe (Enforces regex scrubbing of secrets & PII)          |
|  3. Deduplication & Idempotent Upsert Engine                            |
|  4. PostgreSQL Persistence (Traces, Spans, ErrorGroups)                 |
+-------------------------------------------------------------------------+
           ^
           | REST / Polling API
+-------------------------------------------------------------------------+
| GhostTrace Dashboard (apps/web - Next.js App Router)                    |
|                                                                         |
|  - Real-time Trace Waterfall Visualization                              |
|  - Evidence-First Span Details (attributes, events, exceptions)         |
|  - Error Groups & Stack Hash Aggregation                                |
|  - Differential Analysis (Success vs Failure trace side-by-side)        |
+-------------------------------------------------------------------------+
```

## Data Model & Indexing Strategy

- **`traces`**:
  - Keyed by `id` (OpenTelemetry 32-hex `traceId`).
  - Indexed on `(projectId, startTimeUnixNano DESC)` for sub-millisecond timeline queries.
  - Indexed on `(projectId, statusCode)` and `(projectId, durationMs)` for latency/error filtering.
- **`spans`**:
  - Keyed by `id` (OpenTelemetry 16-hex `spanId`).
  - Compound unique constraint on `(projectId, traceId, id)` guaranteeing idempotency across network retries.
  - Indexed on `(traceId, startTimeUnixNano ASC)` for instant tree reconstruction.
- **`error_groups`**:
  - Deduplicated by `(projectId, stackHash)` to group related crashes without noise.
