'use client';

import React, { useState } from 'react';
import { ApiKeyMetadata, ApiKeyCreatedResponse } from '@ghosttrace/shared-types';
import { createApiKey, revokeApiKey } from '../lib/api';
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Terminal,
  ShieldAlert,
  Send,
  CheckCircle2,
  User,
  FolderGit2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Code2,
  Database,
  ExternalLink,
} from 'lucide-react';

interface OnboardingModalProps {
  projectId: string;
  apiKeys: ApiKeyMetadata[];
  onKeysUpdated: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  projectId,
  apiKeys,
  onKeysUpdated,
}) => {
  const [activeStep, setActiveStep] = useState<number>(3); // Default to Step 3 for projects already initialized
  const [selectedEnv, setSelectedEnv] = useState<'development' | 'staging' | 'production'>('production');
  const [projectName, setProjectName] = useState('dentsoft-saas-server');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKeyCreatedResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'nest' | 'prisma' | 'express'>('nest');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [receivedTraceId, setReceivedTraceId] = useState<string | null>(null);

  const activeKeyString = createdKey?.rawApiKey || apiKeys[0]?.keyPrefix + '...' || 'gt_live_default_demo_project_key_test_12345';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setIsGenerating(true);
      const res = await createApiKey(projectId, newKeyName.trim());
      setCreatedKey(res);
      setNewKeyName('');
      onKeysUpdated();
    } catch {
      alert('Failed to create API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Ingestion using this key will immediately fail.')) {
      return;
    }
    try {
      await revokeApiKey(keyId);
      onKeysUpdated();
    } catch {
      alert('Failed to revoke API key');
    }
  };

  const handleTestConnection = async () => {
    setPingStatus('testing');
    const randomTraceId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const randomSpanId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    try {
      const testTrace = {
        resourceSpans: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: projectName || 'my-backend-service' } },
                { key: 'deployment.environment', value: { stringValue: selectedEnv } },
              ],
            },
            scopeSpans: [
              {
                scope: { name: 'ghosttrace.onboarding-wizard' },
                spans: [
                  {
                    traceId: randomTraceId,
                    spanId: randomSpanId,
                    name: 'GhostTrace.ConnectionVerify',
                    kind: 1, // SERVER
                    startTimeUnixNano: String(BigInt(Date.now()) * BigInt(1000000)),
                    endTimeUnixNano: String(BigInt(Date.now() + 25) * BigInt(1000000)),
                    status: { code: 1 }, // OK
                    attributes: [
                      { key: 'http.status_code', value: { intValue: 200 } },
                      { key: 'probe.wizard_step', value: { stringValue: 'step_5_verified' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const res = await fetch('http://localhost:3001/v1/traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ghosttrace-key': createdKey?.rawApiKey || 'gt_live_default_demo_project_key_test_12345',
        },
        body: JSON.stringify(testTrace),
      });

      if (res.ok) {
        setPingStatus('success');
        setReceivedTraceId(randomTraceId);
      } else {
        setPingStatus('failed');
      }
    } catch {
      setPingStatus('failed');
    }
  };

  const steps = [
    { num: 1, title: 'Account & Workspace', desc: 'Sign up & team workspace' },
    { num: 2, title: 'Project & Environment', desc: 'App name & environment' },
    { num: 3, title: 'Install SDK', desc: 'npm / pnpm packages' },
    { num: 4, title: 'Configure API Key', desc: 'Secure .env variables' },
    { num: 5, title: 'Test Connection', desc: 'Live telemetry probe' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 5-Step Stepper Navigation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              GhostTrace Project Onboarding Wizard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow these 5 steps to connect any Node.js, NestJS or Express backend to GhostTrace
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
              disabled={activeStep === 5}
              className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-40 transition-colors shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper visual bar */}
        <div className="grid grid-cols-5 gap-2 relative">
          {steps.map((s) => {
            const isCompleted = activeStep > s.num;
            const isCurrent = activeStep === s.num;

            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all text-xs ${
                  isCurrent
                    ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                    : isCompleted
                    ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold mb-1.5 ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="font-semibold truncate w-full text-[11px]">{s.title}</span>
                <span className="hidden lg:inline text-[9px] text-slate-400 truncate w-full">{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: ACCOUNT & WORKSPACE */}
      {activeStep === 1 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">Step 1 of 5</span>
              <h3 className="text-base font-bold text-white">Account & Team Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your account owns team workspaces and enforces strict tenant isolation on every trace query.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Active User Account</span>
              <div className="flex items-center gap-3 pt-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  D
                </div>
                <div>
                  <div className="font-semibold text-white text-xs">Demo Architect</div>
                  <div className="text-[11px] text-slate-400 font-mono">demo@ghosttrace.io</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Active Workspace</span>
              <div className="flex items-center gap-2 pt-1">
                <span className="rounded bg-cyan-950 px-2 py-1 text-xs font-bold text-cyan-400 border border-cyan-800 font-mono">
                  Default Workspace
                </span>
                <span className="text-xs text-slate-500 font-mono">slug: default-workspace</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-colors"
            >
              <span>Continue to Step 2 (Project Setup)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROJECT & ENVIRONMENT */}
      {activeStep === 2 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">Step 2 of 5</span>
              <h3 className="text-base font-bold text-white">Project Identity & Environment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose an application identifier and target runtime cluster for tagging traces.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Name (Application Service Name)</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. dentsoft-saas-server or orders-api"
                className="w-full max-w-md h-9 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 font-mono outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This will match the <code className="text-cyan-400">GHOSTTRACE_SERVICE_NAME</code> in your environment variables.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Target Cluster Environment</label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {(['development', 'staging', 'production'] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setSelectedEnv(env)}
                    className={`rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                      selectedEnv === env
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-colors"
            >
              <span>Continue to Step 3 (SDK Installation)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SDK INSTALLATION */}
      {activeStep === 3 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">Step 3 of 5</span>
              <h3 className="text-base font-bold text-white">Install GhostTrace SDK & Instrumentations</h3>
              <p className="text-xs text-slate-400 mt-1">
                Install the OpenTelemetry-based Node.js SDK and automatic framework plugins into your service.
              </p>
            </div>
          </div>

          {/* Package manager install command */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Terminal Install Command:</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    'pnpm add @ghosttrace/sdk-node @ghosttrace/instrumentation-nest @ghosttrace/instrumentation-prisma',
                    'installCmd'
                  )
                }
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
              >
                {copiedKey === 'installCmd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey === 'installCmd' ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs font-mono text-cyan-300 select-all overflow-x-auto shadow-inner">
              pnpm add @ghosttrace/sdk-node @ghosttrace/instrumentation-nest @ghosttrace/instrumentation-prisma
            </pre>
          </div>

          {/* Code snippet tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Application Integration Code:</span>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
                <button
                  onClick={() => setSelectedSnippetTab('nest')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedSnippetTab === 'nest' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  src/tracing.ts & main.ts
                </button>
                <button
                  onClick={() => setSelectedSnippetTab('prisma')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedSnippetTab === 'prisma' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  Prisma Tracing
                </button>
                <button
                  onClick={() => setSelectedSnippetTab('express')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    selectedSnippetTab === 'express' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  Express.js Middleware
                </button>
              </div>
            </div>

            {selectedSnippetTab === 'nest' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>1. Create src/tracing.ts (must initialize before any other module loads):</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { initGhostTrace } from '@ghosttrace/sdk-node';\n\ninitGhostTrace({\n  apiKey: process.env.GHOSTTRACE_API_KEY,\n  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',\n  serviceName: process.env.GHOSTTRACE_SERVICE_NAME || '${projectName}',\n});`,
                          'tracingCode'
                        )
                      }
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'tracingCode' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto">
{`import { initGhostTrace } from '@ghosttrace/sdk-node';

initGhostTrace({
  apiKey: process.env.GHOSTTRACE_API_KEY,
  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',
  serviceName: process.env.GHOSTTRACE_SERVICE_NAME || '${projectName}',
});`}
                  </pre>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>2. In src/main.ts (add import at line 1):</span>
                  </div>
                  <pre className="text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
{`import 'dotenv/config';
import './tracing'; // <-- MUST be at the very top!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';`}
                  </pre>
                </div>
              </div>
            )}

            {selectedSnippetTab === 'prisma' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Attach to PrismaClient in prisma.service.ts:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';\n\nasync onModuleInit() {\n  await this.$connect();\n  attachGhostTracePrismaMiddleware(this);\n}`,
                        'prismaCode'
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'prismaCode' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-amber-300 leading-relaxed overflow-x-auto">
{`import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';

async onModuleInit() {
  await this.$connect();
  // Records model, operation, SQL table & latency microsecond spans
  attachGhostTracePrismaMiddleware(this);
}`}
                </pre>
              </div>
            )}

            {selectedSnippetTab === 'express' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <pre className="text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto">
{`import { initGhostTrace } from '@ghosttrace/sdk-node';
import express from 'express';

const { tracer } = initGhostTrace({
  apiKey: process.env.GHOSTTRACE_API_KEY,
  endpoint: 'http://localhost:3001/v1/traces',
  serviceName: '${projectName}',
});`}
                </pre>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-colors"
            >
              <span>Continue to Step 4 (Configure API Key)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIGURE API KEY */}
      {activeStep === 4 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">Step 4 of 5</span>
              <h3 className="text-base font-bold text-white">Configure Ingestion API Key in .env</h3>
              <p className="text-xs text-slate-400 mt-1">
                GhostTrace uses zero-trust key hashing. Place your key in server-side environment variables—never commit to git.
              </p>
            </div>
          </div>

          {/* Copyable .env snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Copy to your backend .env file:</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `# GhostTrace Observability\nGHOSTTRACE_ENDPOINT="http://localhost:3001/v1/traces"\nGHOSTTRACE_API_KEY="${activeKeyString}"\nGHOSTTRACE_SERVICE_NAME="${projectName}"`,
                    'envSnippet'
                  )
                }
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
              >
                {copiedKey === 'envSnippet' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey === 'envSnippet' ? 'Copied .env' : 'Copy .env Configuration'}</span>
              </button>
            </div>
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-cyan-300 select-all overflow-x-auto shadow-inner leading-relaxed">
{`# GhostTrace Observability
GHOSTTRACE_ENDPOINT="http://localhost:3001/v1/traces"
GHOSTTRACE_API_KEY="${activeKeyString}"
GHOSTTRACE_SERVICE_NAME="${projectName}"`}
            </pre>
          </div>

          {/* Zero-trust warning callout */}
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4 flex items-start gap-3 text-xs text-amber-300">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Security Best Practice</div>
              <p className="text-amber-200/80 leading-relaxed text-[11px]">
                Always add <code className="text-white">.env</code> to your <code className="text-white">.gitignore</code>. Ingestion keys are authenticated in constant time using SHA-256 and should only exist on your production/staging host.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={() => setActiveStep(5)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-colors"
            >
              <span>Continue to Step 5 (Test Connection)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: TEST CONNECTION */}
      {activeStep === 5 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">Step 5 of 5</span>
              <h3 className="text-base font-bold text-white">Test Connection & Verify Telemetry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch an end-to-end OTLP telemetry probe or send a real request from your service to confirm ingestion.
              </p>
            </div>
          </div>

          {/* Test Probe Action Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <p className="text-xs text-slate-300">
                Click below to send an authenticated OTLP Protobuf/JSON probe to <code className="text-cyan-400 font-mono">POST /v1/traces</code> with service <code className="text-white font-mono">{projectName}</code>.
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={pingStatus === 'testing'}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold shadow-xl transition-all ${
                pingStatus === 'success'
                  ? 'bg-emerald-600 text-white'
                  : pingStatus === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white'
              }`}
            >
              {pingStatus === 'testing' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Transmitting OpenTelemetry Probe...</span>
                </>
              ) : pingStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Connection Verified (200 OK)</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Transmit Connection Test Probe</span>
                </>
              )}
            </button>

            {/* Success Celebration Card */}
            {pingStatus === 'success' && (
              <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/30 p-5 text-left space-y-3 animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>GhostTrace Ingestion Successfully Verified!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your service <strong className="text-white font-mono">{projectName}</strong> is now streaming traces, HTTP spans, and exception evidence to the platform.
                </p>
                {receivedTraceId && (
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span>Verified Probe Trace ID: <strong className="text-cyan-400">{receivedTraceId}</strong></span>
                    <a
                      href={`/projects/${projectId}/traces`}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans font-semibold"
                    >
                      <span>View in Explorer</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <a
              href={`/projects/${projectId}/overview`}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors"
            >
              <span>Finish & Open Dashboard</span>
              <Check className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
