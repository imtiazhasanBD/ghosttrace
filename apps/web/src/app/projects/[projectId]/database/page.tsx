'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Database,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Code2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { fetchSlowQueries } from '../../../../lib/api';
import { SlowQuerySpan, SlowQueriesResponse, formatSql } from '@ghosttrace/shared-types';

export default function SlowQueryAnalyzerPage() {
  const params = useParams();
  const { currentProjectId, metrics } = useProjectTelemetry();
  const effectiveProjectId = (params?.projectId as string) || currentProjectId;

  // Filter and threshold state
  const [thresholdMs, setThresholdMs] = useState<number>(50);
  const [customThreshold, setCustomThreshold] = useState<string>('50');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [operationFilter, setOperationFilter] = useState<string>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'duration_desc' | 'duration_asc' | 'recent'>('duration_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [data, setData] = useState<SlowQueriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedSpanId, setCopiedSpanId] = useState<string | null>(null);
  const [expandedSpanId, setExpandedSpanId] = useState<string | null>(null);

  const thresholdPresets = [25, 50, 100, 250, 500];

  const loadData = () => {
    if (!effectiveProjectId) return;
    setIsLoading(true);
    fetchSlowQueries({
      projectId: effectiveProjectId,
      thresholdMs,
      serviceName: serviceFilter !== 'ALL' ? serviceFilter : undefined,
      operation: operationFilter !== 'ALL' ? operationFilter : undefined,
      model: modelFilter !== 'ALL' ? modelFilter : undefined,
      sortBy,
      limit: 50,
    })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load slow queries:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [effectiveProjectId, thresholdMs, serviceFilter, operationFilter, modelFilter, sortBy]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSpanId(id);
    setTimeout(() => setCopiedSpanId(null), 2000);
  };

  // Extract distinct operations and models for filter dropdowns
  const availableOperations = useMemo(() => {
    if (!data?.queries) return [];
    const ops = new Set<string>();
    data.queries.forEach((q) => {
      if (q.operation) ops.add(q.operation);
    });
    return Array.from(ops);
  }, [data?.queries]);

  const availableModels = useMemo(() => {
    if (!data?.queries) return [];
    const models = new Set<string>();
    data.queries.forEach((q) => {
      if (q.model) models.add(q.model);
    });
    return Array.from(models);
  }, [data?.queries]);

  // Client-side text search over queries
  const filteredQueries = useMemo(() => {
    if (!data?.queries) return [];
    if (!searchQuery.trim()) return data.queries;
    const q = searchQuery.toLowerCase();
    return data.queries.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.model && item.model.toLowerCase().includes(q)) ||
        (item.operation && item.operation.toLowerCase().includes(q)) ||
        (item.statement && item.statement.toLowerCase().includes(q)) ||
        item.serviceName.toLowerCase().includes(q)
    );
  }, [data?.queries, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Slow Query Analyzer
                <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800/60">
                  Threshold: ≥{thresholdMs}ms
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Identify database performance bottlenecks, Prisma ORM operations, and safe formatted SQL queries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Threshold Selector Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Slow-Span Threshold</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {thresholdPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setThresholdMs(preset);
                  setCustomThreshold(String(preset));
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  thresholdMs === preset
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset}ms
              </button>
            ))}
          </div>
        </div>

        {/* Total Slow Spans */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Identified Slow Queries</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {data ? data.total : '—'}
          </p>
          <p className="text-[11px] text-slate-500">
            Queries exceeding {thresholdMs}ms
          </p>
        </div>

        {/* Average Latency */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Slow Duration</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400">
            {data && data.avgSlowDurationMs ? `${data.avgSlowDurationMs} ms` : '0 ms'}
          </p>
          <p className="text-[11px] text-slate-500">Average among slow spans</p>
        </div>

        {/* Peak Latency */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Peak Query Latency</span>
            <Sparkles className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400">
            {data && data.maxDurationMs ? `${data.maxDurationMs} ms` : '0 ms'}
          </p>
          <p className="text-[11px] text-slate-500">Slowest execution recorded</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by model, operation, SQL statement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Services</option>
            {metrics?.services?.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>

          {/* Operation Filter */}
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Operations</option>
            {availableOperations.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          {/* Model Filter */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Models / Tables</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-300 outline-none focus:border-cyan-500 font-mono"
          >
            <option value="duration_desc">Duration (High → Low)</option>
            <option value="duration_asc">Duration (Low → High)</option>
            <option value="recent">Timestamp (Most Recent)</option>
          </select>
        </div>
      </div>

      {/* Query List */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Analyzing database spans...</p>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Slow Queries Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All database operations are currently running within the {thresholdMs}ms threshold. Adjust the threshold slider above or trigger new transactions to analyze query latency.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((query) => {
            const isRawSql = Boolean(query.statement);
            const isExpanded = expandedSpanId === query.id;
            const isExtreme = query.durationMs > 200;

            return (
              <div
                key={query.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Query Header */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60">
                  <div className="flex items-start md:items-center gap-3">
                    <button
                      onClick={() => setExpandedSpanId(isExpanded ? null : query.id)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors mt-0.5 md:mt-0"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Operation Tag */}
                        <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-800/80">
                          {query.operation || 'QUERY'}
                        </span>

                        {/* Model / Table Tag */}
                        {query.model && (
                          <span className="rounded bg-indigo-950/70 px-2 py-0.5 text-xs font-mono text-indigo-300 border border-indigo-800/70">
                            {query.model}
                          </span>
                        )}

                        {/* Technology Tag */}
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          {isRawSql ? 'Raw SQL' : 'Prisma ORM'}
                        </span>

                        {/* Service Tag */}
                        <span className="text-[11px] text-slate-400 font-mono">
                          svc: <strong className="text-slate-300">{query.serviceName}</strong>
                        </span>
                      </div>

                      <p className="text-xs font-mono text-slate-300 truncate max-w-xl">
                        {isRawSql ? (
                          query.statement
                        ) : (
                          <span className="text-cyan-400 font-semibold">
                            prisma.{query.model || 'db'}.{query.operation}()
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Latency & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    {/* Latency Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-bold ${
                        isExtreme
                          ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                          : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{query.durationMs} ms</span>
                    </div>

                    {/* View in Trace Waterfall Link */}
                    <Link
                      href={`/projects/${currentProjectId}/traces/${query.traceId}?selectedSpanId=${query.id}`}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:text-white px-2.5 py-1 text-xs text-slate-300 transition-colors"
                      title="Open in Trace Waterfall"
                    >
                      <span>Trace</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Formatted Code Block / Statement Display */}
                <div className="p-4 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                      <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                      {isRawSql ? 'Formatted SQL Statement (Redacted)' : 'Prisma ORM Method Invocation'}
                    </span>

                    {query.statement && (
                      <button
                        onClick={() => copyToClipboard(query.formattedStatement || query.statement || '', query.id)}
                        className="flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 border border-slate-800 text-[11px] transition-colors"
                      >
                        {copiedSpanId === query.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {query.formattedStatement ||
                      query.statement ||
                      `// Prisma ORM Operation\nawait prisma.${query.model || 'model'}.${query.operation || 'query'}({\n  /* Arguments and query conditions */\n});`}
                  </pre>
                </div>

                {/* Expanded Details: Span Attributes */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/70 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Span Attributes & Metadata</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Span ID</span>
                        <p className="text-slate-300 truncate">{query.id}</p>
                      </div>

                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase">Trace ID</span>
                        <p className="text-slate-300 truncate">{query.traceId}</p>
                      </div>
                    </div>

                    {query.attributes && Object.keys(query.attributes).length > 0 && (
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 divide-y divide-slate-800/60 overflow-hidden text-xs">
                        {Object.entries(query.attributes).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-3 p-2 gap-2">
                            <span className="font-mono text-slate-400 break-all text-[11px]">{k}</span>
                            <span className="col-span-2 font-mono text-slate-200 break-all text-[11px]">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
