'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  ChevronDown,
  RefreshCw,
  Sparkles,
  PlayCircle,
  XCircle,
  GitCompare,
  Plus,
  Briefcase,
  FolderGit2,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { logoutUser } from '../lib/api';
import { AuthModal } from './AuthModal';

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    createWorkspace,
    projects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    currentUser,
    setCurrentUser,
    isAutoRefresh,
    setIsAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshData,
    isRefreshing,
    lastRefreshedAt,
    isSimulating,
    handleSimulateSuccess,
    handleSimulateFailure,
    setShowCompareModal,
    setIsMobileSidebarOpen,
  } = useProjectTelemetry();

  // Dropdown states
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // New Workspace / Project dialog state
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    router.push('/');
  };

  const handleCreateNewWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsSubmitting(true);
    try {
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setShowNewWorkspaceModal(false);
      setShowWorkspaceMenu(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectModal(false);
      setShowProjectMenu(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const activeWorkspaceProjects = currentWorkspace ? currentWorkspace.projects : projects;

  const secondsAgo = Math.max(0, Math.round((Date.now() - lastRefreshedAt.getTime()) / 1000));

  const intervals = [
    { label: '3s (Realtime)', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
  ];

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Workspace Switcher & Project Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 1. Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowProjectMenu(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
              title="Switch Workspace"
            >
              <Briefcase className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="font-bold max-w-[110px] sm:max-w-[140px] truncate text-white">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              {currentWorkspace?.role && (
                <span className="hidden sm:inline-block rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] font-bold text-cyan-400 uppercase tracking-wider border border-cyan-800/40">
                  {currentWorkspace.role}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showWorkspaceMenu && (
              <div
                className="absolute left-0 mt-1.5 w-60 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in"
                onMouseLeave={() => setShowWorkspaceMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Workspaces
                </div>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setCurrentWorkspaceId(w.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                      currentWorkspace?.id === w.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div>{w.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {w.role} &bull; {w.projects?.length || 0} projects
                      </div>
                    </div>
                    {currentWorkspace?.id === w.id && (
                      <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-800 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-cyan-400 hover:bg-cyan-950/40 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-slate-700 hidden sm:inline">/</span>

          {/* 2. Project Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProjectMenu(!showProjectMenu);
                setShowWorkspaceMenu(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
              title="Select Project"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold max-w-[100px] sm:max-w-[130px] truncate text-slate-200">
                {currentProject?.name || 'Project'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showProjectMenu && (
              <div
                className="absolute left-0 mt-1.5 w-60 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in"
                onMouseLeave={() => setShowProjectMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Projects in {currentWorkspace?.name || 'Workspace'}
                </div>
                {activeWorkspaceProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setShowProjectMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      currentProjectId === p.id
                        ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    {currentProjectId === p.id && (
                      <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-800 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setShowNewProjectModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-400 hover:bg-indigo-950/40 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Freshness, Compare, Simulation & Polling & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Freshness indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              {isAutoRefresh ? `Synced ${secondsAgo}s ago` : 'Polling paused'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden lg:block" />

          {/* Differential Compare Button */}
          <button
            onClick={() => setShowCompareModal(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
            title="Open Success vs Failure Differential Trace Comparison"
          >
            <GitCompare className="h-3.5 w-3.5 text-indigo-400" />
            <span>Compare</span>
          </button>

          {/* Simulate Traffic Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors"
              title="Simulate live traffic and exceptions on demo service"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showDemoMenu && (
              <div
                className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 space-y-1.5 animate-in fade-in"
                onMouseLeave={() => setShowDemoMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Demo API Telemetry Triggers
                </div>
                <button
                  onClick={() => {
                    handleSimulateSuccess();
                    setShowDemoMenu(false);
                  }}
                  disabled={isSimulating}
                  className="w-full flex items-center gap-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors text-left disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Simulate Successful Checkout</div>
                    <div className="text-[10px] text-emerald-400/80">HTTP 200 • Multi-span trace</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleSimulateFailure();
                    setShowDemoMenu(false);
                  }}
                  disabled={isSimulating}
                  className="w-full flex items-center gap-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 px-3 py-2 text-xs font-medium text-rose-300 transition-colors text-left disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Simulate Out of Stock Error</div>
                    <div className="text-[10px] text-rose-400/80">HTTP 409 • Grouped stack trace</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Polling Interval Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 px-2 py-1.5 text-xs text-slate-300 transition-colors"
              title="Telemetry polling interval"
            >
              <span className="font-mono text-[11px] text-cyan-400">
                {isAutoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showIntervalMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in"
                onMouseLeave={() => setShowIntervalMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Polling Frequency
                </div>
                {intervals.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setIsAutoRefresh(true);
                      setRefreshInterval(opt.value);
                      setShowIntervalMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      isAutoRefresh && refreshInterval === opt.value
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setIsAutoRefresh(!isAutoRefresh);
                    setShowIntervalMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-amber-300 hover:bg-slate-800 transition-colors"
                >
                  {isAutoRefresh ? 'Pause Polling' : 'Resume Polling'}
                </button>
              </div>
            )}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => refreshData()}
            disabled={isRefreshing}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Manual refresh"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* User Profile / Menu */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
                  title="User profile"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold max-w-[110px] truncate">{currentUser.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-2 py-1.5 border-b border-slate-800 space-y-0.5">
                      <div className="font-semibold text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">{currentUser.email}</div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 transition-colors font-medium flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create New Workspace */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowNewWorkspaceModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                Create New Workspace
              </h3>
              <p className="text-xs text-slate-400">
                Workspaces isolate projects, team members, and telemetry data.
              </p>
            </div>
            <form onSubmit={handleCreateNewWorkspace} className="space-y-3">
              <input
                type="text"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp or Staging Env"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-indigo-400" />
                New Project in {currentWorkspace?.name}
              </h3>
              <p className="text-xs text-slate-400">
                Each project receives dedicated API keys and telemetry stream.
              </p>
            </div>
            <form onSubmit={handleCreateNewProject} className="space-y-3">
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. payment-service or mobile-backend"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(u) => {
          setCurrentUser(u);
          refreshData();
        }}
      />
    </header>
  );
};
