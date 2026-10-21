'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, AlertCircle, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TraceSearchInputProps {
  projectId: string;
  className?: string;
  onTriggerDialog?: () => void;
}

export function TraceSearchInput({
  projectId,
  className,
  onTriggerDialog,
}: TraceSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if it's a 16-32 char hex trace ID or a search keyword
    const isTraceId = /^[a-fA-F0-9]{16,32}$/.test(trimmed);
    if (isTraceId) {
      router.push(`/projects/${projectId}/traces/${trimmed}`);
    } else {
      router.push(`/projects/${projectId}/traces?search=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/80" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search traces, services, endpoints..."
        className="h-9 w-full rounded-md border border-border/70 bg-card/50 hover:bg-card/80 pl-9 pr-14 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:bg-card shadow-2xs"
      />
      {query ? (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            type="submit"
            className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="Submit search"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onTriggerDialog}
          className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/70 bg-muted/60 border border-border/50 hover:text-foreground transition-colors"
          title="Open search palette"
        >
          <span>{isMac ? '⌘' : 'Ctrl+'}</span>
          <span>K</span>
        </button>
      )}
    </form>
  );
}

/**
 * Fullscreen / modal search dialog for mobile and Cmd+K quick navigation
 */
export function TraceSearchDialog({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    onClose();

    const isTraceId = /^[a-fA-F0-9]{16,32}$/.test(trimmed);
    if (isTraceId) {
      router.push(`/projects/${projectId}/traces/${trimmed}`);
    } else {
      router.push(`/projects/${projectId}/traces?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const quickFilters = [
    { label: 'Error Traces', query: 'status:error', icon: AlertCircle },
    { label: 'Slow Queries (>100ms)', query: 'duration:>100ms', icon: Database },
    { label: 'Checkout Service', query: 'service:checkout-api', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex items-center border-b border-border px-4 py-3 gap-3"
        >
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traces, error signatures, endpoints, or paste a trace ID..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <span>Search</span>
            <CornerDownLeft className="h-3 w-3" />
          </button>
        </form>

        <div className="p-3 text-xs space-y-2 bg-muted/20">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Quick Filters & Jump
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {quickFilters.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleSearch(q.query)}
                  className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-card/60 hover:bg-accent text-left transition-colors text-xs text-foreground group"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="truncate">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/40 text-[11px] text-muted-foreground">
          <span>Tip: Paste 16-32 char hex ID to open waterfall directly</span>
          <span className="font-mono text-[10px]">ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
