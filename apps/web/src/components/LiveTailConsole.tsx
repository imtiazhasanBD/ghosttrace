'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Radio,
  Play,
  Pause,
  Trash2,
  Filter,
  ArrowDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Search,
  Wifi,
  WifiOff,
  Layers,
} from 'lucide-react';
import { LiveTailEvent } from '@ghosttrace/shared-types';
import { getAuthToken } from '../lib/api';

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

  // Resume handler: flushes queued events into visible list
  const togglePause = () => {
    if (isPaused) {
      if (pausedQueue.length > 0) {
        setEvents((prev) => [...pausedQueue, ...prev].slice(0, 300));
        setPausedQueue([]);
      }
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
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Status filter
      if (statusFilter === 'ERRORS_ONLY' && evt.data.statusCode !== 'ERROR') return false;
      if (statusFilter === 'OK' && evt.data.statusCode !== 'OK') return false;
      if (statusFilter === 'SLOW_ONLY' && !evt.data.isSlow) return false;

      // Service filter
      if (serviceFilter !== 'ALL' && evt.data.serviceName !== serviceFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = evt.data.name.toLowerCase().includes(q);
        const matchesTrace = evt.data.traceId.toLowerCase().includes(q);
        const matchesSvc = evt.data.serviceName.toLowerCase().includes(q);
        const matchesMsg = evt.data.statusMessage?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesTrace && !matchesSvc && !matchesMsg) return false;
      }

      return true;
    });
  }, [events, statusFilter, serviceFilter, searchQuery]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Top Console Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">Live Telemetry Tail</h2>
          </div>

          {/* Connection Pill */}
          {connectionStatus === 'connected' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STREAMING
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              CONNECTING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800/60">
              <WifiOff className="h-3 w-3" />
              RECONNECTING
            </span>
          )}

          {isPaused && (
            <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800/60">
              PAUSED {pausedQueue.length > 0 ? `(${pausedQueue.length} queued)` : ''}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={togglePause}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Resume {pausedQueue.length > 0 ? `(${pausedQueue.length})` : ''}</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors flex items-center gap-1 ${
              autoScroll
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Auto-scroll to latest incoming events"
          >
            <ArrowDown className="h-3 w-3" />
            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={clearEvents}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Clear Event Log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-3 bg-slate-950 border-b border-slate-800/70 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search live events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-8 pr-2 rounded-md border border-slate-800 bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-7 px-2 rounded-md border border-slate-800 bg-slate-900 text-slate-300 outline-none text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ERRORS_ONLY">Errors Only</option>
            <option value="SLOW_ONLY">Slow Spans (≥50ms)</option>
            <option value="OK">Successful Only</option>
          </select>

          {/* Service Filter */}
          {services.length > 0 && (
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-7 px-2 rounded-md border border-slate-800 bg-slate-900 text-slate-300 outline-none text-xs"
            >
              <option value="ALL">All Services</option>
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          )}

          <span className="text-[11px] font-mono text-slate-500 pl-1">
            Showing {filteredEvents.length} events
          </span>
        </div>
      </div>

      {/* Streaming Event Feed */}
      <div
        ref={scrollContainerRef}
        className="h-80 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs"
      >
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-slate-500">
            <Radio className="h-6 w-6 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs">Listening for incoming OpenTelemetry traces and spans...</p>
            <p className="text-[11px] text-slate-600 font-sans">
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
                className={`flex items-center justify-between p-2.5 gap-3 hover:bg-slate-900/50 transition-colors ${
                  isError ? 'bg-rose-950/20' : ''
                }`}
              >
                {/* Left Meta: Timestamp, Status, Latency */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-[11px] select-all">{timeStr}</span>

                  {isError ? (
                    <span className="flex items-center gap-1 rounded bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800/80">
                      <AlertCircle className="h-3 w-3" />
                      ERROR
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="h-3 w-3" />
                      OK
                    </span>
                  )}

                  {evt.data.durationMs !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
                        evt.data.durationMs > 200
                          ? 'bg-rose-950/50 text-rose-300'
                          : evt.data.durationMs > 50
                          ? 'bg-amber-950/50 text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {evt.data.durationMs}ms
                    </span>
                  )}
                </div>

                {/* Center Meta: Service & Operation Name */}
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300 shrink-0">
                    {evt.data.serviceName}
                  </span>

                  {isSlow && (
                    <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-800/80 shrink-0 flex items-center gap-0.5">
                      <Database className="h-2.5 w-2.5" />
                      SLOW
                    </span>
                  )}

                  <span
                    className={`truncate text-xs ${
                      isError ? 'text-rose-200 font-semibold' : 'text-slate-200'
                    }`}
                    title={evt.data.name}
                  >
                    {evt.data.name}
                  </span>

                  {evt.data.statusMessage && (
                    <span className="text-rose-400/80 text-[11px] truncate hidden md:inline">
                      — {evt.data.statusMessage}
                    </span>
                  )}
                </div>

                {/* Right Action: Direct Trace Waterfall Link */}
                <div className="shrink-0">
                  <Link
                    href={`/projects/${projectId}/traces/${evt.data.traceId}`}
                    className="flex items-center gap-1 rounded bg-slate-800/70 hover:bg-slate-800 hover:text-white text-slate-400 px-2 py-0.5 text-[11px] transition-colors"
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
