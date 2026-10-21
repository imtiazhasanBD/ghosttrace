'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser, registerUser, AuthUser } from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await registerUser(email, password, name);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser('demo@ghosttrace.io', 'Password123!');
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-2xl relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand & Title */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shadow-sm mb-1">
            <Lock className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            {tab === 'login' ? 'Sign in to GhostTrace' : 'Create an Account'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {tab === 'login'
              ? 'Access your telemetry dashboards, workspaces and projects'
              : 'Start monitoring backend traces, database queries and errors'}
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 p-2.5 text-xs text-primary font-medium transition-all group disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-foreground">1-Click Demo Architect Login</div>
              <div className="text-[10px] text-muted-foreground font-mono">demo@ghosttrace.io &bull; Password123!</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Tab switcher */}
        <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={cn(
              'flex-1 rounded-md py-1 font-medium transition-colors',
              tab === 'login'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={cn(
              'flex-1 rounded-md py-1 font-medium transition-colors',
              tab === 'register'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {tab === 'register' && (
            <div>
              <label className="block text-muted-foreground font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Imtiaz Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-muted-foreground font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted-foreground font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-8 mt-2 text-xs"
          >
            {isLoading
              ? 'Authenticating...'
              : tab === 'login'
              ? 'Sign In to Workspace'
              : 'Create Account & Workspace'}
          </Button>
        </form>
      </div>
    </div>
  );
};
