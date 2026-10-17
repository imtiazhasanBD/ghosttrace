# GhostTrace Threat Model & Security Posture

## 1. Authentication & API Key Management
- **Key Prefixing**: Keys are generated with the explicit format `gt_live_<random_bytes>` or `gt_test_<random_bytes>`.
- **Hashed Storage**: Raw API keys are **never stored** in the database. The database records only the cryptographic `SHA-256` digest (`keyHash`).
- **One-Time Secret Reveal**: The raw key is shown only once in the onboarding UI upon creation.
- **Revocation**: Any API key can be marked as `revokedAt = now()`. The ingestion layer refuses revoked keys immediately.

## 2. Multi-Tenant Project Isolation
- Every API endpoint is guarded by workspace membership validation.
- All database queries for traces, spans, and error groups include explicit `projectId = :authenticatedProjectId`.
- Ingestion endpoints resolve the API key's `projectId` and stamp all incoming spans with that ID, preventing cross-tenant spoofing.

## 3. Telemetry Redaction & PII Protection
- Attributes containing sensitive keywords (`authorization`, `bearer`, `cookie`, `set-cookie`, `password`, `secret`, `api_key`, `token`, `card_number`, `cvv`, `ssn`) are scrubbed before persistence.
- Values matching common PII patterns (JWT tokens, credit card numbers, email addresses in non-standard fields) are replaced with `[REDACTED]`.

## 4. Ingestion Resilience & DoS Protection
- Payload size limited to 5MB.
- Rate limiting per API key prevents flooding.
- Batch processing prevents database connection pool exhaustion.
- Idempotency guarantees that re-sent batches do not create duplicate records.
