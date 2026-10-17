'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ProjectSummary,
  OverviewMetrics,
  TraceEntity,
  ErrorGroupEntity,
  ApiKeyMetadata,
  TraceComparisonResult,
} from '@ghosttrace/shared-types';
import {
  fetchProjects,
  fetchOverviewMetrics,
  fetchTraces,
  fetchErrorGroups,
  fetchApiKeys,
  fetchTraceComparison,
} from './api';

interface ProjectTelemetryContextType {
  projects: ProjectSummary[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  metrics: OverviewMetrics | null;
  traces: TraceEntity[];
  totalTraces: number;
  errorGroups: ErrorGroupEntity[];
  apiKeys: ApiKeyMetadata[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  lastRefreshedAt: Date;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
  refreshData: () => Promise<void>;
  isSimulating: boolean;
  handleSimulateSuccess: () => Promise<void>;
  handleSimulateFailure: () => Promise<void>;
  // Differential Compare
  showCompareModal: boolean;
  setShowCompareModal: (open: boolean) => void;
  comparisonResult: TraceComparisonResult | null;
  isComparing: boolean;
  handleRunComparison: (baseId: string, targetId: string) => Promise<void>;
  // Mobile sidebar drawer
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  // Desktop sidebar collapse
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const ProjectTelemetryContext = createContext<ProjectTelemetryContextType | undefined>(undefined);

export const ProjectTelemetryProvider: React.FC<{
  projectId: string;
  children: React.ReactNode;
}> = ({ projectId, children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [traces, setTraces] = useState<TraceEntity[]>([]);
  const [totalTraces, setTotalTraces] = useState<number>(0);
  const [errorGroups, setErrorGroups] = useState<ErrorGroupEntity[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyMetadata[]>([]);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Polling settings
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(3000);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  // Simulation
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Differential Comparison
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<TraceComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Sidebar responsive state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 1. Tab visibility listener
  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // 2. Fetch projects list
  useEffect(() => {
    fetchProjects()
      .then((projs) => {
        setProjects(projs);
      })
      .catch((err) => console.error('Failed to fetch projects:', err));
  }, []);

  // 3. Core data loader
  const refreshData = useCallback(async () => {
    if (!projectId) return;
    setIsRefreshing(true);
    try {
      const [m, t, eg, ak] = await Promise.all([
        fetchOverviewMetrics(projectId),
        fetchTraces({ projectId, limit: 50 }),
        fetchErrorGroups(projectId),
        fetchApiKeys(projectId),
      ]);
      setMetrics(m);
      setTraces(t.traces);
      setTotalTraces(t.total);
      setErrorGroups(eg);
      setApiKeys(ak);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to refresh telemetry:', err);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 4. Polling loop
  useEffect(() => {
    if (!isAutoRefresh || !isTabVisible) return;
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [isAutoRefresh, isTabVisible, refreshInterval, refreshData]);

  // 5. Switching projects
  const handleSwitchProject = (newProjectId: string) => {
    if (newProjectId === projectId) return;
    // Replace projectId in the current path: /projects/[projectId]/section -> /projects/[newProjectId]/section
    const segments = pathname.split('/');
    if (segments[1] === 'projects' && segments[2]) {
      segments[2] = newProjectId;
      router.push(segments.join('/'));
    } else {
      router.push(`/projects/${newProjectId}/overview`);
    }
  };

  // 6. Simulation actions
  const handleSimulateSuccess = async () => {
    try {
      setIsSimulating(true);
      await fetch('http://localhost:3002/checkout/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo-buyer@ghosttrace.io',
          sku: 'PROD-SUCCESS-1',
          quantity: 1,
        }),
      });
      setTimeout(() => {
        refreshData();
        setIsSimulating(false);
      }, 700);
    } catch (err) {
      console.error('Simulation error:', err);
      setIsSimulating(false);
    }
  };

  const handleSimulateFailure = async () => {
    try {
      setIsSimulating(true);
      await fetch('http://localhost:3002/checkout/failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'fail-buyer@ghosttrace.io',
          sku: 'PROD-FAIL-OUTOFSTOCK',
        }),
      });
    } catch {
      // Intentionally fails
    } finally {
      setTimeout(() => {
        refreshData();
        setIsSimulating(false);
      }, 700);
    }
  };

  // 7. Comparison action
  const handleRunComparison = async (baseId: string, targetId: string) => {
    if (!baseId || !targetId) return;
    setIsComparing(true);
    try {
      const res = await fetchTraceComparison(baseId, targetId);
      setComparisonResult(res);
    } catch (err) {
      alert('Failed to compute trace comparison: ' + err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <ProjectTelemetryContext.Provider
      value={{
        projects,
        currentProjectId: projectId,
        setCurrentProjectId: handleSwitchProject,
        metrics,
        traces,
        totalTraces,
        errorGroups,
        apiKeys,
        isInitialLoading,
        isRefreshing,
        lastRefreshedAt,
        isAutoRefresh,
        setIsAutoRefresh,
        refreshInterval,
        setRefreshInterval,
        refreshData,
        isSimulating,
        handleSimulateSuccess,
        handleSimulateFailure,
        showCompareModal,
        setShowCompareModal,
        comparisonResult,
        isComparing,
        handleRunComparison,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </ProjectTelemetryContext.Provider>
  );
};

export const useProjectTelemetry = () => {
  const context = useContext(ProjectTelemetryContext);
  if (!context) {
    throw new Error('useProjectTelemetry must be used within a ProjectTelemetryProvider');
  }
  return context;
};
