'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Database,
  Clock,
  Search,
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
import { SlowQuerySpan, SlowQueriesResponse } from '@ghosttrace/shared-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';

export default function SlowQueryAnalyzerPage() {
  const params = useParams();
  const { currentProjectId, metrics } = useProjectTelemetry();
  const effectiveProjectId = (params?.projectId as string) || currentProjectId;

  // Filter and threshold state
  const [thresholdMs, setThresholdMs] = useState<number>(50);
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              Slow Query Analyzer
            </h1>
            <Badge variant="warning" size="sm" className="font-mono">
              ≥{thresholdMs}ms
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify database performance bottlenecks, Prisma ORM operations, and SQL execution plans
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin text-primary')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Threshold Selector Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Threshold Presets
            </CardTitle>
            <Clock className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {thresholdPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setThresholdMs(preset)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono transition-colors border',
                    thresholdMs === preset
                      ? 'bg-primary text-primary-foreground font-bold border-primary shadow-xs'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {preset}ms
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Slow Spans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identified Queries
            </CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {data ? data.total : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              Operations exceeding {thresholdMs}ms
            </p>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Slow Duration
            </CardTitle>
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-primary">
              {data && data.avgSlowDurationMs ? `${data.avgSlowDurationMs} ms` : '0 ms'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">Average among slow spans</p>
          </CardContent>
        </Card>

        {/* Peak Latency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Peak Query Latency
            </CardTitle>
            <Sparkles className="h-3.5 w-3.5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {data && data.maxDurationMs ? `${data.maxDurationMs} ms` : '0 ms'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">Slowest execution captured</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by model, operation, SQL statement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-8 px-2 rounded-md border border-input bg-card text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
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
              className="h-8 px-2 rounded-md border border-input bg-card text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
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
              className="h-8 px-2 rounded-md border border-input bg-card text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
            >
              <option value="ALL">All Models</option>
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
              className="h-8 px-2 rounded-md border border-input bg-card text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
            >
              <option value="duration_desc">Duration (High → Low)</option>
              <option value="duration_asc">Duration (Low → High)</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Query List */}
      {isLoading ? (
        <Card className="p-12 text-center space-y-2">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">Analyzing database query telemetry...</p>
        </Card>
      ) : filteredQueries.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Slow Queries Detected</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            All database operations are currently running within the {thresholdMs}ms threshold. Adjust the threshold presets above to analyze faster queries.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((query) => {
            const isRawSql = Boolean(query.statement);
            const isExpanded = expandedSpanId === query.id;
            const isExtreme = query.durationMs > 200;

            return (
              <Card
                key={query.id}
                className="overflow-hidden hover:border-border/80 transition-colors"
              >
                {/* Query Header */}
                <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border bg-card">
                  <div className="flex items-start md:items-center gap-2.5">
                    <button
                      onClick={() => setExpandedSpanId(isExpanded ? null : query.id)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors mt-0.5 md:mt-0"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Operation Tag */}
                        <Badge variant="default" size="sm" className="font-mono font-bold">
                          {query.operation || 'QUERY'}
                        </Badge>

                        {/* Model Tag */}
                        {query.model && (
                          <Badge variant="secondary" size="sm" className="font-mono">
                            {query.model}
                          </Badge>
                        )}

                        {/* Technology Tag */}
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground border border-border">
                          {isRawSql ? 'Raw SQL' : 'Prisma ORM'}
                        </span>

                        {/* Service Tag */}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          svc: <strong className="text-foreground">{query.serviceName}</strong>
                        </span>
                      </div>

                      <p className="text-xs font-mono text-foreground font-medium truncate max-w-xl">
                        {isRawSql ? (
                          query.statement
                        ) : (
                          <span className="text-primary font-semibold">
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
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-bold',
                        isExtreme
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{query.durationMs} ms</span>
                    </div>

                    {/* View in Trace Waterfall Link */}
                    <Link
                      href={`/projects/${currentProjectId}/traces/${query.traceId}?selectedSpanId=${query.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card hover:bg-accent px-2.5 py-1 text-xs text-foreground transition-colors"
                      title="Open in Trace Waterfall"
                    >
                      <span>Trace</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Formatted Code Block / Statement Display */}
                <div className="p-3.5 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                      {isRawSql ? 'Formatted SQL Statement (Redacted)' : 'Prisma ORM Method Invocation'}
                    </span>

                    {query.statement && (
                      <button
                        onClick={() => copyToClipboard(query.formattedStatement || query.statement || '', query.id)}
                        className="flex items-center gap-1 rounded bg-card hover:bg-accent text-foreground px-2 py-0.5 border border-border text-[11px] transition-colors"
                      >
                        {copiedSpanId === query.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Copied</span>
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

                  <pre className="p-2.5 rounded-md bg-card border border-border text-xs font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {query.formattedStatement ||
                      query.statement ||
                      `// Prisma ORM Operation\nawait prisma.${query.model || 'model'}.${query.operation || 'query'}({\n  /* Arguments and query conditions */\n});`}
                  </pre>
                </div>

                {/* Expanded Details: Span Attributes */}
                {isExpanded && (
                  <div className="p-3.5 border-t border-border bg-card space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Span Attributes & Metadata</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="rounded-md border border-border bg-muted/20 p-2 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Span ID</span>
                        <p className="text-foreground truncate">{query.id}</p>
                      </div>

                      <div className="rounded-md border border-border bg-muted/20 p-2 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase">Trace ID</span>
                        <p className="text-foreground truncate">{query.traceId}</p>
                      </div>
                    </div>

                    {query.attributes && Object.keys(query.attributes).length > 0 && (
                      <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden text-xs">
                        {Object.entries(query.attributes).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-3 p-2 gap-2 hover:bg-muted/30">
                            <span className="font-mono text-muted-foreground break-all text-[11px]">{k}</span>
                            <span className="col-span-2 font-mono text-foreground break-all text-[11px]">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
