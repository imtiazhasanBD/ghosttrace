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
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

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
      <Card className="p-12 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Grouped Exceptions Detected</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          All monitored backend services are currently healthy. If an unhandled exception or failed span occurs, GhostTrace aggregates it by cryptographic stack fingerprint here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Error Groups & Exception Signatures
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cryptographic stack-hash aggregation grouping related exceptions across distributed traces
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenCompare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCompare}
                className="text-xs font-semibold"
              >
                <GitCompare className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                <span>Compare Traces</span>
              </Button>
            )}

            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exceptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {services.length > 1 && (
              <select
                aria-label="Filter errors by service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring font-mono"
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
        </CardContent>
      </Card>

      {/* Error Groups List */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No error groups match the active filter criteria.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedId === group.id;

              return (
                <div key={group.id} className="transition-colors hover:bg-muted/30">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                    className="flex items-center justify-between p-4 cursor-pointer text-xs"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <span className="mt-1 text-muted-foreground shrink-0">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-xs">
                            {group.errorType}
                          </span>
                          <Badge variant="secondary" size="sm" className="font-mono">
                            {group.serviceName}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            First seen: {new Date(group.firstSeenAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-mono truncate" title={group.message}>
                          {group.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-3">
                      <div className="text-right">
                        <Badge variant="destructive" size="sm" className="font-mono font-bold">
                          {group.count} {group.count === 1 ? 'event' : 'events'}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end font-mono">
                          <Clock className="h-3 w-3" />
                          {new Date(group.lastSeenAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {onInvestigateTraces && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvestigateTraces(group.serviceName, group.errorType);
                          }}
                          className="hidden sm:flex text-[11px]"
                          title="Search related traces in Explorer"
                        >
                          <Layers className="h-3 w-3 mr-1 text-primary" />
                          <span>Traces</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Stack & Signature Evidence */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-primary" />
                          Stack Hash Fingerprint: <strong className="text-foreground select-all">{group.stackHash}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          {group.sampleStackTrace && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => copyToClipboard(group.sampleStackTrace!, group.id)}
                            >
                              {copiedKey === group.id ? (
                                <Check className="h-3 w-3 text-emerald-500 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              <span>{copiedKey === group.id ? 'Copied' : 'Copy Stack'}</span>
                            </Button>
                          )}

                          {onInvestigateTraces && (
                            <Button
                              variant="default"
                              size="xs"
                              onClick={() => onInvestigateTraces(group.serviceName, group.errorType)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span>Filter Traces for this Error</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {group.sampleStackTrace ? (
                        <pre className="max-h-64 overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed whitespace-pre-wrap">
                          {group.sampleStackTrace}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No stack trace captured for this error group.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
