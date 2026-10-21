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
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { fetchTraces } from '../../../../lib/api';
import { TraceEntity } from '@ghosttrace/shared-types';
import { LiveTailConsole } from '../../../../components/LiveTailConsole';

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

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-950/80 text-blue-400 border-blue-800/60';
      case 'POST':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      case 'DELETE':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getDurationColor = (ms: number) => {
    if (ms < 200) return 'text-emerald-400';
    if (ms < 800) return 'text-amber-400';
    return 'text-rose-400';
  };

  const allServices = metrics?.services || [];

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search operation name, service, or trace ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-md border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Service Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Service:</span>
            <select
              aria-label="Filter traces by service"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
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
            <span className="text-slate-500">Status:</span>
            <select
              aria-label="Filter traces by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OK">OK Only</option>
              <option value="ERROR">Errors Only</option>
            </select>
          </div>

          {/* Duration Preset Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Duration:</span>
            <select
              aria-label="Filter traces by duration"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="ALL">Any Latency</option>
              <option value="FAST">&lt; 200 ms</option>
              <option value="MEDIUM">200 - 1000 ms</option>
              <option value="SLOW">&gt; 1000 ms</option>
            </select>
          </div>

          {/* Live Tail Toggle Button */}
          <button
            onClick={() => setShowLiveTail(!showLiveTail)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-semibold transition-colors ${
              showLiveTail
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Live Telemetry Tail streaming"
          >
            <Radio className={`h-3.5 w-3.5 ${showLiveTail ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Live Tail</span>
            {showLiveTail && (
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Real-Time Live Tail Streaming Console */}
      {showLiveTail && currentProjectId && (
        <div className="animate-in fade-in duration-200">
          <LiveTailConsole projectId={currentProjectId} services={allServices} />
        </div>
      )}

      {/* Traces Count & Table */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{traces.length}</strong> of{' '}
          <strong className="text-slate-200">{total}</strong> traces
        </span>
        {(statusFilter !== 'ALL' || serviceFilter !== 'ALL' || searchQuery || durationFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setServiceFilter('ALL');
              setSearchQuery('');
              setDurationFilter('ALL');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-xs text-slate-400">Loading traces...</p>
          </div>
        ) : traces.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No Traces Found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">METHOD & OPERATION</th>
                  <th className="py-3 px-4">SERVICE</th>
                  <th className="py-3 px-4">DURATION</th>
                  <th className="py-3 px-4">SPANS</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {traces.map((t) => {
                  const { method, path } = parseOperation(t.rootSpanName);
                  const isError = t.statusCode === 'ERROR';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/projects/${currentProjectId}/traces/${t.id}`)}
                      className="cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            isError
                              ? 'border-rose-800 bg-rose-950/80 text-rose-400'
                              : 'border-emerald-800 bg-emerald-950/80 text-emerald-400'
                          }`}
                        >
                          {t.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${getMethodBadgeClass(
                              method
                            )}`}
                          >
                            {method}
                          </span>
                          <span className="font-semibold text-white truncate max-w-xs sm:max-w-md" title={path}>
                            {path}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{t.serviceName}</td>
                      <td className={`py-3 px-4 font-bold ${getDurationColor(t.durationMs)}`}>
                        {t.durationMs.toFixed(1)} ms
                      </td>
                      <td className="py-3 px-4 text-cyan-400">{t.spanCount}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {new Date(t.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${currentProjectId}/traces/${t.id}`);
                          }}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-colors"
                        >
                          Inspect Waterfall
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
