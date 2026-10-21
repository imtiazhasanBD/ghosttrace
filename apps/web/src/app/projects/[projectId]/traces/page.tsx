'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Layers,
  Radio,
  Copy,
  Check,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { fetchTraces } from '../../../../lib/api';
import { TraceEntity } from '@ghosttrace/shared-types';
import { LiveTailConsole } from '../../../../components/LiveTailConsole';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge, MethodBadge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../lib/utils';

export default function TracesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProjectId, metrics } = useProjectTelemetry();

  // Initialize filters from URL query parameters if present
  const initialService = searchParams.get('service') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialLive = searchParams.get('live') === 'true';

  const [showLiveTail, setShowLiveTail] = useState<boolean>(initialLive);

  const [serviceFilter, setServiceFilter] = useState<string>(initialService);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [durationFilter, setDurationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  const [traces, setTraces] = useState<TraceEntity[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedTraceId(id);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };

  const durationBounds = useMemo(() => {
    if (durationFilter === 'FAST') return { maxDurationMs: 200 };
    if (durationFilter === 'MEDIUM') return { minDurationMs: 200, maxDurationMs: 1000 };
    if (durationFilter === 'SLOW') return { minDurationMs: 1000 };
    return {};
  }, [durationFilter]);

  useEffect(() => {
    if (!currentProjectId) return;
    setIsLoading(true);
    fetchTraces({
      projectId: currentProjectId,
      serviceName: serviceFilter !== 'ALL' ? serviceFilter : undefined,
      statusCode: statusFilter,
      search: searchQuery.trim() || undefined,
      minDurationMs: durationBounds.minDurationMs,
      maxDurationMs: durationBounds.maxDurationMs,
      limit: 50,
    })
      .then((res) => {
        setTraces(res.traces);
        setTotal(res.total);
      })
      .catch((err) => console.error('Failed to load traces:', err))
      .finally(() => setIsLoading(false));
  }, [currentProjectId, serviceFilter, statusFilter, searchQuery, durationBounds]);

  const parseOperation = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2 && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(parts[0])) {
      return { method: parts[0], path: parts.slice(1).join(' ') };
    }
    return { method: 'SPAN', path: name };
  };

  const getDurationColor = (ms: number) => {
    if (ms < 100) return 'text-emerald-500 font-semibold';
    if (ms < 500) return 'text-amber-500 font-semibold';
    return 'text-rose-500 font-semibold';
  };

  const allServices = metrics?.services || [];

  const hasActiveFilters =
    statusFilter !== 'ALL' || serviceFilter !== 'ALL' || searchQuery !== '' || durationFilter !== 'ALL';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setServiceFilter('ALL');
    setSearchQuery('');
    setDurationFilter('ALL');
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3.5">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Distributed Trace Explorer
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Query, filter, and inspect end-to-end distributed traces and latency bottlenecks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={showLiveTail ? 'subtle' : 'outline'}
            size="sm"
            onClick={() => setShowLiveTail(!showLiveTail)}
            className="text-xs font-semibold"
            title="Toggle Live Telemetry Tail streaming"
          >
            <Radio className={cn('h-3.5 w-3.5 mr-1.5', showLiveTail ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
            <span>Live Tail</span>
            {showLiveTail && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping ml-1" />}
          </Button>
        </div>
      </div>

      {/* 2. Filter & Query Toolbar */}
      <Card>
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search operation name, service, or trace ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Service Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px] font-medium">Service:</span>
                <select
                  aria-label="Filter traces by service"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
                >
                  <option value="ALL">All Services</option>
                  {allServices.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px] font-medium">Status:</span>
                <div className="flex items-center rounded-md border border-border bg-card p-0.5 text-xs">
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'OK', value: 'OK' },
                    { label: 'Error', value: 'ERROR' },
                  ].map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setStatusFilter(st.value)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                        statusFilter === st.value
                          ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Preset Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px] font-medium">Duration:</span>
                <select
                  aria-label="Filter traces by duration"
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
                >
                  <option value="ALL">Any Latency</option>
                  <option value="FAST">&lt; 200 ms</option>
                  <option value="MEDIUM">200 - 1000 ms</option>
                  <option value="SLOW">&gt; 1000 ms</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={resetFilters}
                  className="text-primary hover:text-primary/80 h-7"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Live Tail Streaming Console */}
      {showLiveTail && currentProjectId && (
        <div className="animate-in fade-in duration-200">
          <LiveTailConsole projectId={currentProjectId} services={allServices} />
        </div>
      )}

      {/* 3. Results Summary Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{traces.length}</strong> of{' '}
          <strong className="text-foreground">{total}</strong> traces
        </span>
      </div>

      {/* 4. Traces Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-2">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground font-mono">Querying trace store...</p>
            </div>
          ) : traces.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-1">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Traces Found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No matching traces found for the current query and filters. Try clearing the search or duration bounds.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3.5 w-12 text-center">Status</th>
                    <th className="py-2.5 px-3">Method & Operation</th>
                    <th className="py-2.5 px-3 w-36">Trace ID</th>
                    <th className="py-2.5 px-3 w-32">Service</th>
                    <th className="py-2.5 px-3 w-24 text-right">Duration</th>
                    <th className="py-2.5 px-3 w-20 text-center">Spans</th>
                    <th className="py-2.5 px-3.5 w-24 text-right">Timestamp</th>
                    <th className="py-2.5 px-3.5 w-28 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {traces.map((t) => {
                    const { method, path } = parseOperation(t.rootSpanName);
                    const isError = t.statusCode === 'ERROR';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => router.push(`/projects/${currentProjectId}/traces/${t.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') router.push(`/projects/${currentProjectId}/traces/${t.id}`);
                        }}
                        tabIndex={0}
                        className="group hover:bg-muted/40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-muted/50"
                      >
                        {/* Status Icon */}
                        <td className="py-2.5 px-3.5 text-center">
                          {isError ? (
                            <AlertCircle className="h-4 w-4 text-rose-500 inline" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                          )}
                        </td>

                        {/* Operation / Method */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 max-w-md">
                            <MethodBadge method={method} />
                            <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {path}
                            </span>
                          </div>
                        </td>

                        {/* Trace ID with copy button */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(t.id, e)}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title={copiedTraceId === t.id ? 'Copied!' : `Copy Trace ID (${t.id})`}
                            aria-label="Copy trace ID"
                          >
                            {copiedTraceId === t.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold text-[10px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 opacity-60" />
                                <span>{t.id.slice(0, 8)}...</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Service name */}
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/50 text-foreground/80 font-mono text-[11px] truncate max-w-[120px] inline-block">
                            {t.serviceName}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs">
                          <span className={getDurationColor(t.durationMs)}>
                            {t.durationMs.toFixed(1)} ms
                          </span>
                        </td>

                        {/* Span count */}
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                          {t.spanCount}
                        </td>

                        {/* Timestamp */}
                        <td className="py-2.5 px-3.5 text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        {/* Action Link Button */}
                        <td className="py-2.5 px-3.5 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${currentProjectId}/traces/${t.id}`);
                            }}
                            className="text-[11px] group-hover:border-primary/40 group-hover:text-primary transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
