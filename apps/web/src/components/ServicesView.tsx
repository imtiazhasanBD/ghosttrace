'use client';

import React, { useState } from 'react';
import { TraceEntity, OverviewMetrics } from '@ghosttrace/shared-types';
import { Server, ArrowUpRight, AlertCircle, CheckCircle2, Clock, Search } from 'lucide-react';

interface ServicesViewProps {
  services: string[];
  traces: TraceEntity[];
  metrics: OverviewMetrics | null;
  onFilterByService: (serviceName: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  traces,
  onFilterByService,
}) => {
  const [search, setSearch] = useState('');

  // Compute per-service aggregated telemetry stats from real trace entities
  const serviceStats = services.map((serviceName) => {
    const serviceTraces = traces.filter((t) => t.serviceName === serviceName);
    const totalCount = serviceTraces.length;
    const errorCount = serviceTraces.filter((t) => t.statusCode === 'ERROR').length;
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    const durations = serviceTraces.map((t) => t.durationMs).sort((a, b) => a - b);
    const avgDuration = totalCount > 0 ? durations.reduce((a, b) => a + b, 0) / totalCount : 0;
    const p95Duration = totalCount > 0 ? durations[Math.floor(totalCount * 0.95)] || durations[totalCount - 1] : 0;

    const lastSeen = serviceTraces[0]?.createdAt || null;

    return {
      name: serviceName,
      totalCount,
      errorCount,
      errorRate,
      avgDuration,
      p95Duration,
      lastSeen,
      isHealthy: errorRate === 0,
    };
  });

  const filteredStats = serviceStats.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            Monitored Services & System Topography
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Active microservices reporting distributed telemetry and OpenTelemetry instrumentation
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-md border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredStats.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
            <Server className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No Services Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Telemetry from monitored backends will register services automatically as OTLP spans arrive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStats.map((service) => (
            <div
              key={service.name}
              className="rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-mono text-xs font-bold">
                      {service.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">{service.name}</h3>
                      <p className="text-[11px] text-slate-400">Node.js / OpenTelemetry</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold border ${
                      service.isHealthy
                        ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400'
                        : 'border-rose-800/60 bg-rose-950/40 text-rose-400'
                    }`}
                  >
                    {service.isHealthy ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Healthy
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Degraded
                      </>
                    )}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-medium text-slate-500">Traces</span>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">{service.totalCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-medium text-slate-500">Error Rate</span>
                    <p
                      className={`font-mono font-bold mt-0.5 ${
                        service.errorRate > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {service.errorRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-medium text-slate-500">p95 Latency</span>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">
                      {service.p95Duration.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">ms</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.lastSeen ? new Date(service.lastSeen).toLocaleTimeString() : 'N/A'}
                </span>

                <button
                  onClick={() => onFilterByService(service.name)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <span>Explore Traces</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
