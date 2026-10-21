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
import { loginUser, registerUser, fetchProjects, getAuthToken } from '../lib/api';
import { ThemeToggle } from '../components/theme/ThemeToggle';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-mono text-muted-foreground">Verifying GhostTrace workspace session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary font-sans">
      {/* Top Brand Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-5 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shadow-sm">
            <Activity className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-foreground">GhostTrace</span>
            <Badge variant="default" size="sm" className="font-mono">
              v1.0-prod
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Zero-Trust Multi-Tenant</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero & Auth Split View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Product Value & Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Evidence-First Observability & APM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Stop guessing in production.{' '}
            <span className="text-primary">Trace every span.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            GhostTrace isolates each workspace and project with end-to-end cryptographic security. Ingest OpenTelemetry traces from NestJS, Express, Prisma ORM, and microservices with zero configuration friction.
          </p>

          {/* Feature Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-border bg-card p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Multi-Tenant Workspaces</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Isolated projects, team roles (Owner, Admin, Member), and access controls.</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Hashed API Ingestion</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">SHA-256 salted keys with constant-time verification against timing attacks.</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Waterfall & Compare</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Differential side-by-side trace analysis to isolate bottlenecks instantly.</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">PII Redaction Guard</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Passwords, auth headers, cookies, and tokens scrubbed before ingestion.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5">
          <Card className="shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {authMode === 'login' ? 'Sign In to GhostTrace' : 'Create an Account'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {authMode === 'login'
                    ? 'Enter your credentials or use the 1-click demo account.'
                    : 'Get started monitoring backend traces in under 3 minutes.'}
                </p>
              </div>

              {/* 1-Click Demo Login Banner */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 p-2.5 text-xs text-primary font-medium transition-all group disabled:opacity-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">1-Click Demo Architect Login</div>
                    <div className="text-[10px] text-muted-foreground font-mono">demo@ghosttrace.io &bull; Password123!</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Or continue with</span>
                <div className="h-px bg-border flex-1" />
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className={cn(
                    'flex-1 rounded py-1 font-medium transition-colors',
                    authMode === 'login' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className={cn(
                    'flex-1 rounded py-1 font-medium transition-colors',
                    authMode === 'register' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Register
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 rounded-md border border-destructive/30 bg-destructive/10 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Imtiaz Ahmed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-8 px-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-8 px-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-8 px-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-8 mt-2 text-xs font-semibold">
                  {isLoading
                    ? 'Authenticating...'
                    : authMode === 'login'
                    ? 'Sign In to Workspace'
                    : 'Create Account & Workspace'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-5 sm:px-8 py-4 text-center text-xs text-muted-foreground font-mono">
        GhostTrace Observability &bull; Production Telemetry Collector & Evidence Engine
      </footer>
    </div>
  );
}
