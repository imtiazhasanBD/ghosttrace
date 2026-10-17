'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  AlertTriangle,
  Server,
  Key,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    currentProjectId,
    errorGroups,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isAutoRefresh,
  } = useProjectTelemetry();

  const navLinks = [
    {
      label: 'Overview',
      href: `/projects/${currentProjectId}/overview`,
      icon: Activity,
    },
    {
      label: 'Traces',
      href: `/projects/${currentProjectId}/traces`,
      icon: Layers,
    },
    {
      label: 'Errors',
      href: `/projects/${currentProjectId}/errors`,
      icon: AlertTriangle,
      badge: errorGroups.length > 0 ? errorGroups.length : undefined,
    },
    {
      label: 'Services',
      href: `/projects/${currentProjectId}/services`,
      icon: Server,
    },
    {
      label: 'SDK & API Keys',
      href: `/projects/${currentProjectId}/settings/sdk`,
      icon: Key,
    },
    {
      label: 'Settings',
      href: `/projects/${currentProjectId}/settings`,
      icon: Settings,
    },
  ];

  const isLinkActive = (href: string) => {
    if (href.endsWith('/overview')) {
      return pathname.endsWith('/overview') || pathname === `/projects/${currentProjectId}`;
    }
    if (href.endsWith('/settings')) {
      return pathname === `/projects/${currentProjectId}/settings`;
    }
    return pathname.startsWith(href);
  };

  const renderContent = (collapsed: boolean, isMobile = false) => (
    <div className="flex h-full flex-col justify-between">
      {/* Top Branding & Main Nav */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <a
            href={`/projects/${currentProjectId}/overview`}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-4 w-4 text-white" />
            </div>

            {!collapsed && (
              <div className="overflow-hidden animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white text-base">GhostTrace</span>
                  <span className="rounded bg-cyan-950/80 px-1.5 py-0.2 text-[9px] font-bold text-cyan-400 border border-cyan-800">
                    v1.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Backend Observability</p>
              </div>
            )}
          </a>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="px-3 space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {!collapsed && 'Platform'}
          </div>

          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />

                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {!collapsed && item.badge !== undefined && (
                    <span className="rounded-full bg-rose-950 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-400 border border-rose-800">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Connection status indicator */}
        {!collapsed ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-2.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isAutoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {isAutoRefresh ? 'Telemetry Ingest Active' : 'Ingest Paused'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isAutoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
              title={isAutoRefresh ? 'Telemetry Ingest Active' : 'Ingest Paused'}
            />
          </div>
        )}

        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 p-2 text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 border-r border-slate-800/80 bg-slate-950/95 transition-all duration-300 z-30 ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderContent(isSidebarCollapsed, false)}</div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer - always full width with labels */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(false, true)}
      </div>
    </>
  );
};
