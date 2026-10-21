'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOverviewMetrics,
  fetchTraces,
  fetchTraceDetails,
  fetchSlowQueries,
  fetchErrorGroups,
  fetchApiKeys,
  fetchTraceComparison,
  fetchWorkspaces,
  fetchProjects,
  fetchCurrentUser,
} from '../api';
import { queryKeys } from '../queryKeys';
import {
  OverviewMetrics,
  TraceEntity,
  ErrorGroupEntity,
  ApiKeyMetadata,
  SlowQueriesResponse,
  TraceComparisonResult,
} from '@ghosttrace/shared-types';

/**
 * Milestone A: Overview Metrics Query Hook
 * Provides caching, automatic background refetching, and AbortController cancellation.
 */
export function useOverviewQuery(
  projectId?: string,
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(projectId && projectId !== 'default') && (options?.enabled ?? true);

  return useQuery<OverviewMetrics, Error>({
    queryKey: queryKeys.overview(projectId),
    queryFn: ({ signal }) => fetchOverviewMetrics(projectId, signal),
    enabled: isEnabled,
    staleTime: 5 * 1000, // 5 seconds freshness window
    refetchInterval: options?.refetchInterval ?? 5000,
  });
}

/**
 * Traces Query Hook
 * Used on Overview (recent traces) and Trace Explorer.
 */
export function useTracesQuery(
  params: {
    projectId?: string;
    serviceName?: string;
    statusCode?: string;
    search?: string;
    limit?: number;
    minDurationMs?: number;
    maxDurationMs?: number;
  },
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(params.projectId && params.projectId !== 'default') && (options?.enabled ?? true);

  return useQuery<{ traces: TraceEntity[]; total: number }, Error>({
    queryKey: queryKeys.traces(params),
    queryFn: ({ signal }) => fetchTraces(params, signal),
    enabled: isEnabled,
    staleTime: 5 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Error Groups Query Hook
 */
export function useErrorGroupsQuery(
  projectId?: string,
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(projectId && projectId !== 'default') && (options?.enabled ?? true);

  return useQuery<ErrorGroupEntity[], Error>({
    queryKey: queryKeys.errorGroups(projectId),
    queryFn: ({ signal }) => fetchErrorGroups(projectId, signal),
    enabled: isEnabled,
    staleTime: 10 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}
