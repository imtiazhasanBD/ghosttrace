'use client';
import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  RefreshCw,
  Radio,
  Sparkles,
  PlayCircle,
  XCircle,
  GitCompare,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { AuthUser, fetchCurrentUser, logoutUser } from '../lib/api';
import { AuthModal } from './AuthModal';

export const TopHeader: React.FC = () => {
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
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

  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((data) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

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
        {/* Left: Mobile hamburger & Project Switcher & Environment */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Project Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 hidden sm:inline">
              Project:
            </span>
            <select
              aria-label="Select active project"
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Environment Tag */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-slate-400">production-cluster</span>
          </div>
        </div>

        {/* Right: Freshness, Differential compare, Simulation & Polling */}
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
              <span className="hidden sm:inline">Simulate Traffic</span>
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
                    <div className="font-semibold">Simulate Prisma Failure</div>
                    <div className="text-[10px] text-rose-400/80">HTTP 409 • OutOfStock Exception</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Polling Interval Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
                isAutoRefresh
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Configure telemetry polling frequency"
            >
              <Radio className={`h-3 w-3 ${isAutoRefresh ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {isAutoRefresh ? `Live (${refreshInterval / 1000}s)` : 'Paused'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
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

          {/* User Authentication Control */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 transition-colors"
                  title="User profile"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
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
