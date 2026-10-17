'use client';

import React, { useState } from 'react';
import { ErrorGroupEntity } from '@ghosttrace/shared-types';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Hash,
  Search,
  ExternalLink,
  Layers,
  GitCompare,
  CheckCircle2,
} from 'lucide-react';

interface ErrorGroupsViewProps {
  errorGroups: ErrorGroupEntity[];
  onRefresh: () => void;
  onInvestigateTraces?: (serviceName: string, errorType: string) => void;
  onOpenCompare?: () => void;
}

export const ErrorGroupsView: React.FC<ErrorGroupsViewProps> = ({
  errorGroups,
  onInvestigateTraces,
  onOpenCompare,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('ALL');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Unique services in error groups
  const services = Array.from(new Set(errorGroups.map((g) => g.serviceName)));

  // Filtered error groups
  const filteredGroups = errorGroups.filter((group) => {
    const matchesSearch =
      group.errorType.toLowerCase().includes(search.toLowerCase()) ||
      group.message.toLowerCase().includes(search.toLowerCase()) ||
      group.serviceName.toLowerCase().includes(search.toLowerCase());

    const matchesService = selectedService === 'ALL' || group.serviceName === selectedService;

    return matchesSearch && matchesService;
  });

  if (errorGroups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Grouped Exceptions Detected</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          All monitored backend services are currently healthy. If an unhandled exception or failed span occurs, GhostTrace aggregates it by stack fingerprint here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Error Groups & Exception Signatures
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic stack-hash aggregation grouping related exceptions across distributed traces
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="flex items-center gap-1.5 rounded-md border border-indigo-800/60 bg-indigo-950/40 hover:bg-indigo-900/50 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors"
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare Success vs Failure</span>
            </button>
          )}

          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search error messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          {services.length > 1 && (
            <select
              aria-label="Filter errors by service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Services</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error Groups List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60 overflow-hidden">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No error groups match the active filter criteria.
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedId === group.id;

            return (
              <div key={group.id} className="transition-colors hover:bg-slate-800/20">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  className="flex items-center justify-between p-4 cursor-pointer text-xs"
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <span className="mt-1 text-slate-500 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-rose-400 font-mono">{group.errorType}</span>
                        <span className="rounded bg-slate-800 border border-slate-700/60 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
                          {group.serviceName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          First seen: {new Date(group.firstSeenAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-mono truncate" title={group.message}>
                        {group.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-3">
                    <div className="text-right">
                      <span className="rounded-full bg-rose-950/80 border border-rose-800/80 px-2.5 py-0.5 text-xs font-bold text-rose-300 font-mono">
                        {group.count} {group.count === 1 ? 'event' : 'events'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {new Date(group.lastSeenAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {onInvestigateTraces && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvestigateTraces(group.serviceName, group.errorType);
                        }}
                        className="hidden sm:flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 text-[11px] font-medium transition-colors"
                        title="Search related traces in Explorer"
                      >
                        <Layers className="h-3 w-3 text-cyan-400" />
                        <span>Traces</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Stack & Signature Evidence */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/70 p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-cyan-400" />
                        Stack Hash Fingerprint: <strong className="text-slate-200 select-all">{group.stackHash}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {group.sampleStackTrace && (
                          <button
                            onClick={() => copyToClipboard(group.sampleStackTrace!, group.id)}
                            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedKey === group.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedKey === group.id ? 'Copied' : 'Copy Stack'}</span>
                          </button>
                        )}

                        {onInvestigateTraces && (
                          <button
                            onClick={() => onInvestigateTraces(group.serviceName, group.errorType)}
                            className="flex items-center gap-1 rounded bg-cyan-950/50 border border-cyan-800/60 px-2.5 py-1 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Filter Traces for this Error</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {group.sampleStackTrace ? (
                      <pre className="max-h-64 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-rose-300/90 leading-relaxed">
                        {group.sampleStackTrace}
                      </pre>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No stack trace captured for this error group.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
