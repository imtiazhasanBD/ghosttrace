'use client';

import React, { useState, useEffect } from 'react';
import { SpanEntity } from '@ghosttrace/shared-types';
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              isError
                ? 'border-rose-500/30 bg-rose-950/40 text-rose-400'
                : 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400'
            }`}
          >
            {isError ? <AlertOctagon className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white truncate" title={span.name}>
              {span.name}
            </h3>
            <p className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Kind: <strong className="text-cyan-400">{span.kind}</strong></span>
              <span>&bull;</span>
              <span>
                Status:{' '}
                <strong className={isError ? 'text-rose-400' : 'text-emerald-400'}>
                  {span.statusCode}
                </strong>
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Timing and Identifier Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3 text-slate-500" /> Duration
            </span>
            <p className="font-mono text-base font-bold text-white">
              {span.durationMs.toFixed(2)} <span className="text-xs font-normal text-slate-400">ms</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
              <Layers className="h-3 w-3 text-slate-500" /> Span ID
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate">{span.id}</span>
              <button
                onClick={() => copyToClipboard(span.id, 'spanId')}
                className="text-slate-400 hover:text-white ml-1 shrink-0"
                title="Copy Span ID"
              >
                {copiedKey === 'spanId' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Root Cause & Exception Evidence Callout */}
        {isError && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
              <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Evidence: Span Execution Failure</span>
            </div>

            {span.statusMessage && (
              <p className="text-xs text-rose-200 bg-rose-950/70 p-2.5 rounded-lg border border-rose-800/40 font-mono leading-relaxed">
                {span.statusMessage}
              </p>
            )}

            {stackTrace && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-rose-400/90">Captured Stack Trace</span>
                  <button
                    onClick={() => copyToClipboard(stackTrace, 'stack')}
                    className="flex items-center gap-1 text-slate-300 hover:text-white rounded bg-slate-900 px-2 py-0.5 border border-slate-800"
                  >
                    {copiedKey === 'stack' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="max-h-64 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-rose-300/90 leading-relaxed border border-slate-800/80">
                  {stackTrace}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Attributes Section with Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Attributes ({allAttributes.length})</span>
            </div>

            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search attributes..."
                value={attrSearch}
                onChange={(e) => setAttrSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-2 rounded-md border border-slate-800 bg-slate-900 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {filteredAttributes.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 text-center text-xs text-slate-500">
              No matching attributes found.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60 overflow-hidden text-xs">
              {filteredAttributes.map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 p-2.5 gap-2 hover:bg-slate-800/30 transition-colors">
                  <span className="font-mono text-slate-400 break-all select-all text-[11px]">{key}</span>
                  <span className="col-span-2 font-mono text-slate-200 break-all select-all text-[11px]">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events / Annotations */}
        {span.events && span.events.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ListTree className="h-3.5 w-3.5 text-indigo-400" />
              <span>Span Events ({span.events.length})</span>
            </div>

            <div className="space-y-2">
              {span.events.map((evt, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-200">{evt.name}</span>
                    <span className="text-[10px] text-slate-500">{evt.timeUnixNano}</span>
                  </div>
                  {evt.attributes && Object.keys(evt.attributes).length > 0 && (
                    <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                      {JSON.stringify(evt.attributes, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
