'use client';

import React, { useState } from 'react';
import {
  Activity,
  Layers,
  AlertTriangle,
  Server,
  Settings,
  GitCompare,
  RefreshCw,
  PlayCircle,
  XCircle,
  Radio,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ProjectSummary } from '@ghosttrace/shared-types';

export type TabType = 'overview' | 'traces' | 'errors' | 'services' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  projects: ProjectSummary[];
  selectedProject: string;
  setSelectedProject: (id: string) => void;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (intervalMs: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSimulateSuccess: () => void;
  onSimulateFailure: () => void;
  isSimulating: boolean;
  lastRefreshedAt: Date;
  onOpenCompare: () => void;
  errorCount?: number;
  currentUser: import('../lib/api').AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  selectedProject,
  setSelectedProject,
  isAutoRefresh,
  setIsAutoRefresh,
  refreshInterval,
  setRefreshInterval,
  onRefresh,
  isRefreshing,
  onSimulateSuccess,
  onSimulateFailure,
  isSimulating,
  lastRefreshedAt,
  onOpenCompare,
  errorCount = 0,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Calculate elapsed seconds since last sync
  const secondsAgo = Math.max(0, Math.round((Date.now() - lastRefreshedAt.getTime()) / 1000));

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'traces', label: 'Traces', icon: Layers },
    { id: 'errors', label: 'Errors', icon: AlertTriangle, badge: errorCount > 0 ? errorCount : undefined },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'settings', label: 'Settings & SDK', icon: Settings },
  ];

  const intervals = [
    { label: '3s (Realtime)', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* 1. Primary Top Navigation */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-500/20">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">GhostTrace</span>
                <span className="rounded bg-cyan-950/90 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-400 border border-cyan-800">
                  OBSERVABILITY
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-900/60 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-rose-950 px-1.5 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Real Telemetry Simulation Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors"
              title="Simulate live traffic and exceptions on demo service"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Simulate Traffic</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>

            {showDemoMenu && (
              <div
                className="absolute right-0 mt-1.5 w-60 rounded-md border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 space-y-1.5 animate-in fade-in"
                onMouseLeave={() => setShowDemoMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Demo API Telemetry Triggers
                </div>
                <button
                  onClick={() => {
                    onSimulateSuccess();
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
                    onSimulateFailure();
                    setShowDemoMenu(false);
                  }}
                  disabled={isSimulating}
                  className="w-full flex items-center gap-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 px-3 py-2 text-xs font-medium text-rose-300 transition-colors text-left disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Simulate Prisma Failure</div>
                    <div className="text-[10px] text-rose-400/80">HTTP 409 • OutOfStock Exception</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Polling Interval & Live Status Control */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${isAutoRefresh
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              title="Configure live telemetry polling frequency"
            >
              <Radio className={`h-3 w-3 ${isAutoRefresh ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {isAutoRefresh ? `Live (${refreshInterval / 1000}s)` : 'Paused'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showIntervalMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 rounded-md border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in"
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors ${isAutoRefresh && refreshInterval === opt.value
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
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Manual refresh"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* User Authentication Control */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
                >
                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[100px] truncate">{currentUser.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-1.5 w-56 rounded-md border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-2 py-1.5 border-b border-slate-800 space-y-0.5">
                      <div className="font-semibold text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">{currentUser.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 transition-colors font-medium flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <X className="h-3.5 w-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 2. Dedicated Context Sub-Toolbar */}
      <div className="border-t border-slate-800/60 bg-slate-950/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Project & Environment Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Project:</span>
            <select
              aria-label="Select active project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-7 rounded border border-slate-800 bg-slate-900 px-2 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-500 transition-colors"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Environment Tag */}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-slate-400">production-cluster</span>
          </div>
        </div>

        {/* Right: Freshness indicator & Differential Comparison shortcut */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              {isAutoRefresh ? `Telemetry active • Synced ${secondsAgo}s ago` : 'Polling paused'}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <GitCompare className="h-3 w-3" />
            <span>Differential Compare</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2 animate-in slide-in-from-top">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-lg p-2.5 text-xs font-medium ${isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSimulateSuccess();
                setIsMobileMenuOpen(false);
              }}
              disabled={isSimulating}
              className="rounded-lg bg-emerald-950/60 border border-emerald-800/40 p-2 text-xs font-medium text-emerald-300 text-center"
            >
              Send Success
            </button>
            <button
              onClick={() => {
                onSimulateFailure();
                setIsMobileMenuOpen(false);
              }}
              disabled={isSimulating}
              className="rounded-lg bg-rose-950/60 border border-rose-800/40 p-2 text-xs font-medium text-rose-300 text-center"
            >
              Send Failure
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
