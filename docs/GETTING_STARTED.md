# Getting Started with GhostTrace

This guide covers running the entire GhostTrace platform locally using Docker Compose or native pnpm development.

---

## Prerequisites
- Node.js `v20+` or `v22+`
- pnpm `v9+` or `v12+`
- Docker & Docker Compose

---

## 1. Quickstart via Docker Compose (Recommended)

Start the full stack (PostgreSQL, DB Migration, Ingestion & Query API, Web Dashboard, and Demo Application):

```bash
# 1. Copy sample environment file
cp .env.example .env

# 2. Build and run all services in background
docker compose -f infra/docker/docker-compose.yml up -d --build

# 3. Inspect running containers and health checks
docker compose -f infra/docker/docker-compose.yml ps
```

Services exposed:
- **Web Dashboard**: `http://localhost:3000`
- **Ingestion & API**: `http://localhost:3001` (`/health`, `/v1/traces`, `/api/v1/...`)
- **Demo API**: `http://localhost:3002` (`/health`, `/checkout/success`, `/checkout/failure`)
- **PostgreSQL**: `localhost:5432`

---

## 2. Generating Real Telemetry Traces

Run a successful transaction:
```bash
curl -X POST http://localhost:3002/checkout/success \
  -H "Content-Type: application/json" \
  -d '{"email": "architect@ghosttrace.io", "sku": "PROD-SUCCESS-1", "quantity": 1}'
```

Run an inventory-depleted failed transaction (generates exception evidence and error status):
```bash
curl -X POST http://localhost:3002/checkout/failure \
  -H "Content-Type: application/json" \
  -d '{"email": "debugger@ghosttrace.io", "sku": "PROD-FAIL-OUTOFSTOCK"}'
```

---

## 3. Investigating in the GhostTrace Dashboard

1. Open `http://localhost:3000` in your browser.
2. Log in with the pre-seeded demo credentials:
   - **Email**: `demo@ghosttrace.io`
   - **Password**: `Password123!`
3. Select the **Demo Project**.
4. Go to **Traces**: inspect the live telemetry stream. Click into any trace to view the **Waterfall timeline**, individual spans, attributes, and formatted stack trace errors.
5. Go to **Compare Traces**: select the successful trace and failed trace to see the differential analysis.
