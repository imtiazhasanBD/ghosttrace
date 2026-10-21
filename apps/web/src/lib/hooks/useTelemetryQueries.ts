'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
 * Milestone B: Traces Query Hook
 * Used on Overview (recent traces) and Trace Explorer with filter caching and smooth pagination.
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
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Milestone B: Individual Trace Detail Query Hook
 * Caches detailed trace waterfall and span hierarchy.
 */
export function useTraceDetailQuery(
  traceId: string,
  options?: {
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(traceId) && (options?.enabled ?? true);

  return useQuery<TraceEntity, Error>({
    queryKey: queryKeys.traceDetail(traceId),
    queryFn: ({ signal }) => fetchTraceDetails(traceId, signal),
    enabled: isEnabled,
    staleTime: 60 * 1000, // Historical trace executions are immutable, cache for 60s
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Milestone C: Error Groups Query Hook
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
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Milestone C: Slow Database Queries Query Hook
 */
export function useSlowQueriesQuery(
  params: {
    projectId?: string;
    thresholdMs?: number;
    serviceName?: string;
    operation?: string;
    model?: string;
    sortBy?: 'duration_desc' | 'duration_asc' | 'recent';
    limit?: number;
  },
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(params.projectId && params.projectId !== 'default') && (options?.enabled ?? true);

  return useQuery<SlowQueriesResponse, Error>({
    queryKey: queryKeys.slowQueries(params),
    queryFn: ({ signal }) => fetchSlowQueries(params, signal),
    enabled: isEnabled,
    staleTime: 5 * 1000,
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Milestone D: API Keys Query Hook
 */
export function useApiKeysQuery(
  projectId: string,
  options?: {
    enabled?: boolean;
  }
) {
  const isEnabled = Boolean(projectId && projectId !== 'default') && (options?.enabled ?? true);

  return useQuery<ApiKeyMetadata[], Error>({
    queryKey: queryKeys.apiKeys(projectId),
    queryFn: ({ signal }) => fetchApiKeys(projectId, signal),
    enabled: isEnabled,
    staleTime: 30 * 1000,
  });
}
