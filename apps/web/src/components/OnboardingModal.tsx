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
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

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
                scope: { name: '@ghosttrace/sdk-test-probe', version: '1.0.0' },
                spans: [
                  {
                    traceId: randomTraceId,
                    spanId: randomSpanId,
                    name: 'GhostTrace.Probe.VerifyConnection',
                    kind: 1, // INTERNAL
                    startTimeUnixNano: String(Date.now() * 1000000),
                    endTimeUnixNano: String((Date.now() + 15) * 1000000),
                    status: { code: 1 }, // OK
                    attributes: [
                      { key: 'probe.triggered_by', value: { stringValue: 'OnboardingModal.TestRunner' } },
                      { key: 'probe.version', value: { stringValue: 'v1.0-prod' } },
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
          'x-ghosttrace-key': activeKeyString,
        },
        body: JSON.stringify(testTrace),
      });

      if (!res.ok) {
        throw new Error('Ingestion probe rejected');
      }

      setReceivedTraceId(randomTraceId);
      setPingStatus('success');
      onKeysUpdated();
    } catch (err) {
      console.error(err);
      setPingStatus('failed');
    }
  };

  const steps = [
    { num: 1, title: 'Workspace', desc: 'Tenant isolation' },
    { num: 2, title: 'Environment', desc: 'Runtime cluster' },
    { num: 3, title: 'Install SDK', desc: 'OTel framework' },
    { num: 4, title: 'API Keys', desc: 'Hashed tokens' },
    { num: 5, title: 'Verify', desc: 'Ingestion test' },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 5-Step Process Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => {
              const isCurrent = activeStep === s.num;
              const isCompleted = activeStep > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all',
                    isCurrent
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold mb-1',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span className="font-semibold truncate w-full text-[11px]">{s.title}</span>
                  <span className="hidden md:inline text-[10px] text-muted-foreground truncate w-full">{s.desc}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: ACCOUNT & WORKSPACE */}
      {activeStep === 1 && (
        <Card className="animate-in fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Step 1 of 5</span>
                <h3 className="text-base font-bold text-foreground">Account & Team Workspace</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account owns team workspaces and enforces strict tenant isolation on every trace query.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-md border border-border bg-muted/20 p-3.5 space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Active User Account</span>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold flex items-center justify-center text-xs">
                    D
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-xs">Demo Architect</div>
                    <div className="text-[11px] text-muted-foreground font-mono">demo@ghosttrace.io</div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/20 p-3.5 space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Active Workspace</span>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="default" size="sm" className="font-mono font-bold">
                    Default Workspace
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">slug: default-workspace</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={() => setActiveStep(2)} className="text-xs">
                <span>Continue to Step 2</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PROJECT & ENVIRONMENT */}
      {activeStep === 2 && (
        <Card className="animate-in fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500">Step 2 of 5</span>
                <h3 className="text-base font-bold text-foreground">Project Identity & Environment</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose an application identifier and target runtime cluster for tagging traces.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Project Name (Application Service Name)</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. dentsoft-saas-server or orders-api"
                  className="w-full max-w-md h-8 rounded-md border border-input bg-card px-3 text-xs text-foreground font-mono outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Matches <code className="text-primary font-bold">GHOSTTRACE_SERVICE_NAME</code> in your environment variables.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Target Cluster Environment</label>
                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {(['development', 'staging', 'production'] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setSelectedEnv(env)}
                      className={cn(
                        'rounded-md p-2 text-xs font-semibold uppercase tracking-wider border transition-all text-center',
                        selectedEnv === env
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      )}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setActiveStep(1)} className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button size="sm" onClick={() => setActiveStep(3)} className="text-xs">
                <span>Continue to Step 3</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: SDK INSTALLATION */}
      {activeStep === 3 && (
        <Card className="animate-in fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Step 3 of 5</span>
                <h3 className="text-base font-bold text-foreground">Install GhostTrace SDK & Instrumentations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install the OpenTelemetry-based Node.js SDK and automatic framework plugins into your service.
                </p>
              </div>
            </div>

            {/* Install command */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-foreground">
                <span className="font-semibold">Terminal Install Command:</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    copyToClipboard(
                      'pnpm add @ghosttrace/sdk-node @ghosttrace/instrumentation-nest @ghosttrace/instrumentation-prisma',
                      'installCmd'
                    )
                  }
                  className="text-primary hover:text-primary/80"
                >
                  {copiedKey === 'installCmd' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  <span>{copiedKey === 'installCmd' ? 'Copied' : 'Copy Command'}</span>
                </Button>
              </div>
              <pre className="rounded-md border border-border bg-card p-3 text-xs font-mono text-primary select-all overflow-x-auto">
                pnpm add @ghosttrace/sdk-node @ghosttrace/instrumentation-nest @ghosttrace/instrumentation-prisma
              </pre>
            </div>

            {/* Code snippet tabs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Application Integration Code:</span>
                <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
                  <button
                    onClick={() => setSelectedSnippetTab('nest')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      selectedSnippetTab === 'nest' ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    NestJS (tracing.ts)
                  </button>
                  <button
                    onClick={() => setSelectedSnippetTab('prisma')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      selectedSnippetTab === 'prisma' ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Prisma ORM
                  </button>
                  <button
                    onClick={() => setSelectedSnippetTab('express')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      selectedSnippetTab === 'express' ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Express.js
                  </button>
                </div>
              </div>

              {selectedSnippetTab === 'nest' && (
                <div className="space-y-2.5">
                  <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>1. Create src/tracing.ts (must initialize before any module loads):</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          copyToClipboard(
                            `import { initGhostTrace } from '@ghosttrace/sdk-node';\n\ninitGhostTrace({\n  apiKey: process.env.GHOSTTRACE_API_KEY,\n  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',\n  serviceName: process.env.GHOSTTRACE_SERVICE_NAME || '${projectName}',\n});`,
                            'tracingCode'
                          )
                        }
                      >
                        {copiedKey === 'tracingCode' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                        <span>Copy</span>
                      </Button>
                    </div>
                    <pre className="text-xs font-mono text-primary leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`import { initGhostTrace } from '@ghosttrace/sdk-node';

initGhostTrace({
  apiKey: process.env.GHOSTTRACE_API_KEY,
  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',
  serviceName: process.env.GHOSTTRACE_SERVICE_NAME || '${projectName}',
});`}
                    </pre>
                  </div>

                  <div className="rounded-md border border-border bg-card p-3 space-y-1">
                    <div className="text-[11px] font-mono text-muted-foreground">
                      <span>2. In src/main.ts (add at line 1):</span>
                    </div>
                    <pre className="text-xs font-mono text-emerald-600 dark:text-emerald-400 leading-relaxed overflow-x-auto">
{`import 'dotenv/config';
import './tracing'; // <-- MUST be at the very top!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';`}
                    </pre>
                  </div>
                </div>
              )}

              {selectedSnippetTab === 'prisma' && (
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Attach to PrismaClient in prisma.service.ts:</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        copyToClipboard(
                          `import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';\n\nasync onModuleInit() {\n  await this.$connect();\n  attachGhostTracePrismaMiddleware(this);\n}`,
                          'prismaCode'
                        )
                      }
                    >
                      {copiedKey === 'prismaCode' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      <span>Copy</span>
                    </Button>
                  </div>
                  <pre className="text-xs font-mono text-amber-600 dark:text-amber-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';

async onModuleInit() {
  await this.$connect();
  // Automatically records model, operation, SQL statement & microsecond spans
  attachGhostTracePrismaMiddleware(this);
}`}
                  </pre>
                </div>
              )}

              {selectedSnippetTab === 'express' && (
                <div className="rounded-md border border-border bg-card p-3">
                  <pre className="text-xs font-mono text-indigo-600 dark:text-indigo-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
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

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setActiveStep(2)} className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button size="sm" onClick={() => setActiveStep(4)} className="text-xs">
                <span>Continue to Step 4</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: CONFIGURE API KEY */}
      {activeStep === 4 && (
        <Card className="animate-in fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">Step 4 of 5</span>
                <h3 className="text-base font-bold text-foreground">Configure Ingestion API Key in .env</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  GhostTrace uses zero-trust SHA-256 hashed keys. Place your key in server-side environment variables.
                </p>
              </div>
            </div>

            {/* .env snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-foreground">
                <span className="font-semibold">Copy to your backend .env file:</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    copyToClipboard(
                      `# GhostTrace Observability\nGHOSTTRACE_ENDPOINT="http://localhost:3001/v1/traces"\nGHOSTTRACE_API_KEY="${activeKeyString}"\nGHOSTTRACE_SERVICE_NAME="${projectName}"`,
                      'envSnippet'
                    )
                  }
                >
                  {copiedKey === 'envSnippet' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  <span>Copy .env</span>
                </Button>
              </div>
              <pre className="rounded-md border border-border bg-card p-3 text-xs font-mono text-foreground select-all overflow-x-auto whitespace-pre-wrap">
{`# GhostTrace Observability
GHOSTTRACE_ENDPOINT="http://localhost:3001/v1/traces"
GHOSTTRACE_API_KEY="${activeKeyString}"
GHOSTTRACE_SERVICE_NAME="${projectName}"`}
              </pre>
            </div>

            {/* Newly Created Key Alert */}
            {createdKey && (
              <div className="p-3.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>New API Key Created: {createdKey.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-xs bg-card p-2 rounded border border-border truncate text-foreground select-all">
                    {createdKey.rawApiKey}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => copyToClipboard(createdKey.rawApiKey, 'newKey')}
                  >
                    {copiedKey === 'newKey' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                    <span>Copy</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Save this key now. For your security, the raw key secret cannot be viewed again.
                </p>
              </div>
            )}

            {/* Generate Key Form */}
            <form onSubmit={handleGenerateKey} className="p-3.5 rounded-md border border-border bg-muted/20 space-y-2.5">
              <span className="text-xs font-semibold text-foreground">Create New Ingestion API Key</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. production-k8s-collector"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 h-8 rounded-md border border-input bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" disabled={isGenerating} size="sm" className="h-8 px-4 text-xs font-semibold shrink-0">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Key'}</span>
                </Button>
              </div>
            </form>

            {/* Active Keys List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Active Ingestion Keys ({apiKeys.length})</span>
              <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden text-xs font-mono">
                {apiKeys.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No API keys registered yet.</div>
                ) : (
                  apiKeys.map((k) => (
                    <div key={k.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/30">
                      <div>
                        <div className="font-semibold text-foreground font-sans">{k.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Prefix: <strong>{k.keyPrefix}...</strong> &bull; Created: {new Date(k.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRevoke(k.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Revoke API key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setActiveStep(3)} className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button size="sm" onClick={() => setActiveStep(5)} className="text-xs">
                <span>Continue to Step 5</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: VERIFY INGESTION */}
      {activeStep === 5 && (
        <Card className="animate-in fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step 5 of 5</span>
                <h3 className="text-base font-bold text-foreground">Test Ingestion & Verify Live Stream</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send a simulated OpenTelemetry test trace to verify network ingress and pipeline health.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-md border border-border bg-muted/20 text-center space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Pipeline Ingress Probe</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click the button below to dispatch a synthetic OTLP span to endpoint <code className="text-primary font-mono font-bold">http://localhost:3001/v1/traces</code>.
                </p>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={pingStatus === 'testing'}
                size="sm"
                className="font-semibold text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                <span>{pingStatus === 'testing' ? 'Transmitting OTLP Probe...' : 'Send Test Ingestion Probe'}</span>
              </Button>

              {pingStatus === 'success' && (
                <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 font-mono space-y-1">
                  <div className="font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Ingestion Pipeline Operational! Trace Ingested Successfully.</span>
                  </div>
                  {receivedTraceId && (
                    <div className="pt-1">
                      <a
                        href={`/projects/${projectId}/traces/${receivedTraceId}`}
                        className="underline hover:opacity-80 inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Open Ingested Probe Trace ({receivedTraceId.slice(0, 12)}...)</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {pingStatus === 'failed' && (
                <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-xs text-destructive font-mono">
                  Probe failed. Ensure the GhostTrace API collector is active on port 3001 and API key is valid.
                </div>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setActiveStep(4)} className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button size="sm" onClick={() => (window.location.href = `/projects/${projectId}/overview`)} className="text-xs">
                <span>Finish & Return to Overview</span>
                <Check className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
