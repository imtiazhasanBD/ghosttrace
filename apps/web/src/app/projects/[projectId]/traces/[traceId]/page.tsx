'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { SpanEntity } from '@ghosttrace/shared-types';
import { useTraceDetailQuery } from '../../../../../lib/hooks/useTelemetryQueries';
import { TraceWaterfall } from '../../../../../components/TraceWaterfall';
import { SpanDetailDrawer } from '../../../../../components/SpanDetailDrawer';
import { Button } from '../../../../../components/ui/Button';
import { Card, CardContent } from '../../../../../components/ui/Card';

export default function TraceDetailPage({
  params,
}: {
  params: { projectId: string; traceId: string };
}) {
  const router = useRouter();
  const [selectedSpan, setSelectedSpan] = useState<SpanEntity | null>(null);

  // Milestone B: TanStack Query for Trace Details
  const {
    data: trace,
    isLoading,
    isError,
    error: queryError,
  } = useTraceDetailQuery(params.traceId);

  useEffect(() => {
    if (trace?.spans && trace.spans.length > 0 && !selectedSpan) {
      setSelectedSpan(trace.spans[0]);
    }
  }, [trace, selectedSpan]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-mono">Loading trace waterfall & spans...</p>
      </div>
    );
  }

  if (isError || !trace) {
    return (
      <Card className="max-w-lg mx-auto text-center p-8 mt-12 space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive border border-destructive/20 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Trace Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {queryError?.message || 'The requested trace ID was not found in the telemetry collector.'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/projects/${params.projectId}/traces`)}
          variant="outline"
          size="sm"
        >
          Return to Trace Explorer
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => router.push(`/projects/${params.projectId}/traces`)}
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Trace Explorer</span>
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono text-muted-foreground text-[11px] select-all">{params.traceId}</span>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => router.push(`/projects/${params.projectId}/traces`)}
        >
          Close Waterfall
        </Button>
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
