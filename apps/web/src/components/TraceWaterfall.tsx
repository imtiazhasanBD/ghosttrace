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
      flattened.push({
        ...span,
        depth,
        hasChildren,
      });

      if (hasChildren && !collapsedSpanIds.has(span.id)) {
        for (const child of children) {
          traverse(child, depth + 1);
        }
      }
    };

    for (const root of rootNodes) {
      traverse(root, 0);
    }

    // Fallback: If some spans weren't traversed because of disjoint parent pointers, append them
    const traversedIds = new Set(flattened.map((f) => f.id));
    for (const s of rawSpans) {
      if (!traversedIds.has(s.id)) {
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
        barColor: isError ? 'bg-rose-500' : 'bg-cyan-500',
        textColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/50 border-cyan-800/60',
      };
    }
    if (span.kind === 'CLIENT' || nameLower.includes('prisma') || nameLower.includes('db') || span.attributes?.['db.system']) {
      return {
        label: 'DATABASE',
        icon: Database,
        barColor: isError ? 'bg-rose-500' : 'bg-amber-500',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-950/50 border-amber-800/60',
      };
    }
    if (span.kind === 'PRODUCER' || span.kind === 'CONSUMER' || nameLower.includes('queue') || nameLower.includes('job')) {
      return {
        label: 'QUEUE',
        icon: Inbox,
        barColor: isError ? 'bg-rose-500' : 'bg-emerald-500',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/50 border-emerald-800/60',
      };
    }
    return {
      label: 'INTERNAL',
      icon: Cpu,
      barColor: isError ? 'bg-rose-500' : 'bg-indigo-500',
      textColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-950/50 border-indigo-800/60',
    };
  };

  if (rawSpans.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">No Spans Recorded for this Trace</p>
        <p className="text-xs text-slate-500">
          The trace metadata exists, but span payloads may still be buffering in the collector.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden flex flex-col shadow-xl">
      {/* 1. Trace Header Summary Banner */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-slate-400">Trace:</span>
            <span className="font-mono text-xs font-bold text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">
              {trace.id}
            </span>
            <button
              onClick={handleCopyTraceId}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy Trace ID"
            >
              {copiedTraceId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                trace.statusCode === 'ERROR'
                  ? 'border-rose-800 bg-rose-950/80 text-rose-400'
                  : 'border-emerald-800 bg-emerald-950/80 text-emerald-400'
              }`}
            >
              {trace.statusCode}
            </span>
          </div>

          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono">{trace.serviceName}</span>
            <span className="text-slate-600">&bull;</span>
            <span>{trace.rootSpanName}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Total Latency: <strong className="text-white font-mono">{trace.durationMs.toFixed(2)} ms</strong>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1 text-slate-300">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Spans: <strong className="text-cyan-400 font-mono">{rawSpans.length}</strong>
            </span>
          </div>

          {trace.errorCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-1 text-rose-400">
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
      <div className="border-b border-slate-800/80 bg-slate-950/70 px-4 sm:px-6 py-2 grid grid-cols-12 text-[10px] uppercase font-mono font-semibold text-slate-400">
        <div className="col-span-12 sm:col-span-5 flex items-center justify-between pr-6">
          <span>Hierarchy & Operation</span>
          <span className="text-slate-500 font-normal">Duration</span>
        </div>
        <div className="hidden sm:grid col-span-7 grid-cols-4 text-right pr-2 text-slate-500">
          <span className="text-left pl-3">0ms</span>
          <span>{(trace.durationMs * 0.33).toFixed(1)}ms</span>
          <span>{(trace.durationMs * 0.66).toFixed(1)}ms</span>
          <span>{trace.durationMs.toFixed(1)}ms</span>
        </div>
      </div>

      {/* 3. Spans List with Guides & Duration Bars */}
      <div className="divide-y divide-slate-800/40 relative font-sans">
        {/* Background Vertical Grid Lines aligned with Ruler */}
        <div className="absolute inset-y-0 right-0 w-7/12 hidden sm:grid grid-cols-4 pointer-events-none z-0 pr-2">
          <div className="border-l border-slate-800/30 h-full" />
          <div className="border-l border-slate-800/30 h-full" />
          <div className="border-l border-slate-800/30 h-full" />
          <div className="border-r border-slate-800/30 h-full" />
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
              className={`grid grid-cols-12 items-center px-4 sm:px-6 py-2 cursor-pointer text-xs transition-colors relative z-10 ${
                isSelected
                  ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                  : 'hover:bg-slate-800/30'
              }`}
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
                    className="p-0.5 text-slate-500 hover:text-white rounded shrink-0 transition-colors"
                  >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}

                {/* Span type indicator badge */}
                <span className={`p-1 rounded shrink-0 border ${meta.badgeBg}`}>
                  <Icon className={`h-3 w-3 ${meta.textColor}`} />
                </span>

                {/* Name */}
                <span
                  className={`truncate font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}
                  title={span.name}
                >
                  {span.name}
                </span>

                {/* Error dot */}
                {isError && (
                  <span title={span.statusMessage || 'Span failed'}>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  </span>
                )}

                {/* Duration */}
                <span className="ml-auto text-[11px] font-mono text-slate-400 shrink-0 pl-1">
                  {span.durationMs.toFixed(1)}ms
                </span>
              </div>

              {/* Waterfall Duration Bar Column */}
              <div className="hidden sm:flex col-span-7 relative h-7 items-center pr-2">
                <div className="w-full h-2 bg-slate-800/40 rounded-full relative overflow-visible">
                  <div
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded transition-all flex items-center px-1.5 shadow-sm group ${
                      isError
                        ? 'bg-rose-500 shadow-rose-500/20'
                        : meta.barColor
                    } ${isSelected ? 'ring-2 ring-white/80' : ''}`}
                  >
                    <span className="text-[9px] font-mono text-slate-950 font-bold whitespace-nowrap overflow-hidden text-ellipsis select-none">
                      {widthPercent > 6 ? `${span.durationMs.toFixed(1)}ms` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredSpan && (
        <div
          className="fixed z-50 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md p-2.5 shadow-2xl pointer-events-none text-xs space-y-1 max-w-xs animate-in fade-in"
          style={{
            left: `${Math.min(hoveredSpan.x + 10, window.innerWidth - 280)}px`,
            top: `${Math.min(hoveredSpan.y, window.innerHeight - 150)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white truncate">{hoveredSpan.span.name}</span>
            <span
              className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                hoveredSpan.span.statusCode === 'ERROR' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
              }`}
            >
              {hoveredSpan.span.statusCode}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
            <div>Duration: <strong className="text-white">{hoveredSpan.span.durationMs.toFixed(2)} ms</strong> ({hoveredSpan.percentOfTrace.toFixed(1)}% of trace)</div>
            <div>Start Offset: <strong className="text-cyan-400">+{hoveredSpan.offsetMs.toFixed(2)} ms</strong></div>
            <div>Span Kind: <strong className="text-slate-300">{hoveredSpan.span.kind}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
