/**
 * Centralized Query Key Factory for TanStack Query
 * Ensures consistent cache isolation per project, workspace, and filter combinations.
 */

export const queryKeys = {
  // Current authenticated user session
  currentUser: () => ['currentUser'] as const,

  // Workspaces
  workspaces: () => ['workspaces'] as const,
  workspaceDetail: (workspaceId: string) => ['workspaces', workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,

  // Projects
  projects: (workspaceId?: string) => ['projects', { workspaceId }] as const,
  projectDetail: (projectId: string) => ['projects', 'detail', projectId] as const,

  // Overview Metrics (Milestone A)
  overview: (projectId?: string) => ['overview', projectId || 'default'] as const,

  // Distributed Traces & Filtering
  traces: (params: {
    projectId?: string;
    serviceName?: string;
    statusCode?: string;
    search?: string;
    limit?: number;
    minDurationMs?: number;
    maxDurationMs?: number;
  }) => ['traces', params] as const,
  traceDetail: (traceId: string) => ['traces', 'detail', traceId] as const,
  traceComparison: (baseId: string, targetId: string) =>
    ['traces', 'compare', { baseId, targetId }] as const,

  // Slow Database Queries
  slowQueries: (params: {
    projectId?: string;
    thresholdMs?: number;
    serviceName?: string;
    operation?: string;
    model?: string;
    sortBy?: string;
    limit?: number;
  }) => ['slow-queries', params] as const,

  // Error Groups & Fingerprints
  errorGroups: (projectId?: string) => ['error-groups', projectId || 'default'] as const,

  // API Ingestion Keys
  apiKeys: (projectId?: string) => ['api-keys', projectId || 'default'] as const,
};
