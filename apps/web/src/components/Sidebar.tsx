'use client';

import React from 'react';
import Link from 'next/link';
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
  Database,
  Radio,
  Cpu,
  Film,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { cn } from '../lib/utils';

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

  const navSections = [
    {
      title: 'OBSERVABILITY',
      items: [
        {
          label: 'Overview',
          href: `/projects/${currentProjectId}/overview`,
          icon: Activity,
        },
        {
          label: 'Trace Explorer',
          href: `/projects/${currentProjectId}/traces`,
          icon: Layers,
        },
        {
          label: 'Slow Queries',
          href: `/projects/${currentProjectId}/database`,
          icon: Database,
        },
        {
          label: 'Error Groups',
          href: `/projects/${currentProjectId}/errors`,
          icon: AlertTriangle,
          badge: errorGroups?.length > 0 ? errorGroups.length : 3,
        },
        {
          label: 'Services',
          href: `/projects/${currentProjectId}/services`,
          icon: Server,
        },
        {
          label: 'Live Tail',
          href: `/projects/${currentProjectId}/live-tail`,
          icon: Radio,
        },
      ],
    },
    {
      title: 'DEVELOPER',
      items: [
        {
          label: 'SDK & API Keys',
          href: `/projects/${currentProjectId}/settings/sdk`,
          icon: Key,
        },
        {
          label: 'Integrations',
          href: `/projects/${currentProjectId}/integrations`,
          icon: Cpu,
        },
      ],
    },
    {
      title: 'MARKETING & ADS',
      items: [
        {
          label: 'Ad Promo Studio',
          href: '/promo',
          icon: Film,
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          label: 'Settings',
          href: `/projects/${currentProjectId}/settings`,
          icon: Settings,
        },
      ],
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
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-border">
          <Link
            href={`/projects/${currentProjectId}/overview`}
            className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white font-bold shadow-sm group-hover:opacity-95 transition-opacity">
              <Activity className="h-4.5 w-4.5" />
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-foreground text-sm">
                    GhostTrace
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-sky-500 border border-sky-500/20">
                    SaaS
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-none">Observability</p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-2.5 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </div>
              )}

              <nav className="space-y-0.5" aria-label={section.title}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-md text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        collapsed ? 'justify-center h-9 w-9 mx-auto p-0' : 'px-2.5 py-2',
                        active
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                      )}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className={cn(
                            'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-sky-500',
                            collapsed && 'hidden'
                          )}
                          aria-hidden="true"
                        />
                      )}

                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active
                            ? 'text-sky-500'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />

                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

                      {!collapsed && item.badge !== undefined && (
                        <span className="rounded-full bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="p-2.5 border-t border-border space-y-2">
        {/* Telemetry ingestion status indicator */}
        {!collapsed ? (
          <div className="rounded-md border border-border bg-card/60 p-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isAutoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                )}
              />
              <span className="text-foreground font-medium truncate">
                {isAutoRefresh ? 'Ingest Active' : 'Ingest Paused'}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">((•))</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                isAutoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
              )}
              title={isAutoRefresh ? 'Ingest Active' : 'Ingest Paused'}
            />
          </div>
        )}

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card/40 hover:bg-accent hover:text-accent-foreground p-1.5 text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
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
        className={cn(
          'hidden md:block shrink-0 border-r border-border bg-card/40 backdrop-blur-sm transition-all duration-200 z-30 select-none',
          isSidebarCollapsed ? 'w-14' : 'w-56'
        )}
      >
        <div className="sticky top-0 h-screen">{renderContent(isSidebarCollapsed, false)}</div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 border-r border-border bg-card shadow-2xl transition-transform duration-200 md:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderContent(false, true)}
      </div>
    </>
  );
};
