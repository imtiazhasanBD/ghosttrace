import {
  TraceEntity,
  OverviewMetrics,
  ErrorGroupEntity,
  ProjectSummary,
  ApiKeyMetadata,
  ApiKeyCreatedResponse,
  TraceComparisonResult,
  WorkspaceDetail,
  WorkspaceMemberEntity,
} from '@ghosttrace/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gt_auth_token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchWorkspaces(): Promise<WorkspaceDetail[]> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch workspaces');
  return res.json();
}

export async function createWorkspace(name: string): Promise<WorkspaceDetail> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create workspace');
  }
  return res.json();
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberEntity[]> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces/${workspaceId}/members`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch workspace members');
  return res.json();
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  role: string = 'MEMBER',
): Promise<WorkspaceMemberEntity> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to invite team member');
  }
  return res.json();
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to remove member');
  }
  return res.json();
}

export async function createWorkspaceProject(
  workspaceId: string,
  name: string,
): Promise<ProjectSummary> {
  const res = await fetch(`${API_BASE}/api/v1/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create project');
  }
  return res.json();
}

export async function fetchProjects(workspaceId?: string): Promise<ProjectSummary[]> {
  const url = new URL(`${API_BASE}/api/v1/projects`);
  if (workspaceId) url.searchParams.set('workspaceId', workspaceId);
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchOverviewMetrics(projectId?: string): Promise<OverviewMetrics> {
  const url = new URL(`${API_BASE}/api/v1/traces/overview`);
  if (projectId) url.searchParams.set('projectId', projectId);
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

export async function fetchTraces(params: {
  projectId?: string;
  serviceName?: string;
  statusCode?: string;
  search?: string;
  limit?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
}): Promise<{ traces: TraceEntity[]; total: number }> {
  const url = new URL(`${API_BASE}/api/v1/traces`);
  if (params.projectId) url.searchParams.set('projectId', params.projectId);
  if (params.serviceName && params.serviceName !== 'ALL') url.searchParams.set('serviceName', params.serviceName);
  if (params.statusCode && params.statusCode !== 'ALL') url.searchParams.set('statusCode', params.statusCode);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.minDurationMs !== undefined) url.searchParams.set('minDurationMs', String(params.minDurationMs));
  if (params.maxDurationMs !== undefined) url.searchParams.set('maxDurationMs', String(params.maxDurationMs));

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch traces');
  return res.json();
}

export async function fetchTraceDetails(traceId: string): Promise<TraceEntity> {
  const res = await fetch(`${API_BASE}/api/v1/traces/${traceId}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch trace details');
  return res.json();
}

export async function fetchTraceComparison(baseId: string, targetId: string, projectId?: string): Promise<TraceComparisonResult> {
  const url = new URL(`${API_BASE}/api/v1/traces/compare`);
  url.searchParams.set('base', baseId);
  url.searchParams.set('target', targetId);
  if (projectId) url.searchParams.set('projectId', projectId);
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch trace comparison');
  return res.json();
}

export async function fetchErrorGroups(projectId?: string): Promise<ErrorGroupEntity[]> {
  const url = new URL(`${API_BASE}/api/v1/error-groups`);
  if (projectId) url.searchParams.set('projectId', projectId);
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch error groups');
  return res.json();
}

export async function fetchApiKeys(projectId: string): Promise<ApiKeyMetadata[]> {
  const res = await fetch(`${API_BASE}/api/v1/projects/${projectId}/api-keys`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch API keys');
  return res.json();
}

export async function createApiKey(projectId: string, name: string): Promise<ApiKeyCreatedResponse> {
  const res = await fetch(`${API_BASE}/api/v1/projects/${projectId}/api-keys`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create API key');
  }
  return res.json();
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/projects/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to revoke API key');
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
    role?: string;
    projects: Array<{ id: string; name: string; slug: string }>;
  }>;
  workspace?: { id: string; name: string; slug: string };
  project?: { id: string; name: string; slug: string };
  apiKey?: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Invalid email or password');
  }
  const data = await res.json();
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('gt_auth_token', data.token);
    localStorage.setItem('gt_auth_user', JSON.stringify(data.user));
  }
  return data;
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Registration failed');
  }
  const data = await res.json();
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('gt_auth_token', data.token);
    localStorage.setItem('gt_auth_user', JSON.stringify(data.user));
  }
  return data;
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser; workspaces: any[] } | null> {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('gt_auth_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem('gt_auth_token');
      localStorage.removeItem('gt_auth_user');
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gt_auth_token');
    localStorage.removeItem('gt_auth_user');
  }
}
