'use client';

import React, { useState } from 'react';
import { TraceEntity, OverviewMetrics } from '@ghosttrace/shared-types';
import { Server, ArrowUpRight, AlertCircle, CheckCircle2, Clock, Search, Layers, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Monitored Services & System Topography
            </h1>
            <Badge variant="default" size="sm" className="font-mono">
              {filteredStats.length} {filteredStats.length === 1 ? 'Service' : 'Services'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active microservices reporting distributed telemetry and OpenTelemetry instrumentation
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredStats.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground mx-auto">
            <Server className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No Services Detected</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Telemetry from instrumented backends will register services automatically as OTLP spans arrive.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStats.map((service) => (
            <Card
              key={service.name}
              className="hover:border-border/80 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold">
                      {service.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground font-mono">{service.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            service.isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                          )}
                        />
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {service.isHealthy ? 'Healthy' : `${service.errorRate.toFixed(1)}% Error Rate`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={service.isHealthy ? 'success' : 'destructive'} size="sm">
                    {service.isHealthy ? 'OK' : 'DEGRADED'}
                  </Badge>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-xs font-mono">
                  <div className="rounded-md bg-muted/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Traces</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{service.totalCount}</p>
                  </div>

                  <div className="rounded-md bg-muted/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Avg Latency</span>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {service.avgDuration.toFixed(0)} ms
                    </p>
                  </div>

                  <div className="rounded-md bg-muted/20 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">p95 Latency</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {service.p95Duration.toFixed(0)} ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-muted-foreground">
                  <span>
                    Last active:{' '}
                    {service.lastSeen ? new Date(service.lastSeen).toLocaleTimeString() : 'Recent'}
                  </span>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onFilterByService(service.name)}
                    className="text-[11px]"
                  >
                    <span>View Traces</span>
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
