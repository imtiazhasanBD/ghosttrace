'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Clock,
  Server,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';

export default function OverviewPage() {
  const router = useRouter();
  const { metrics, traces, currentProjectId, isInitialLoading } = useProjectTelemetry();

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

  if (isInitialLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Traces */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Traces</span>
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {metrics?.totalTraces ?? 0}
            </p>
            <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1.5 mt-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live Distributed Spans
            </p>
          </div>
        </div>

        {/* Card 2: Error Rate */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Error Rate</span>
            <div
              className={`p-1.5 rounded-lg border ${
                (metrics?.errorRate ?? 0) > 0
                  ? 'bg-rose-950/60 border-rose-800/50 text-rose-400'
                  : 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                  (metrics?.errorRate ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {(metrics?.errorRate ?? 0).toFixed(1)}%
              </p>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${
                  (metrics?.errorRate ?? 0) === 0
                    ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400'
                    : 'border-rose-800/60 bg-rose-950/40 text-rose-400'
                }`}
              >
                {(metrics?.errorRate ?? 0) === 0 ? 'HEALTHY' : 'DEGRADED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">
              {metrics?.errorTraces ?? 0} failed traces recorded
            </p>
          </div>
        </div>

        {/* Card 3: Latency Profile */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latency Profile</span>
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono text-white">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                {metrics?.p50LatencyMs?.toFixed(0) ?? 0}
              </span>
              <span className="text-xs text-slate-400">p50 /</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-200">
                {metrics?.p95LatencyMs?.toFixed(0) ?? 0}
              </span>
              <span className="text-xs font-normal text-slate-400">p95 ms</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1.5">
              p99: <strong className="text-slate-300">{metrics?.p99LatencyMs?.toFixed(0) ?? 0} ms</strong>
              {' '}&bull; avg: <strong className="text-slate-300">{metrics?.avgDurationMs?.toFixed(0) ?? 0} ms</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Active Services */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 flex flex-col justify-between space-y-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Services</span>
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 tracking-tight">
              {metrics?.services?.length ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-1.5 font-mono" title={metrics?.services?.join(', ')}>
              {metrics?.services?.length ? metrics.services.join(', ') : 'None registered'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Recent Telemetry Feed */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Recent Telemetry Feed
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Stream of correlated HTTP operations, database queries, and background spans
            </p>
          </div>

          <button
            onClick={() => router.push(`/projects/${currentProjectId}/traces`)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Open Full Trace Explorer</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {traces.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No Traces Recorded Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Simulate Traffic&quot; in the header to trigger a sample checkout flow, or connect your service using the SDK.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {traces.slice(0, 8).map((t) => {
              const { method, path } = parseOperation(t.rootSpanName);
              const isError = t.statusCode === 'ERROR';

              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/projects/${currentProjectId}/traces/${t.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 cursor-pointer hover:bg-slate-800/30 rounded-lg transition-colors gap-2 text-xs group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isError ? (
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}

                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border shrink-0 ${getMethodBadgeClass(
                        method
                      )}`}
                    >
                      {method}
                    </span>

                    <span className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate font-mono">
                      {path}
                    </span>

                    <span className="hidden md:inline-block rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-400 font-mono shrink-0">
                      {t.serviceName}
                    </span>

                    <span className="hidden md:inline-block text-[11px] text-slate-500 font-mono shrink-0">
                      {t.spanCount} {t.spanCount === 1 ? 'span' : 'spans'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono text-xs pl-7 sm:pl-0">
                    <span className={`font-bold ${getDurationColor(t.durationMs)}`}>
                      {t.durationMs.toFixed(1)} ms
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(t.createdAt).toLocaleTimeString()}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
