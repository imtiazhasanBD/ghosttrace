'use client';

import React, { useState, useMemo } from 'react';
import { SpanEntity, TraceEntity } from '@ghosttrace/shared-types';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Globe,
  Layers,
  Cpu,
  Inbox,
  Copy,
  Check,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface TraceWaterfallProps {
  trace: TraceEntity;
  selectedSpanId: string | null;
  onSelectSpan: (span: SpanEntity) => void;
}

interface SpanTreeNode extends SpanEntity {
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
}

export const TraceWaterfall: React.FC<TraceWaterfallProps> = ({
  trace,
  selectedSpanId,
  onSelectSpan,
}) => {
  const [collapsedSpanIds, setCollapsedSpanIds] = useState<Set<string>>(new Set());
  const [copiedTraceId, setCopiedTraceId] = useState(false);
  const [hoveredSpan, setHoveredSpan] = useState<{
    span: SpanEntity;
    offsetMs: number;
    percentOfTrace: number;
    x: number;
    y: number;
  } | null>(null);

  const rawSpans = trace.spans || [];

  // Copy trace ID handler
  const handleCopyTraceId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trace.id);
    setCopiedTraceId(true);
    setTimeout(() => setCopiedTraceId(false), 2000);
  };

  // Build tree hierarchy and flattened node list with depth
  const { flattenedSpans, minStartNano, maxEndNano, totalNanoNum } = useMemo(() => {
    if (rawSpans.length === 0) {
      return { flattenedSpans: [], minStartNano: BigInt(0), maxEndNano: BigInt(0), totalNanoNum: 1 };
    }

    let minStart = BigInt(rawSpans[0].startTimeUnixNano);
    let maxEnd = BigInt(rawSpans[0].endTimeUnixNano);

    for (const s of rawSpans) {
      const start = BigInt(s.startTimeUnixNano);
      const end = BigInt(s.endTimeUnixNano);
      if (start < minStart) minStart = start;
      if (end > maxEnd) maxEnd = end;
    }

    const totalNano = maxEnd > minStart ? maxEnd - minStart : BigInt(1);
    const totalNum = Number(totalNano);

    // Map parent to children
    const childMap = new Map<string, SpanEntity[]>();
    const rootNodes: SpanEntity[] = [];

    for (const span of rawSpans) {
      if (span.parentSpanId) {
        const arr = childMap.get(span.parentSpanId) || [];
        arr.push(span);
        childMap.set(span.parentSpanId, arr);
      } else {
        rootNodes.push(span);
      }
    }

    // If no explicit roots found, treat spans with missing parents as roots
    if (rootNodes.length === 0 && rawSpans.length > 0) {
      rootNodes.push(rawSpans[0]);
    }

    // Flatten with depth and check collapsed state
    const flattened: SpanTreeNode[] = [];

    const traverse = (span: SpanEntity, depth: number) => {
      const children = childMap.get(span.id) || [];
      const hasChildren = children.length > 0;
      const isCollapsed = collapsedSpanIds.has(span.id);

      flattened.push({
        ...span,
        depth,
        hasChildren,
        isExpanded: !isCollapsed,
      });

      if (hasChildren && !isCollapsed) {
        for (const child of children) {
          traverse(child, depth + 1);
        }
      }
    };

    for (const root of rootNodes) {
      traverse(root, 0);
    }

    // Include any stranded spans not reached in tree
    const visitedIds = new Set(flattened.map((s) => s.id));
    for (const s of rawSpans) {
      if (!visitedIds.has(s.id)) {
        flattened.push({
          ...s,
          depth: 0,
          hasChildren: false,
        });
      }
    }

    return {
      flattenedSpans: flattened,
      minStartNano: minStart,
      maxEndNano: maxEnd,
      totalNanoNum: totalNum,
    };
  }, [rawSpans, collapsedSpanIds]);

  const toggleCollapse = (spanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSpanIds((prev) => {
      const next = new Set(prev);
      if (next.has(spanId)) {
        next.delete(spanId);
      } else {
        next.add(spanId);
      }
      return next;
    });
  };

  const getSpanTypeMeta = (span: SpanEntity) => {
    const isError = span.statusCode === 'ERROR';
    const nameLower = span.name.toLowerCase();

    if (span.kind === 'SERVER' || nameLower.startsWith('http') || span.attributes?.['http.method']) {
      return {
        label: 'HTTP',
        icon: Globe,
        barColor: isError ? 'bg-rose-500' : 'bg-sky-500',
        textColor: 'text-sky-600 dark:text-sky-400',
        badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400',
      };
    }
    if (span.kind === 'CLIENT' || nameLower.includes('prisma') || nameLower.includes('db') || span.attributes?.['db.system']) {
      return {
        label: 'DATABASE',
        icon: Database,
        barColor: isError ? 'bg-rose-500' : 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
      };
    }
    if (span.kind === 'PRODUCER' || span.kind === 'CONSUMER' || nameLower.includes('queue') || nameLower.includes('job')) {
      return {
        label: 'QUEUE',
        icon: Inbox,
        barColor: isError ? 'bg-rose-500' : 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      };
    }
    return {
      label: 'INTERNAL',
      icon: Cpu,
      barColor: isError ? 'bg-rose-500' : 'bg-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    };
  };

  if (rawSpans.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">No Spans Recorded for this Trace</p>
        <p className="text-xs text-muted-foreground">
          The trace root was captured, but individual execution spans have not arrived yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col shadow-sm">
      {/* 1. Trace Header Summary Banner */}
      <div className="border-b border-border bg-muted/30 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-muted-foreground">Trace:</span>
            <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border select-all">
              {trace.id}
            </span>
            <button
              onClick={handleCopyTraceId}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Copy Trace ID"
              aria-label="Copy Trace ID"
            >
              {copiedTraceId ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            <Badge variant={trace.statusCode === 'ERROR' ? 'destructive' : 'success'} size="sm">
              {trace.statusCode}
            </Badge>
          </div>

          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary font-mono">{trace.serviceName}</span>
            <span className="text-muted-foreground/40">&bull;</span>
            <span className="font-mono">{trace.rootSpanName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Total Latency: <strong className="font-mono">{trace.durationMs.toFixed(2)} ms</strong>
            </span>
          </div>

          <div className="h-3 w-px bg-border" />

          <div className="flex items-center gap-1.5 text-foreground">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Spans: <strong className="text-primary font-mono">{rawSpans.length}</strong>
            </span>
          </div>

          {trace.errorCount > 0 && (
            <>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  Exceptions: <strong className="font-mono">{trace.errorCount}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Shared Time Ruler */}
      <div className="border-b border-border bg-muted/20 px-4 sm:px-6 py-2 grid grid-cols-12 text-[10px] uppercase font-mono font-semibold text-muted-foreground">
        <div className="col-span-12 sm:col-span-5 flex items-center justify-between pr-6">
          <span>Hierarchy & Operation</span>
          <span className="font-normal">Duration</span>
        </div>
        <div className="hidden sm:grid col-span-7 grid-cols-4 text-right pr-2">
          <span className="text-left pl-3">0ms</span>
          <span>{(trace.durationMs * 0.33).toFixed(1)}ms</span>
          <span>{(trace.durationMs * 0.66).toFixed(1)}ms</span>
          <span>{trace.durationMs.toFixed(1)}ms</span>
        </div>
      </div>

      {/* 3. Spans List with Guides & Duration Bars */}
      <div className="divide-y divide-border/50 relative font-sans">
        {/* Background Vertical Grid Lines aligned with Ruler */}
        <div className="absolute inset-y-0 right-0 w-7/12 hidden sm:grid grid-cols-4 pointer-events-none z-0 pr-2">
          <div className="border-l border-border/30 h-full" />
          <div className="border-l border-border/30 h-full" />
          <div className="border-l border-border/30 h-full" />
          <div className="border-r border-border/30 h-full" />
        </div>

        {flattenedSpans.map((span) => {
          const spanStartNano = BigInt(span.startTimeUnixNano);
          const spanEndNano = BigInt(span.endTimeUnixNano);

          const offsetNano = Number(spanStartNano - minStartNano);
          const durationNano = Number(spanEndNano - spanStartNano);
          const offsetMs = offsetNano / 1000000;

          const leftPercent = Math.max(0, Math.min(100, (offsetNano / totalNanoNum) * 100));
          const widthPercent = Math.max(1.2, Math.min(100 - leftPercent, (durationNano / totalNanoNum) * 100));
          const percentOfTrace = (span.durationMs / (trace.durationMs || 1)) * 100;

          const isSelected = selectedSpanId === span.id;
          const isError = span.statusCode === 'ERROR';
          const meta = getSpanTypeMeta(span);
          const Icon = meta.icon;
          const isCollapsed = collapsedSpanIds.has(span.id);

          return (
            <div
              key={span.id}
              onClick={() => onSelectSpan(span)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredSpan({
                  span,
                  offsetMs,
                  percentOfTrace,
                  x: e.clientX,
                  y: rect.bottom + 4,
                });
              }}
              onMouseLeave={() => setHoveredSpan(null)}
              className={cn(
                'grid grid-cols-12 items-center px-4 sm:px-6 py-2 cursor-pointer text-xs transition-colors relative z-10',
                isSelected
                  ? 'bg-primary/10 border-l-2 border-primary font-medium'
                  : 'hover:bg-muted/40'
              )}
            >
              {/* Span Tree Node Column */}
              <div
                className="col-span-12 sm:col-span-5 flex items-center gap-1.5 pr-3 overflow-hidden"
                style={{ paddingLeft: `${Math.min(span.depth * 16, 96)}px` }}
              >
                {/* Expand / Collapse button if node has children */}
                {span.hasChildren ? (
                  <button
                    onClick={(e) => toggleCollapse(span.id, e)}
                    className="p-0.5 text-muted-foreground hover:text-foreground rounded shrink-0 transition-colors"
                  >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}

                {/* Span type indicator badge */}
                <span className={cn('p-1 rounded shrink-0 border', meta.badgeBg)}>
                  <Icon className="h-3 w-3" />
                </span>

                {/* Status indicator icon if error */}
                {isError && (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                )}

                {/* Span Name */}
                <span
                  className={cn(
                    'font-mono text-xs truncate',
                    isSelected ? 'text-primary font-bold' : 'text-foreground font-semibold',
                    isError && 'text-rose-600 dark:text-rose-400'
                  )}
                  title={span.name}
                >
                  {span.name}
                </span>

                {/* Duration Label */}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground shrink-0 pl-2">
                  {span.durationMs.toFixed(1)} ms
                </span>
              </div>

              {/* Waterfall Timeline Bar Column */}
              <div className="col-span-12 sm:col-span-7 h-5 flex items-center relative pl-3 pr-2">
                <div
                  className={cn(
                    'h-3 rounded relative transition-all duration-150',
                    meta.barColor,
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : 'opacity-90 hover:opacity-100'
                  )}
                  style={{
                    marginLeft: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  {/* Inline percent if bar wide enough */}
                  {widthPercent > 12 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white px-1 truncate">
                      {span.durationMs.toFixed(0)}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Hover Tooltip Overlay */}
      {hoveredSpan && (
        <div
          className="fixed z-50 rounded-lg border border-border bg-popover text-popover-foreground p-3 shadow-xl pointer-events-none text-xs space-y-1 font-mono max-w-sm animate-in fade-in"
          style={{
            top: `${hoveredSpan.y}px`,
            left: `${Math.min(hoveredSpan.x - 120, window.innerWidth - 300)}px`,
          }}
        >
          <div className="font-bold text-foreground truncate">{hoveredSpan.span.name}</div>
          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
            <span>Offset: +{hoveredSpan.offsetMs.toFixed(1)}ms</span>
            <span>Duration: {hoveredSpan.span.durationMs.toFixed(2)}ms</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {hoveredSpan.percentOfTrace.toFixed(1)}% of total trace execution
          </div>
          {hoveredSpan.span.statusCode === 'ERROR' && (
            <div className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              Exception: {hoveredSpan.span.statusMessage || 'Span marked with ERROR status'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
