'use client';

import React, { useEffect } from 'react';
import { TraceComparisonResult } from '@ghosttrace/shared-types';
import { X, GitCompare, ArrowRight, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

interface TraceComparisonModalProps {
  comparison: TraceComparisonResult | null;
  isLoading: boolean;
  onClose: () => void;
}

export const TraceComparisonModal: React.FC<TraceComparisonModalProps> = ({
  comparison,
  isLoading,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!comparison && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-500">
              <GitCompare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Differential Trace Analysis</h2>
              <p className="text-xs text-muted-foreground">Evidence-based comparison between baseline and target traces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading || !comparison ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground">Computing differential span tree between traces...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Base Trace Card */}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Baseline Trace (Reference)
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{comparison.baseTrace.id.slice(0, 16)}...</span>
                  </div>
                  <p className="text-xs font-bold text-foreground font-mono">{comparison.baseTrace.rootSpanName}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {comparison.baseTrace.durationMs.toFixed(1)} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {comparison.baseTrace.spanCount} spans
                    </span>
                    <Badge variant="success" size="sm">
                      {comparison.baseTrace.statusCode}
                    </Badge>
                  </div>
                </div>

                {/* Target Trace Card */}
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Target Trace (Investigation)
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{comparison.targetTrace.id.slice(0, 16)}...</span>
                  </div>
                  <p className="text-xs font-bold text-foreground font-mono">{comparison.targetTrace.rootSpanName}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {comparison.targetTrace.durationMs.toFixed(1)} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {comparison.targetTrace.spanCount} spans
                    </span>
                    <Badge variant={comparison.targetTrace.statusCode === 'OK' ? 'success' : 'destructive'} size="sm">
                      {comparison.targetTrace.statusCode}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Differentials Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Duration Delta</span>
                  <p
                    className={cn(
                      'text-base font-bold font-mono mt-0.5',
                      comparison.durationDiffMs > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {comparison.durationDiffMs > 0 ? `+${comparison.durationDiffMs.toFixed(1)}` : comparison.durationDiffMs.toFixed(1)} ms
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Span Count Delta</span>
                  <p className="text-base font-bold font-mono text-foreground mt-0.5">
                    {comparison.spanCountDiff > 0 ? `+${comparison.spanCountDiff}` : comparison.spanCountDiff} spans
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Divergent Operations</span>
                  <p className="text-base font-bold font-mono text-primary mt-0.5">
                    {comparison.divergentSpans.length}
                  </p>
                </div>
              </div>

              {/* Missing Spans Callout */}
              {comparison.missingSpansInTarget.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Operations Executed in Baseline but Missing in Target
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comparison.missingSpansInTarget.map((name) => (
                      <span
                        key={name}
                        className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs font-mono text-amber-700 dark:text-amber-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    These operations did not execute in the target trace, confirming early termination or pipeline abort before completion.
                  </p>
                </div>
              )}

              {/* Divergent Spans Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detailed Operation Divergence
                </h4>
                {comparison.divergentSpans.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No status or significant latency divergence detected across matching operations.</p>
                ) : (
                  <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden text-xs">
                    {comparison.divergentSpans.map((div, i) => (
                      <div key={i} className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground font-mono">{div.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={div.baseStatus === 'OK' ? 'success' : 'destructive'}
                              size="sm"
                              className="font-mono"
                            >
                              Base: {div.baseStatus} ({div.baseDurationMs.toFixed(1)}ms)
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge
                              variant={div.targetStatus === 'OK' ? 'success' : 'destructive'}
                              size="sm"
                              className="font-mono"
                            >
                              Target: {div.targetStatus} ({div.targetDurationMs.toFixed(1)}ms)
                            </Badge>
                          </div>
                        </div>

                        {div.errorMessageDiff?.target && (
                          <div className="rounded border border-destructive/30 bg-destructive/10 p-2 font-mono text-destructive text-[11px]">
                            <strong>Target Error:</strong> {div.errorMessageDiff.target}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
