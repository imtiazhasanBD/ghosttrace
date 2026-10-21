'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  X,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { logoutUser } from '../lib/api';
import { AuthModal } from './AuthModal';
import { ThemeToggle } from './theme/ThemeToggle';
import { TraceSearchInput } from './ui/TraceSearchInput';
import { cn } from '../lib/utils';

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

  const workspaceRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (workspaceRef.current && !workspaceRef.current.contains(target)) {
        setShowWorkspaceMenu(false);
      }
      if (projectRef.current && !projectRef.current.contains(target)) {
        setShowProjectMenu(false);
      }
      if (demoRef.current && !demoRef.current.contains(target)) {
        setShowDemoMenu(false);
      }
      if (intervalRef.current && !intervalRef.current.contains(target)) {
        setShowIntervalMenu(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-20 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        {/* Left: Mobile hamburger & Workspace Switcher & Project Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 1. Workspace Switcher */}
          <div className="relative" ref={workspaceRef}>
            <button
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowProjectMenu(false);
              }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-accent px-2.5 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Switch Workspace"
              aria-expanded={showWorkspaceMenu}
            >
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold max-w-[100px] sm:max-w-[130px] truncate text-foreground">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              {currentWorkspace?.role && (
                <span className="hidden sm:inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold font-mono text-primary border border-primary/20 uppercase tracking-wider">
                  {currentWorkspace.role}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-border bg-popover p-1.5 shadow-xl z-50 text-xs space-y-0.5 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Workspaces
                </div>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setCurrentWorkspaceId(w.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                      currentWorkspace?.id === w.id
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{w.name}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {w.role} &bull; {w.projects?.length || 0} projects
                      </div>
                    </div>
                    {currentWorkspace?.id === w.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}

                <div className="border-t border-border my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="text-muted-foreground/40 hidden sm:inline">/</span>

          {/* 2. Project Switcher */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => {
                setShowProjectMenu(!showProjectMenu);
                setShowWorkspaceMenu(false);
              }}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-accent px-2.5 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Select Project"
              aria-expanded={showProjectMenu}
            >
              <FolderGit2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold max-w-[90px] sm:max-w-[120px] truncate text-foreground">
                {currentProject?.name || 'Project'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showProjectMenu && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-border bg-popover p-1.5 shadow-xl z-50 text-xs space-y-0.5 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Projects in {currentWorkspace?.name || 'Workspace'}
                </div>
                {activeWorkspaceProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setShowProjectMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                      currentProjectId === p.id
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    {currentProjectId === p.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}

                <div className="border-t border-border my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setShowNewProjectModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Search: Quick Trace & Metric Search Lookup */}
        <div className="hidden md:flex flex-1 max-w-xs mx-2">
          <TraceSearchInput projectId={currentProjectId} />
        </div>

        {/* Right: Freshness, Compare, Simulation, Polling, Theme Toggle & User */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Freshness indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isAutoRefresh ? 'bg-primary animate-pulse' : 'bg-muted-foreground/60'
              )}
            />
            <span>{isAutoRefresh ? `Synced ${secondsAgo}s ago` : 'Polling paused'}</span>
          </div>

          <div className="h-4 w-px bg-border hidden xl:block" />

          {/* Differential Compare Button */}
          <button
            onClick={() => setShowCompareModal(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-accent px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Open Success vs Failure Differential Trace Comparison"
          >
            <GitCompare className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden lg:inline">Compare</span>
          </button>

          {/* Simulate Traffic Dropdown */}
          <div className="relative" ref={demoRef}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-accent px-2 py-1.5 text-xs font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Simulate live traffic and exceptions"
              aria-expanded={showDemoMenu}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Simulate</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-border bg-popover p-2 shadow-xl z-50 space-y-1.5 animate-in fade-in">
                <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Demo API Telemetry Triggers
                </div>
                <button
                  onClick={() => {
                    handleSimulateSuccess();
                    setShowDemoMenu(false);
                  }}
                  disabled={isSimulating}
                  className="w-full flex items-center gap-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-colors text-left disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Simulate Successful Checkout</div>
                    <div className="text-[10px] opacity-80 font-mono">HTTP 200 &bull; Multi-span trace</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    handleSimulateFailure();
                    setShowDemoMenu(false);
                  }}
                  disabled={isSimulating}
                  className="w-full flex items-center gap-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors text-left disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Simulate Out of Stock Error</div>
                    <div className="text-[10px] opacity-80 font-mono">HTTP 409 &bull; Error group stack</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Polling Interval Trigger */}
          <div className="relative" ref={intervalRef}>
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-accent px-2 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Telemetry polling interval"
              aria-expanded={showIntervalMenu}
            >
              <span className="font-mono text-[11px] font-semibold text-primary">
                {isAutoRefresh ? `${refreshInterval / 1000}s` : 'Off'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showIntervalMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-border bg-popover p-1.5 shadow-xl z-50 text-xs space-y-0.5 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
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
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors',
                      isAutoRefresh && refreshInterval === opt.value
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    setIsAutoRefresh(!isAutoRefresh);
                    setShowIntervalMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-muted transition-colors font-medium"
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
            className="rounded-md border border-border bg-card/60 hover:bg-accent p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Manual refresh"
            aria-label="Refresh telemetry data"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-primary')}
            />
          </button>

          {/* Light / Dark / System Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <button
            className="rounded-md border border-border bg-card/60 hover:bg-accent p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          {/* User Profile / Menu */}
          <div className="relative" ref={userRef}>
            {currentUser ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-md border border-border bg-card/60 hover:bg-accent px-2 py-1 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="User profile"
                  aria-expanded={showUserMenu}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold flex items-center justify-center">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-lg border border-border bg-popover p-1.5 shadow-xl z-50 text-xs space-y-1 animate-in fade-in">
                    <div className="px-2.5 py-1.5 border-b border-border space-y-0.5">
                      <div className="font-semibold text-foreground truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate font-mono">
                        {currentUser.email}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create New Workspace */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl relative space-y-4">
            <button
              onClick={() => setShowNewWorkspaceModal(false)}
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Create New Workspace
              </h3>
              <p className="text-xs text-muted-foreground">
                Workspaces isolate projects, team members, and telemetry streams.
              </p>
            </div>
            <form onSubmit={handleCreateNewWorkspace} className="space-y-3">
              <input
                type="text"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Production or Staging"
                className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary hover:bg-primary/90 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl relative space-y-4">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-indigo-500" />
                New Project in {currentWorkspace?.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Each project receives dedicated ingestion keys and trace streams.
              </p>
            </div>
            <form onSubmit={handleCreateNewProject} className="space-y-3">
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. billing-service or auth-api"
                className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary hover:bg-primary/90 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors disabled:opacity-50"
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
