'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Play, Sparkles, ArrowLeft, Video, Download, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function PromoStudioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Film className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">GhostTrace Ad Promo Studio</h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Studio Beta
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate high-impact video reels, animated architecture diagrams, and social ad snippets from live telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white">
            <Download className="h-3.5 w-3.5" />
            <span>Export Clip</span>
          </Button>
        </div>
      </div>

      {/* Studio Preview Canvas */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-xl">
        <div className="aspect-video w-full bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-md">
            <div className="h-16 w-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Play className="h-7 w-7 translate-x-0.5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Evidence-First Observability in 30 Seconds</h3>
              <p className="text-xs text-slate-400">
                Turn microservice traces and slow database queries into cinema-grade developer promos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
