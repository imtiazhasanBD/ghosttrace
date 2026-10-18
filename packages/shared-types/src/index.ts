// OpenTelemetry Span Status Codes
export type SpanStatusCode = 'UNSET' | 'OK' | 'ERROR';

// OpenTelemetry Span Kinds
export type SpanKind =
  | 'INTERNAL'
  | 'SERVER'
  | 'CLIENT'
  | 'PRODUCER'
  | 'CONSUMER';

// Trace and Span Entities
export interface SpanEvent {
  name: string;
  timeUnixNano: string;
  attributes?: Record<string, any>;
}

export interface SpanEntity {
  id: string; // spanId (16 hex chars)
  traceId: string; // traceId (32 hex chars)
  projectId: string;
  parentSpanId?: string | null;
  name: string;
  kind: SpanKind;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  durationMs: number;
  statusCode: SpanStatusCode;
  statusMessage?: string | null;
  attributes: Record<string, any>;
  events: SpanEvent[];
  errorGroupHash?: string | null;
  createdAt: string;
  children?: SpanEntity[];
}

export interface TraceEntity {
  id: string; // traceId
  projectId: string;
  serviceName: string;
  rootSpanName: string;
  rootSpanKind: SpanKind;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  durationMs: number;
  statusCode: SpanStatusCode;
  errorCount: number;
  spanCount: number;
  createdAt: string;
  spans?: SpanEntity[];
}

// Error Groups
export interface ErrorGroupEntity {
  id: string;
  projectId: string;
  serviceName: string;
  errorType: string;
  message: string;
  stackHash: string;
  sampleStackTrace?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  count: number;
  status: 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
}

// Metrics & Analytics
export interface OverviewMetrics {
  totalTraces: number;
  errorTraces: number;
  errorRate: number; // percentage 0-100
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgDurationMs: number;
  services: string[];
}

export interface TraceFilterParams {
  projectId: string;
  serviceName?: string;
  statusCode?: SpanStatusCode;
  minDurationMs?: number;
  maxDurationMs?: number;
  search?: string;
  limit?: number;
  offset?: number;
  startTime?: string;
  endTime?: string;
}

// Trace Comparison
export interface TraceComparisonResult {
  baseTrace: TraceEntity;
  targetTrace: TraceEntity;
  durationDiffMs: number;
  spanCountDiff: number;
  missingSpansInTarget: string[];
  extraSpansInTarget: string[];
  divergentSpans: Array<{
    name: string;
    baseDurationMs: number;
    targetDurationMs: number;
    baseStatus: SpanStatusCode;
    targetStatus: SpanStatusCode;
    errorMessageDiff?: {
      base?: string | null;
      target?: string | null;
    };
  }>;
}

// Auth & Multi-Tenancy
export interface UserSession {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface WorkspaceMemberEntity {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface WorkspaceDetail extends WorkspaceSummary {
  membersCount: number;
  projectsCount: number;
  projects: ProjectSummary[];
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ApiKeyCreatedResponse {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  rawApiKey: string; // ONLY returned once upon generation
  createdAt: string;
}

export interface ApiKeyMetadata {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

// Ingestion Payload
export interface OTLPIngestResult {
  acceptedSpans: number;
  rejectedSpans: number;
  errors?: string[];
}
