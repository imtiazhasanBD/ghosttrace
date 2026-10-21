'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Radio,
  Play,
  Pause,
  Trash2,
  ArrowDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Database,
  Search,
  WifiOff,
} from 'lucide-react';
import { LiveTailEvent } from '@ghosttrace/shared-types';
import { getAuthToken } from '../lib/api';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LiveTailConsoleProps {
  projectId: string;
  services?: string[];
}

export const LiveTailConsole: React.FC<LiveTailConsoleProps> = ({ projectId, services = [] }) => {
  const [events, setEvents] = useState<LiveTailEvent[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedQueue, setPausedQueue] = useState<LiveTailEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ERRORS_ONLY' | 'SLOW_ONLY' | 'OK'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Setup SSE connection
  useEffect(() => {
    if (!projectId) return;

    const token = getAuthToken();
    const url = new URL(`${API_BASE}/api/v1/traces/live`);
    url.searchParams.set('projectId', projectId);
    if (token) {
      url.searchParams.set('token', token);
    }

    setConnectionStatus('connecting');
    const es = new EventSource(url.toString());
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.onmessage = (event) => {
      try {
        const parsed: LiveTailEvent = JSON.parse(event.data);
        if (parsed.type === 'heartbeat') return; // Ignore ping events

        if (isPaused) {
          setPausedQueue((prev) => [parsed, ...prev].slice(0, 200));
        } else {
          setEvents((prev) => [parsed, ...prev].slice(0, 300));
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [projectId, isPaused]);

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  // Resume handler
  const togglePause = () => {
    if (isPaused) {
      setEvents((prev) => [...pausedQueue, ...prev].slice(0, 300));
      setPausedQueue([]);
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const clearEvents = () => {
    setEvents([]);
    setPausedQueue([]);
  };

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (statusFilter === 'ERRORS_ONLY' && evt.data.statusCode !== 'ERROR') return false;
    if (statusFilter === 'OK' && evt.data.statusCode === 'ERROR') return false;
    if (statusFilter === 'SLOW_ONLY' && !evt.data.isSlow) return false;

    if (serviceFilter !== 'ALL' && evt.data.serviceName !== serviceFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = evt.data.name.toLowerCase().includes(q);
      const matchSvc = evt.data.serviceName.toLowerCase().includes(q);
      const matchTrace = evt.data.traceId.toLowerCase().includes(q);
      if (!matchName && !matchSvc && !matchTrace) return false;
    }

    return true;
  });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            <h3 className="text-xs font-bold text-foreground">Live Telemetry Tail</h3>
          </div>

          {/* Connection Pill */}
          {connectionStatus === 'connected' ? (
            <Badge variant="success" size="sm" className="font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STREAMING
            </Badge>
          ) : connectionStatus === 'connecting' ? (
            <Badge variant="default" size="sm" className="font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              CONNECTING
            </Badge>
          ) : (
            <Badge variant="destructive" size="sm" className="font-mono flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              RECONNECTING
            </Badge>
          )}

          {isPaused && (
            <Badge variant="warning" size="sm" className="font-mono">
              PAUSED {pausedQueue.length > 0 ? `(${pausedQueue.length} queued)` : ''}
            </Badge>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isPaused ? 'default' : 'secondary'}
            size="xs"
            onClick={togglePause}
            className="text-xs font-semibold"
          >
            {isPaused ? (
              <>
                <Play className="h-3 w-3 mr-1 fill-current" />
                <span>Resume {pausedQueue.length > 0 ? `(${pausedQueue.length})` : ''}</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                <span>Pause</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setAutoScroll(!autoScroll)}
            className="text-xs font-mono"
          >
            <ArrowDown className="h-3 w-3 mr-1" />
            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={clearEvents}
            className="text-muted-foreground hover:text-destructive p-1.5"
            title="Clear Event Log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-2.5 bg-card border-b border-border text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search live events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-2 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-7 px-2 rounded-md border border-input bg-card text-foreground outline-none text-xs font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="ERRORS_ONLY">Errors Only</option>
            <option value="SLOW_ONLY">Slow Spans (≥50ms)</option>
            <option value="OK">Successful Only</option>
          </select>

          {services.length > 0 && (
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-7 px-2 rounded-md border border-input bg-card text-foreground outline-none text-xs font-mono"
            >
              <option value="ALL">All Services</option>
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          )}

          <span className="text-[11px] font-mono text-muted-foreground pl-1">
            Showing {filteredEvents.length} events
          </span>
        </div>
      </div>

      {/* Streaming Event Feed */}
      <div
        ref={scrollContainerRef}
        className="h-80 overflow-y-auto divide-y divide-border/60 font-mono text-xs bg-muted/10"
      >
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-muted-foreground">
            <Radio className="h-6 w-6 mx-auto animate-pulse" />
            <p className="text-xs">Listening for incoming OpenTelemetry traces and spans...</p>
            <p className="text-[11px] font-sans">
              Trigger an API request or background job to see real-time events appear here.
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isError = evt.data.statusCode === 'ERROR';
            const isSlow = evt.data.isSlow;
            const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 3,
            });

            return (
              <div
                key={evt.id}
                className={cn(
                  'flex items-center justify-between p-2.5 gap-3 hover:bg-muted/40 transition-colors',
                  isError && 'bg-rose-500/10'
                )}
              >
                {/* Left Meta */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground text-[11px] select-all">{timeStr}</span>

                  {isError ? (
                    <Badge variant="destructive" size="sm">
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                      ERROR
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                      OK
                    </Badge>
                  )}

                  {evt.data.durationMs !== undefined && (
                    <span
                      className={cn(
                        'text-[11px] px-1.5 py-0.2 rounded font-bold border',
                        evt.data.durationMs > 200
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : evt.data.durationMs > 50
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-muted border-border text-muted-foreground'
                      )}
                    >
                      {evt.data.durationMs}ms
                    </span>
                  )}
                </div>

                {/* Center Meta */}
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <Badge variant="secondary" size="sm" className="font-mono shrink-0">
                    {evt.data.serviceName}
                  </Badge>

                  {isSlow && (
                    <Badge variant="warning" size="sm" className="font-mono shrink-0 flex items-center gap-0.5">
                      <Database className="h-2.5 w-2.5" />
                      SLOW
                    </Badge>
                  )}

                  <span
                    className={cn(
                      'truncate text-xs font-semibold',
                      isError ? 'text-destructive font-bold' : 'text-foreground'
                    )}
                    title={evt.data.name}
                  >
                    {evt.data.name}
                  </span>

                  {evt.data.statusMessage && (
                    <span className="text-rose-600 dark:text-rose-400 text-[11px] truncate hidden md:inline">
                      — {evt.data.statusMessage}
                    </span>
                  )}
                </div>

                {/* Right Action */}
                <div className="shrink-0">
                  <Link
                    href={`/projects/${projectId}/traces/${evt.data.traceId}`}
                    className="inline-flex items-center gap-1 rounded border border-border bg-card hover:bg-accent px-2 py-0.5 text-[11px] text-foreground transition-colors"
                    title="Open Trace Waterfall"
                  >
                    <span>Trace</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
