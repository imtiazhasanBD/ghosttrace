'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Key,
  Shield,
  Copy,
  Check,
  Server,
  Database,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const { currentProjectId, projects } = useProjectTelemetry();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-cyan-400" />
          Project Settings & Environment Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage project identifiers, telemetry retention, and OTLP ingestion parameters
        </p>
      </div>

      {/* Project Metadata Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Project Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Project Name
            </span>
            <p className="font-semibold text-slate-200">{currentProject?.name || 'Demo Project'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Slug Identifier
            </span>
            <p className="font-mono text-cyan-400">{currentProject?.slug || 'demo-project'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Project UUID
            </span>
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="select-all">{currentProjectId}</span>
              <button
                onClick={() => copyToClipboard(currentProjectId, 'projId')}
                className="text-slate-500 hover:text-white"
                title="Copy Project ID"
              >
                {copiedKey === 'projId' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Created Date
            </span>
            <p className="text-slate-400">
              {currentProject?.createdAt
                ? new Date(currentProject.createdAt).toLocaleDateString()
                : 'Initial Setup'}
            </p>
          </div>
        </div>
      </div>

      {/* Ingestion & Security Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">SDK & API Keys</h4>
              <p className="text-xs text-slate-400">Generate and revoke OTLP ingestion tokens</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure instrumentation for NestJS, Node.js, and Prisma services using cryptographic API keys.
          </p>
          <button
            onClick={() => router.push(`/projects/${currentProjectId}/settings/sdk`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Manage Ingestion Keys</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Zero-Trust Telemetry</h4>
              <p className="text-xs text-slate-400">Security & privacy protocols</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Telemetry is authenticated per span via SHA-256 key hashing with automated PII redaction rules.
          </p>
          <div className="text-xs text-slate-500 font-mono">
            OTLP Endpoint: <strong className="text-slate-300">/v1/traces</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
