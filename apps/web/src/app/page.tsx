'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';
import { loginUser, registerUser, fetchProjects, getAuthToken, fetchCurrentUser } from '../lib/api';

export default function RootPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }

    fetchProjects()
      .then((projects) => {
        if (projects && projects.length > 0) {
          router.replace(`/projects/${projects[0].id}/overview`);
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [router]);

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser('demo@ghosttrace.io', 'Password123!');
      const projects = await fetchProjects();
      if (projects && projects.length > 0) {
        router.push(`/projects/${projects[0].id}/overview`);
      } else {
        router.push('/projects/default/overview');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await loginUser(email, password);
        const projects = await fetchProjects();
        if (projects && projects.length > 0) {
          router.push(`/projects/${projects[0].id}/overview`);
        } else {
          router.push('/projects/default/overview');
        }
      } else {
        const res = await registerUser(email, password, name);
        const projects = await fetchProjects();
        if (projects && projects.length > 0) {
          router.push(`/projects/${projects[0].id}/overview`);
        } else {
          router.push('/projects/default/overview');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-xs font-mono text-slate-400">Verifying GhostTrace workspace session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white font-sans">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-500/20">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-mono text-base font-bold tracking-tight text-white">GhostTrace</span>
            <span className="ml-2 rounded border border-cyan-500/40 bg-cyan-950/60 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
              v1.0-prod
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Zero-Trust Multi-Tenant Architecture</span>
        </div>
      </header>

      {/* Main Hero & Auth Split View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Product Value & Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-xs text-cyan-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            Backend Observability & Evidence-First Debugging
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stop guessing in production.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Trace every span.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            GhostTrace isolates each workspace and project with end-to-end cryptographic security. Ingest OpenTelemetry traces from NestJS, Express, Prisma, and microservices with zero configuration friction.
          </p>

          {/* Feature Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Tenant Workspaces</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Isolated projects, team roles (Owner, Admin, Member) and access controls.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Hashed API Ingestion</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">SHA-256 salted keys with constant-time verification against timing attacks.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Waterfall & Compare</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Differential side-by-side trace analysis to isolate bottlenecks instantly.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">PII Redaction Guard</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Passwords, auth headers, cookies and cards scrubbed before ingestion.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/20 space-y-5">
            {/* 1-Click Demo Login Button */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Evaluation Access
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-between rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 hover:from-cyan-900/80 hover:to-indigo-900/80 p-3.5 text-xs text-cyan-200 font-semibold transition-all group shadow-lg shadow-cyan-950/30 disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <div className="text-left">
                    <div className="font-bold text-white">Explore Demo Architect Workspace</div>
                    <div className="text-[10px] text-cyan-300/80">Pre-seeded with real multi-span traces & errors</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider absolute">
                Or Continue With Account
              </span>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Workspace
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Sign in / Register Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Full Name / Organization</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera or Acme Engineering"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In to Workspace' : 'Create Isolated Workspace'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        GhostTrace Multi-Tenant Architecture &bull; OpenTelemetry Standard &bull; Zero Telemetry Leakage
      </footer>
    </div>
  );
}
