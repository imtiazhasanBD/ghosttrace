'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { TraceEntity, SpanEntity } from '@ghosttrace/shared-types';
import { fetchTraceDetails } from '../../../../../lib/api';
import { TraceWaterfall } from '../../../../../components/TraceWaterfall';
import { SpanDetailDrawer } from '../../../../../components/SpanDetailDrawer';

export default function TraceDetailPage({
  params,
}: {
  params: { projectId: string; traceId: string };
}) {
  const router = useRouter();
  const [trace, setTrace] = useState<TraceEntity | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<SpanEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchTraceDetails(params.traceId)
      .then((t) => {
        setTrace(t);
        if (t.spans && t.spans.length > 0) {
          setSelectedSpan(t.spans[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load trace details:', err);
        setError('Trace not found or failed to load.');
      })
      .finally(() => setIsLoading(false));
  }, [params.traceId]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        <p className="text-xs text-slate-400 font-mono">Loading trace waterfall & spans...</p>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Trace Not Found</h3>
          <p className="text-xs text-slate-400 mt-1">{error || 'The requested trace ID was not found in the collector.'}</p>
        </div>
        <button
          onClick={() => router.push(`/projects/${params.projectId}/traces`)}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          Return to Trace Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => router.push(`/projects/${params.projectId}/traces`)}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Trace Explorer</span>
          </button>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-400 select-all">{params.traceId}</span>
        </div>

        <button
          onClick={() => router.push(`/projects/${params.projectId}/traces`)}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          Close Trace Details
        </button>
      </div>

      {/* Trace Waterfall Timeline */}
      <TraceWaterfall
        trace={trace}
        selectedSpanId={selectedSpan?.id || null}
        onSelectSpan={(span) => setSelectedSpan(span)}
      />

      {/* Slide-out Span Detail Drawer */}
      {selectedSpan && (
        <SpanDetailDrawer
          span={selectedSpan}
          onClose={() => setSelectedSpan(null)}
        />
      )}
    </div>
  );
}
