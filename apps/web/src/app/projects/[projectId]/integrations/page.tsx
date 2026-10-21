'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight, CheckCircle2, Shield, Terminal, Database, Server } from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function IntegrationsPage() {
  const { currentProjectId } = useProjectTelemetry();

  const integrations = [
    {
      name: 'OpenTelemetry Node.js SDK',
      category: 'Runtime Instrumentation',
      description: 'Official OpenTelemetry distribution for automatic distributed trace propagation and span export.',
      icon: Terminal,
      status: 'AVAILABLE',
      href: `/projects/${currentProjectId}/settings/sdk`,
    },
    {
      name: 'Prisma ORM Instrumentation',
      category: 'Database Telemetry',
      description: 'SQL statement capture, slow query detection, parameter sanitization, and model profiling.',
      icon: Database,
      status: 'AVAILABLE',
      href: `/projects/${currentProjectId}/settings/sdk`,
    },
    {
      name: 'NestJS Interceptor Plugin',
      category: 'Framework Tracing',
      description: 'HTTP controller routing, execution duration, and uncaught exception capture.',
      icon: Server,
      status: 'AVAILABLE',
      href: `/projects/${currentProjectId}/settings/sdk`,
    },
    {
      name: 'Express.js Middleware',
      category: 'Framework Tracing',
      description: 'Request lifecycle telemetry, route params attribution, and HTTP status code tracking.',
      icon: Cpu,
      status: 'AVAILABLE',
      href: `/projects/${currentProjectId}/settings/sdk`,
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="border-b border-border pb-3.5">
        <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Framework & Cloud Integrations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect your application stacks, database layers, and infrastructure to the GhostTrace telemetry pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.name} className="flex flex-col justify-between hover:border-border/80 transition-all">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                      <span className="text-[11px] font-mono text-muted-foreground">{item.category}</span>
                    </div>
                  </div>
                  <Badge variant="default" size="sm">Active</Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>

                <div className="pt-2 border-t border-border/60 flex justify-end">
                  <Link href={item.href}>
                    <Button variant="outline" size="xs" className="text-xs">
                      <span>Setup Guide</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
