'use client';

import React, { useEffect } from 'react';
import { TraceComparisonResult } from '@ghosttrace/shared-types';
import { X, GitCompare, ArrowRight, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Differential Trace Analysis</h2>
              <p className="text-xs text-slate-400">Evidence-based comparison between baseline and target traces</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !comparison ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Computing differential span tree between traces...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Base Trace Card */}
                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Baseline Trace (Reference)
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{comparison.baseTrace.id.slice(0, 16)}...</span>
                  </div>
                  <p className="text-sm font-bold text-slate-100">{comparison.baseTrace.rootSpanName}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" /> {comparison.baseTrace.durationMs.toFixed(1)} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" /> {comparison.baseTrace.spanCount} spans
                    </span>
                    <span className="text-emerald-400 font-semibold">{comparison.baseTrace.statusCode}</span>
                  </div>
                </div>

                {/* Target Trace Card */}
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Target Trace (Investigation)
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{comparison.targetTrace.id.slice(0, 16)}...</span>
                  </div>
                  <p className="text-sm font-bold text-slate-100">{comparison.targetTrace.rootSpanName}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" /> {comparison.targetTrace.durationMs.toFixed(1)} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" /> {comparison.targetTrace.spanCount} spans
                    </span>
                    <span className="text-rose-400 font-semibold">{comparison.targetTrace.statusCode}</span>
                  </div>
                </div>
              </div>

              {/* Differentials Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                  <span className="text-[11px] text-slate-400">Duration Delta</span>
                  <p
                    className={`text-base font-bold font-mono mt-0.5 ${
                      comparison.durationDiffMs > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {comparison.durationDiffMs > 0 ? `+${comparison.durationDiffMs}` : comparison.durationDiffMs} ms
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                  <span className="text-[11px] text-slate-400">Span Count Delta</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">
                    {comparison.spanCountDiff > 0 ? `+${comparison.spanCountDiff}` : comparison.spanCountDiff} spans
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center">
                  <span className="text-[11px] text-slate-400">Divergent Operations</span>
                  <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                    {comparison.divergentSpans.length}
                  </p>
                </div>
              </div>

              {/* Missing Spans Callout */}
              {comparison.missingSpansInTarget.length > 0 && (
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 space-y-2">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Operations Executed in Baseline but Missing in Target
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comparison.missingSpansInTarget.map((name) => (
                      <span
                        key={name}
                        className="rounded border border-amber-700/50 bg-amber-950/50 px-2 py-1 text-xs font-mono text-amber-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    These operations did not execute in the target trace, confirming early termination or pipeline abort before completion.
                  </p>
                </div>
              )}

              {/* Divergent Spans Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Detailed Operation Divergence
                </h4>
                {comparison.divergentSpans.length === 0 ? (
                  <p className="text-xs text-slate-400">No status or significant latency divergence detected across matching operations.</p>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/60 overflow-hidden text-xs">
                    {comparison.divergentSpans.map((div, i) => (
                      <div key={i} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white font-mono">{div.name}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                div.baseStatus === 'OK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                              }`}
                            >
                              Base: {div.baseStatus} ({div.baseDurationMs.toFixed(1)}ms)
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-500" />
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                div.targetStatus === 'OK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                              }`}
                            >
                              Target: {div.targetStatus} ({div.targetDurationMs.toFixed(1)}ms)
                            </span>
                          </div>
                        </div>

                        {div.errorMessageDiff?.target && (
                          <div className="rounded bg-rose-950/40 border border-rose-800/40 p-2 font-mono text-rose-300 text-[11px]">
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
