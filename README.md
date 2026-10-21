# GhostTrace — Backend Observability & Evidence-First Debugging Platform

GhostTrace is a portfolio-grade backend observability platform designed to connect Node.js and NestJS microservices, collect OpenTelemetry traces via OTLP/HTTP, and deliver evidence-first debugging across HTTP requests, Prisma ORM operations, and background jobs.

---

## Key Highlights

- **Standard OpenTelemetry OTLP Ingestion**: Implements `POST /v1/traces` supporting both JSON and Protobuf formats.
- **Evidence-First Trace Waterfall**: Parent-child span hierarchy visualization with microsecond offsets, status flags, and latency bars.
- **Root Cause & Exception Forensics**: Captures detailed error types, messages, attributes, and formatted stack traces.
- **Stack-Hash Error Grouping**: Aggregates recurring exceptions by signature hash to eliminate noise.
- **Differential Trace Analysis**: Side-by-side comparison of baseline (successful) vs target (failing) traces to detect missing operations and execution divergence.
- **Zero-Trust Security**: API keys are hashed using cryptographic SHA-256 (`keyHash`) with one-time reveal and immediate revocation. PII and secrets (bearer tokens, passwords, cookies, cards) are redacted automatically.

---

## Architecture Topology

```
+--------------------------------------------------------------------------+
| Instrumented Application (apps/demo-api)                                 |
|                                                                          |
|   HTTP Route (NestJS) -> Prisma DB Query -> Background Notification Job  |
|   (@ghosttrace/instrumentation-nest)                                     |
|   (@ghosttrace/instrumentation-prisma)                                   |
|   (@ghosttrace/sdk-node)                                                 |
+--------------------------------------------------------------------------+
                                    |
                                    | OTLP/HTTP (POST /v1/traces)
                                    | Header: x-ghosttrace-key
                                    v
+--------------------------------------------------------------------------+
| GhostTrace Ingestion & API (apps/api)                                    |
|                                                                          |
|   - API Key SHA-256 Authentication Guard                                 |
|   - Sensitive Data Redaction Pipeline                                    |
|   - Idempotent Span Deduplication & PostgreSQL Persistence               |
|   - Trace Query & Differential Analysis Engine                           |
+--------------------------------------------------------------------------+
                                    ^
                                    | REST / Polling (3s)
+--------------------------------------------------------------------------+
| GhostTrace Web Dashboard (apps/web - Next.js App Router)                 |
|                                                                          |
|   - Live Overview Metrics (p50/p95/p99 latency, error rate)              |
|   - Trace Explorer with Search & Status Filters                          |
|   - Interactive Waterfall Timeline & Span Detail Drawer                  |
|   - Differential Trace Comparison                                        |
|   - API Key Generator & OTLP Connection Probe                            |
+--------------------------------------------------------------------------+
```

---

## Quickstart via Docker Compose

### 1. Start All Services
```bash
# Clone the repository and navigate into the root directory
cd GhostTrace

# Copy environment variables
cp .env.example .env

# Build and start all services in Docker Compose
docker compose -f infra/docker/docker-compose.yml up -d --build
```

### 2. Verify Container Health
```bash
docker compose -f infra/docker/docker-compose.yml ps
```

Services running:
- **GhostTrace Dashboard**: [http://localhost:3000](http://localhost:3000)
- **GhostTrace Ingestion & API**: [http://localhost:3001](http://localhost:3001) (`/health`, `/health/ready`, `/v1/traces`)
- **Demo API Service**: [http://localhost:3002](http://localhost:3002) (`/health`, `/checkout/success`, `/checkout/failure`)
- **PostgreSQL Database**: `localhost:5432`

---

## Reproducible Telemetry Demo

### 1. Trigger Successful Transaction
```bash
curl -X POST http://localhost:3002/checkout/success \
  -H "Content-Type: application/json" \
  -d '{"email": "architect@ghosttrace.io", "sku": "PROD-SUCCESS-1", "quantity": 1}'
```
*Result*: Correlates HTTP `POST /checkout/success` -> Prisma `DemoProduct.findUnique` -> Prisma `DemoOrder.create` -> background notification job.

### 2. Trigger Failing Transaction (Root Cause Evidence)
```bash
curl -X POST http://localhost:3002/checkout/failure \
  -H "Content-Type: application/json" \
  -d '{"email": "debugger@ghosttrace.io", "sku": "PROD-FAIL-OUTOFSTOCK"}'
```
*Result*: Returns HTTP 409 Conflict. Records `InventoryDepletionError` with full stack trace, error group hash, and Prisma database state.

### 3. Trigger Slow Database Query (Performance Forensics)
```bash
curl -X POST http://localhost:3002/checkout/slow \
  -H "Content-Type: application/json" \
  -d '{"email": "performance@ghosttrace.io", "sku": "PROD-SUCCESS-1"}'
```
*Result*: Simulates an unindexed database query (~120ms) and records span with execution duration.

### 4. Inspect in Dashboard
Open [http://localhost:3000](http://localhost:3000):
1. **Traces & Live Tail**: Toggle **Live Tail** to stream incoming traces and exceptions in real-time via Server-Sent Events (SSE) with pause/resume, auto-scroll, and error filters.
2. **Waterfall**: Click on the failing trace to inspect the exact parent-child hierarchy down to the failing Prisma inventory check.
3. **Slow Queries**: Inspect database queries exceeding the configurable threshold (25ms, 50ms, 100ms, 250ms), sort by latency, inspect formatted SQL, and navigate directly to the trace.
4. **Span Detail Drawer**: Click any database span to view the formatted SQL or Prisma ORM call and attributes.
5. **Compare Traces**: Select the success trace as Baseline and the failed trace as Target to see the side-by-side differential analysis.

---

## Monorepo Structure

```
├── apps/
│   ├── api/                    # NestJS Core API & Ingestion Module
│   ├── demo-api/               # Fully instrumented demo e-commerce service
│   └── web/                    # Next.js 14 App Router observability dashboard
├── packages/
│   ├── config/                 # Shared TypeScript configurations
│   ├── instrumentation-nest/   # NestJS route & exception interceptor
│   ├── instrumentation-prisma/ # Prisma ORM query & exception middleware
│   ├── sdk-node/               # OpenTelemetry Node.js SDK wrapper with redaction
│   ├── shared-types/           # Shared TypeScript interfaces and DTOs
│   └── ui/                     # Shared UI tokens
├── prisma/
│   ├── schema.prisma           # PostgreSQL models, relationships, and indexes
│   └── seed.ts                 # Database seeder (default user, project, API key)
├── infra/
│   ├── docker/                 # Dockerfiles and docker-compose.yml
│   └── nginx/                  # Production Nginx reverse proxy configuration
└── docs/                       # Architecture, Security Threat Model, Verification Runbook
```

---

## Testing & Verification

Run automated tests across the workspace:
```bash
# Typecheck all packages
pnpm run typecheck

# Run unit and integration test suites
pnpm run test

# Run build across all apps and packages
pnpm run build
```
# ghosttrace
