'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser, registerUser, AuthUser } from '../lib/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand & Title */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 mb-2">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {tab === 'login' ? 'Sign in to GhostTrace' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {tab === 'login'
              ? 'Access your telemetry dashboards, workspaces and projects'
              : 'Start monitoring backend traces, database operations and errors'}
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 p-3 text-xs text-cyan-300 font-medium transition-all group disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <div className="text-left">
              <div className="font-semibold text-white">1-Click Demo Architect Login</div>
              <div className="text-[10px] text-cyan-400/80">demo@ghosttrace.io &bull; Password123!</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 font-semibold transition-colors ${
              tab === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 font-semibold transition-colors ${
              tab === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {tab === 'register' && (
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Imtiaz Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-cyan-600/20 mt-2"
          >
            {isLoading
              ? 'Authenticating...'
              : tab === 'login'
              ? 'Sign In to Workspace'
              : 'Create Account & Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
};
