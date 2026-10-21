'use client';

import React, { useState, useEffect } from 'react';
import { SpanEntity, isDatabaseSpan, parseDatabaseSpanInfo } from '@ghosttrace/shared-types';
import {
  X,
  Copy,
  Check,
  AlertOctagon,
  Terminal,
  ListTree,
  Code2,
  Search,
  Clock,
  Layers,
  Database,
  Globe,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface SpanDetailDrawerProps {
  span: SpanEntity | null;
  onClose: () => void;
}

export const SpanDetailDrawer: React.FC<SpanDetailDrawerProps> = ({ span, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [attrSearch, setAttrSearch] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!span) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isError = span.statusCode === 'ERROR';
  const isDb = isDatabaseSpan(span);
  const dbInfo = isDb ? parseDatabaseSpanInfo(span) : null;
  const isSlowDb = isDb && span.durationMs >= 50;

  const exceptionEvent = span.events?.find((e) => e.name === 'exception');
  const stackTrace = exceptionEvent?.attributes?.['exception.stacktrace'] || span.statusMessage;

  // Filter attributes
  const allAttributes = Object.entries(span.attributes || {});
  const filteredAttributes = allAttributes.filter(
    ([k, v]) =>
      k.toLowerCase().includes(attrSearch.toLowerCase()) ||
      String(v).toLowerCase().includes(attrSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/30">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
              isError
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : isDb
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                : 'border-primary/30 bg-primary/10 text-primary'
            )}
          >
            {isError ? (
              <AlertOctagon className="h-4 w-4" />
            ) : isDb ? (
              <Database className="h-4 w-4" />
            ) : (
              <Terminal className="h-4 w-4" />
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-bold text-foreground truncate font-mono" title={span.name}>
              {span.name}
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>Kind: <strong className="text-foreground">{span.kind}</strong></span>
              <span>&bull;</span>
              <span>
                Status:{' '}
                <strong className={isError ? 'text-destructive font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                  {span.statusCode}
                </strong>
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close span drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
        {/* Timing and IDs strip */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-md border border-border bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</span>
            <p className="text-sm font-bold text-foreground mt-0.5">{span.durationMs.toFixed(3)} ms</p>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Span ID</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-foreground font-bold">{span.id.slice(0, 12)}...</span>
              <button
                onClick={() => copyToClipboard(span.id, 'spanId')}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Copy Span ID"
              >
                {copiedKey === 'spanId' ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Database Query Special Callout */}
        {isDb && dbInfo && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-sans">
                <Database className="h-3.5 w-3.5" />
                Database Operation
              </span>
              {isSlowDb && (
                <Badge variant="warning" size="sm">
                  SLOW QUERY
                </Badge>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1">
              <div>
                System: <strong className="text-foreground">{dbInfo.dbSystem || 'SQL'}</strong>
                {dbInfo.model && (
                  <span>
                    {' '}&bull; Model: <strong className="text-foreground">{dbInfo.model}</strong>
                  </span>
                )}
                {dbInfo.operation && (
                  <span>
                    {' '}&bull; Operation: <strong className="text-foreground">{dbInfo.operation}</strong>
                  </span>
                )}
              </div>
            </div>

            {dbInfo.statement && (
              <div className="mt-2 relative">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1">
                  <span>SQL Statement</span>
                  <button
                    onClick={() => copyToClipboard(dbInfo.statement || '', 'sql')}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {copiedKey === 'sql' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>Copy SQL</span>
                  </button>
                </div>
                <pre className="rounded-md border border-border bg-muted/60 p-2.5 text-[11px] text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
                  {dbInfo.statement}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Stack Trace / Exception Box */}
        {isError && stackTrace && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-destructive flex items-center gap-1.5 font-sans">
                <AlertOctagon className="h-3.5 w-3.5" />
                Exception Stack Trace
              </span>
              <button
                onClick={() => copyToClipboard(stackTrace, 'stack')}
                className="text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1"
              >
                {copiedKey === 'stack' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>Copy Trace</span>
              </button>
            </div>
            <pre className="rounded-md border border-destructive/20 bg-card/60 p-2.5 text-[11px] text-destructive font-mono overflow-x-auto whitespace-pre-wrap max-h-56">
              {stackTrace}
            </pre>
          </div>
        )}

        {/* Span Attributes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-sans">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Span Attributes ({allAttributes.length})
            </span>
            <div className="relative w-44">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter attributes..."
                value={attrSearch}
                onChange={(e) => setAttrSearch(e.target.value)}
                className="w-full h-6 pl-6 pr-2 rounded-md border border-input bg-card text-[11px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
            {filteredAttributes.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-sans">
                No matching attributes found.
              </div>
            ) : (
              filteredAttributes.map(([key, val]) => {
                const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return (
                  <div key={key} className="p-2 hover:bg-muted/40 flex items-start justify-between gap-3 group">
                    <span className="text-primary font-bold shrink-0 max-w-[180px] truncate" title={key}>
                      {key}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-foreground truncate max-w-xs text-right" title={strVal}>
                        {strVal}
                      </span>
                      <button
                        onClick={() => copyToClipboard(strVal, key)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                        title="Copy attribute value"
                      >
                        {copiedKey === key ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
