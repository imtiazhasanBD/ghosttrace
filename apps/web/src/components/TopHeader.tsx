'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  Search,
  MoreHorizontal,
  Bell,
  Clock,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { TraceSearchInput, TraceSearchDialog } from './ui/TraceSearchInput';
import { UserAccountMenu } from './UserAccountMenu';
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreSubmenu, setMoreSubmenu] = useState<'main' | 'interval' | 'simulate'>('main');
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // New Workspace / Project dialog state
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
      if (moreRef.current && !moreRef.current.contains(target)) {
        setShowMoreMenu(false);
        setMoreSubmenu('main');
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotificationsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    { label: '3s', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 sm:h-15 items-center justify-between px-2.5 sm:px-6 gap-2 max-w-full">
        
        {/* ======================================================== */}
        {/* LEFT: Mobile Toggle, Workspace & Project Switchers      */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink">
          {/* Mobile hamburger navigation toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden flex items-center justify-center h-8.5 w-8.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Workspace Selector */}
          <div className="relative shrink min-w-0" ref={workspaceRef}>
            <button
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowProjectMenu(false);
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md border border-border/70 bg-card/50 hover:bg-accent hover:border-border px-2 sm:px-2.5 text-xs text-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink min-w-0"
              title={`Switch Workspace: ${currentWorkspace?.name || 'Workspace'}`}
              aria-expanded={showWorkspaceMenu}
            >
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold max-w-[65px] xs:max-w-[85px] sm:max-w-[125px] truncate text-foreground">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              {currentWorkspace?.role && (
                <span className="hidden md:inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold font-mono text-primary border border-primary/20 uppercase tracking-wider">
                  {currentWorkspace.role}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-150 shrink-0',
                  showWorkspaceMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Workspace Dropdown */}
            {showWorkspaceMenu && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-border bg-popover text-popover-foreground p-1.5 shadow-2xl z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Workspaces
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setCurrentWorkspaceId(w.id);
                        setShowWorkspaceMenu(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors',
                        currentWorkspace?.id === w.id
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate text-xs">{w.name}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {w.role} &bull; {w.projects?.length || 0} projects
                        </div>
                      </div>
                      {currentWorkspace?.id === w.id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Low-contrast separator */}
          <span className="text-muted-foreground/30 text-xs font-mono select-none shrink-0">/</span>

          {/* Project Selector */}
          <div className="relative shrink min-w-0" ref={projectRef}>
            <button
              onClick={() => {
                setShowProjectMenu(!showProjectMenu);
                setShowWorkspaceMenu(false);
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md border border-border/70 bg-card/50 hover:bg-accent hover:border-border px-2 sm:px-2.5 text-xs text-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink min-w-0"
              title={`Switch Project: ${currentProject?.name || 'Project'}`}
              aria-expanded={showProjectMenu}
            >
              <FolderGit2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold max-w-[65px] xs:max-w-[85px] sm:max-w-[125px] truncate text-foreground">
                {currentProject?.name || 'Project'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-150 shrink-0',
                  showProjectMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Project Dropdown */}
            {showProjectMenu && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-lg border border-border bg-popover text-popover-foreground p-1.5 shadow-2xl z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Projects in {currentWorkspace?.name || 'Workspace'}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {activeWorkspaceProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentProjectId(p.id);
                        setShowProjectMenu(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors',
                        currentProjectId === p.id
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <span className="truncate pr-2 text-xs">{p.name}</span>
                      {currentProjectId === p.id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setShowNewProjectModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER: Compact Search Input (Desktop >= md)             */}
        {/* ======================================================== */}
        <div className="hidden md:flex flex-1 justify-center max-w-xs lg:max-w-sm mx-2">
          <TraceSearchInput
            projectId={currentProjectId}
            onTriggerDialog={() => setShowSearchModal(true)}
          />
        </div>

        {/* ======================================================== */}
        {/* RIGHT: Actions, Sync Status, More Dropdown & Profile    */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile search trigger icon (< md) */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="md:hidden flex items-center justify-center h-8.5 w-8.5 rounded-md border border-border/70 bg-card/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
            title="Search traces, endpoints and errors (⌘K)"
            aria-label="Open search dialog"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Compact Sync Status (Desktop >= lg) */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 h-9 rounded-md border border-border/50 bg-card/40 text-[11px] text-muted-foreground font-mono select-none"
            title={isAutoRefresh ? `Live telemetry synced ${secondsAgo}s ago` : 'Telemetry polling is currently paused'}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                isAutoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/60'
              )}
            />
            <span className="hidden xl:inline">{isAutoRefresh ? `Synced ${secondsAgo}s ago` : 'Paused'}</span>
            <span className="xl:hidden">{isAutoRefresh ? 'Live' : 'Off'}</span>
          </div>

          {/* Compare Action (Visible header action) */}
          <button
            onClick={() => setShowCompareModal(true)}
            className="hidden sm:flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md border border-border/70 bg-card/50 hover:bg-accent hover:border-border px-2 sm:px-2.5 text-xs font-medium text-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Open Differential Trace Comparison"
          >
            <GitCompare className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden md:inline">Compare</span>
          </button>

          {/* ======================================================== */}
          {/* MORE ACTIONS DROPDOWN (Primary Hub for Secondary Tools) */}
          {/* ======================================================== */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => {
                const next = !showMoreMenu;
                setShowMoreMenu(next);
                if (!next) setMoreSubmenu('main');
                setShowWorkspaceMenu(false);
                setShowProjectMenu(false);
                setShowNotificationsMenu(false);
              }}
              className={cn(
                'flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md border px-2 sm:px-2.5 text-xs font-medium transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showMoreMenu
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'border-border/70 bg-card/50 hover:bg-accent hover:border-border text-foreground'
              )}
              title="More actions, monitoring and tools"
              aria-label="More actions"
              aria-expanded={showMoreMenu}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">More</span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-150 hidden sm:inline',
                  showMoreMenu && 'rotate-180'
                )}
              />
            </button>

            {/* MORE DROPDOWN MENU */}
            {showMoreMenu && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-lg border border-border bg-popover text-popover-foreground p-1 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                {/* 1. MAIN MENU VIEW */}
                {moreSubmenu === 'main' && (
                  <div className="space-y-0.5">
                    {/* Refresh Telemetry */}
                    <button
                      onClick={() => {
                        refreshData();
                        setShowMoreMenu(false);
                      }}
                      disabled={isRefreshing}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw
                          className={cn('h-3.5 w-3.5 text-muted-foreground', isRefreshing && 'animate-spin text-primary')}
                        />
                        <span>Refresh telemetry</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{secondsAgo}s ago</span>
                    </button>

                    {/* Polling Interval Row */}
                    <button
                      onClick={() => setMoreSubmenu('interval')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Polling interval</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                        <span>{isAutoRefresh ? `${refreshInterval / 1000}s` : 'Off'}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
                      </div>
                    </button>

                    {/* Simulate Traffic Row */}
                    <button
                      onClick={() => setMoreSubmenu('simulate')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className={cn('h-3.5 w-3.5 text-amber-500', isSimulating && 'animate-spin')} />
                        <span>Simulate traffic</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
                    </button>
                  </div>
                )}

                {/* 2. POLLING INTERVAL SUBMENU */}
                {moreSubmenu === 'interval' && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setMoreSubmenu('main')}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Back</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <div className="px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Polling Frequency
                    </div>
                    {intervals.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setIsAutoRefresh(true);
                          setRefreshInterval(opt.value);
                          setShowMoreMenu(false);
                          setMoreSubmenu('main');
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                          isAutoRefresh && refreshInterval === opt.value
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <span>{opt.label} seconds</span>
                        {isAutoRefresh && refreshInterval === opt.value && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => {
                        setIsAutoRefresh(!isAutoRefresh);
                        setShowMoreMenu(false);
                        setMoreSubmenu('main');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-muted font-medium transition-colors"
                    >
                      <span>{isAutoRefresh ? 'Pause Polling' : 'Resume Polling'}</span>
                      {!isAutoRefresh && <Check className="h-3.5 w-3.5 text-amber-500" />}
                    </button>
                  </div>
                )}

                {/* 3. SIMULATE TRAFFIC SUBMENU */}
                {moreSubmenu === 'simulate' && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setMoreSubmenu('main')}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Back</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <div className="px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Simulate Traffic
                    </div>
                    <button
                      onClick={() => {
                        handleSimulateSuccess();
                        setShowMoreMenu(false);
                        setMoreSubmenu('main');
                      }}
                      disabled={isSimulating}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left disabled:opacity-50"
                    >
                      <PlayCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Simulate Success</div>
                        <div className="text-[10px] opacity-75 font-mono">HTTP 200 &bull; Checkout</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleSimulateFailure();
                        setShowMoreMenu(false);
                        setMoreSubmenu('main');
                      }}
                      disabled={isSimulating}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Simulate Error</div>
                        <div className="text-[10px] opacity-75 font-mono">HTTP 409 &bull; Out of stock</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotificationsMenu(!showNotificationsMenu);
                setShowMoreMenu(false);
                setShowWorkspaceMenu(false);
                setShowProjectMenu(false);
              }}
              className={cn(
                'flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-md border text-muted-foreground hover:text-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                showNotificationsMenu
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'border-border/70 bg-card/50 hover:bg-accent hover:border-border'
              )}
              title="Notifications"
              aria-label="View notifications"
              aria-expanded={showNotificationsMenu}
            >
              <Bell className="h-3.5 w-3.5" />
            </button>

            {showNotificationsMenu && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-border bg-popover text-popover-foreground p-3 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="font-semibold text-foreground text-xs">Notifications</span>
                </div>
                <div className="py-4 text-center text-xs text-muted-foreground space-y-1">
                  <Bell className="h-5 w-5 mx-auto text-muted-foreground/40" />
                  <p className="font-medium text-foreground text-xs">No new notifications</p>
                  <p className="text-[11px] text-muted-foreground">Alerts and trace threshold notifications will appear here.</p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          <UserAccountMenu variant="header" />

        </div>
      </div>

      {/* Global Trace Search Dialog (Triggered by Cmd+K or search icon) */}
      <TraceSearchDialog
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        projectId={currentProjectId}
      />

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
    </header>
  );
};
