# GhostTrace Verification Runbook

Follow these exact steps to verify the platform from a clean checkout.

---

## 1. Environment & Database Verification

1. Start the Docker Compose stack:
   ```bash
   docker compose -f infra/docker/docker-compose.yml up -d --build
   ```
2. Verify all 4 containers are running and healthy:
   ```bash
   docker compose -f infra/docker/docker-compose.yml ps
   ```
   Expected output:
   - `ghosttrace-postgres` (healthy)
   - `ghosttrace-migration` (Exited 0)
   - `ghosttrace-api` (healthy)
   - `ghosttrace-demo-api` (healthy)
   - `ghosttrace-web` (healthy)

---

## 2. API Health Checks

Test the API health and readiness endpoints:
```bash
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3001/health/ready | jq .
```
Expected output:
```json
{ "status": "ok", "service": "ghosttrace-api" }
{ "status": "ready", "database": "connected" }
```

Test Demo API health:
```bash
curl -s http://localhost:3002/health | jq .
```
Expected output:
```json
{ "status": "ok", "service": "ghosttrace-demo-api", "database": "connected" }
```

---

## 3. End-to-End Tracing & Evidence Verification

1. **Send Successful Request**:
   ```bash
   curl -s -X POST http://localhost:3002/checkout/success \
     -H "Content-Type: application/json" \
     -d '{"email": "customer1@test.com", "sku": "PROD-SUCCESS-1", "quantity": 1}' | jq .
   ```
2. **Send Failing Request (Error & Exception Evidence)**:
   ```bash
   curl -s -X POST http://localhost:3002/checkout/failure \
     -H "Content-Type: application/json" \
     -d '{"email": "customer2@test.com", "sku": "PROD-FAIL-OUTOFSTOCK"}' | jq .
   ```
3. **Verify Persisted Traces via GhostTrace Query API**:
   ```bash
   curl -s http://localhost:3001/api/v1/traces | jq .
   ```
   Check that both the successful trace (status: `OK` or `UNSET`) and the failed trace (status: `ERROR`) are returned with span counts, durations, and service names.

4. **Verify Span Waterfall**:
   ```bash
   # Replace <TRACE_ID> with the ID from the previous query
   curl -s http://localhost:3001/api/v1/traces/<TRACE_ID> | jq .
   ```
   Verify that:
   - Root span is `HTTP POST /checkout/failure`
   - Child span is `prisma.DemoProduct.findUnique`
   - Exception details, error message (`InventoryDepletionError`), and stack trace are intact.

5. **Verify Error Grouping**:
   ```bash
   curl -s http://localhost:3001/api/v1/error-groups | jq .
   ```
   Verify that `InventoryDepletionError` is grouped with its stack hash and occurrence count.
