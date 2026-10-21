'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ProjectSummary,
  OverviewMetrics,
  TraceEntity,
  ErrorGroupEntity,
  ApiKeyMetadata,
  TraceComparisonResult,
  WorkspaceDetail,
} from '@ghosttrace/shared-types';
import {
  fetchProjects,
  fetchOverviewMetrics,
  fetchTraces,
  fetchErrorGroups,
  fetchApiKeys,
  fetchTraceComparison,
  fetchWorkspaces,
  createWorkspace as apiCreateWorkspace,
  createWorkspaceProject,
  fetchCurrentUser,
  getAuthToken,
  AuthUser,
} from './api';

interface ProjectTelemetryContextType {
  // Workspaces
  workspaces: WorkspaceDetail[];
  currentWorkspace: WorkspaceDetail | null;
  setCurrentWorkspaceId: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<WorkspaceDetail>;
  refreshWorkspaces: () => Promise<void>;
  // Projects
  projects: ProjectSummary[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  createProject: (name: string) => Promise<ProjectSummary>;
  // Auth
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  isAuthRequired: boolean;
  setIsAuthRequired: (val: boolean) => void;
  // Metrics & Data
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
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceDetail[]>([]);
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

  // 2. Fetch User & Workspaces
  const loadUserAndWorkspaces = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthRequired(true);
      setIsInitialLoading(false);
      return;
    }

    try {
      const userProfile = await fetchCurrentUser();
      if (!userProfile) {
        setIsAuthRequired(true);
        setIsInitialLoading(false);
        return;
      }

      setCurrentUser(userProfile.user);
      setIsAuthRequired(false);

      const wsList = await fetchWorkspaces();
      setWorkspaces(wsList);

      // Find all projects across user's workspaces
      const allProjects = wsList.flatMap((w) => w.projects || []);
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load user session or workspaces:', err);
      setIsAuthRequired(true);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndWorkspaces();
  }, [loadUserAndWorkspaces]);

  // Derive current workspace from projectId
  const currentWorkspace = workspaces.find((w) =>
    w.projects?.some((p) => p.id === projectId)
  ) || workspaces[0] || null;

  // 3. Core telemetry data loader for active project
  const refreshData = useCallback(async () => {
    if (!projectId || projectId === 'default' || isAuthRequired) {
      setIsInitialLoading(false);
      return;
    }

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
    } catch (err: any) {
      console.error('Failed to refresh telemetry:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        setIsAuthRequired(true);
      }
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  }, [projectId, isAuthRequired]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 4. Polling loop
  useEffect(() => {
    if (!isAutoRefresh || !isTabVisible || isAuthRequired) return;
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [isAutoRefresh, isTabVisible, refreshInterval, refreshData, isAuthRequired]);

  // 5. Switching workspace
  const handleSwitchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;
    if (ws.projects && ws.projects.length > 0) {
      router.push(`/projects/${ws.projects[0].id}/overview`);
    } else {
      router.push(`/projects/new?workspaceId=${ws.id}`);
    }
  };

  // 6. Creating a new workspace
  const handleCreateWorkspace = async (name: string): Promise<WorkspaceDetail> => {
    const newWs = await apiCreateWorkspace(name);
    await loadUserAndWorkspaces();
    if (newWs.projects && newWs.projects.length > 0) {
      router.push(`/projects/${newWs.projects[0].id}/overview`);
    }
    return newWs;
  };

  // 7. Creating a new project in current workspace
  const handleCreateProject = async (name: string): Promise<ProjectSummary> => {
    if (!currentWorkspace) {
      throw new Error('No active workspace selected');
    }
    const newProj = await createWorkspaceProject(currentWorkspace.id, name);
    await loadUserAndWorkspaces();
    router.push(`/projects/${newProj.id}/settings/sdk`);
    return newProj;
  };

  // 8. Switching project
  const handleSwitchProject = (newProjectId: string) => {
    if (newProjectId === projectId) return;
    const segments = pathname.split('/');
    if (segments[1] === 'projects' && segments[2]) {
      segments[2] = newProjectId;
      router.push(segments.join('/'));
    } else {
      router.push(`/projects/${newProjectId}/overview`);
    }
  };

  // 9. Simulation actions
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
        queryClient.invalidateQueries({ queryKey: ['overview'] });
        queryClient.invalidateQueries({ queryKey: ['traces'] });
        queryClient.invalidateQueries({ queryKey: ['error-groups'] });
        queryClient.invalidateQueries({ queryKey: ['slow-queries'] });
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
        queryClient.invalidateQueries({ queryKey: ['overview'] });
        queryClient.invalidateQueries({ queryKey: ['traces'] });
        queryClient.invalidateQueries({ queryKey: ['error-groups'] });
        queryClient.invalidateQueries({ queryKey: ['slow-queries'] });
        setIsSimulating(false);
      }, 700);
    }
  };

  // 10. Comparison action
  const handleRunComparison = async (baseId: string, targetId: string) => {
    if (!baseId || !targetId) return;
    setIsComparing(true);
    try {
      const res = await fetchTraceComparison(baseId, targetId, projectId);
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
        workspaces,
        currentWorkspace,
        setCurrentWorkspaceId: handleSwitchWorkspace,
        createWorkspace: handleCreateWorkspace,
        refreshWorkspaces: loadUserAndWorkspaces,
        projects,
        currentProjectId: projectId,
        setCurrentProjectId: handleSwitchProject,
        createProject: handleCreateProject,
        currentUser,
        setCurrentUser,
        isAuthRequired,
        setIsAuthRequired,
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
