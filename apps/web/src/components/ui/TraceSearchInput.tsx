'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TraceSearchInput({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if it's a 32-char hex trace ID or a search keyword
    const isTraceId = /^[a-fA-F0-9]{16,32}$/.test(trimmed);
    if (isTraceId) {
      router.push(`/projects/${projectId}/traces/${trimmed}`);
    } else {
      router.push(`/projects/${projectId}/traces?search=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search traces, services, errors..."
        className="h-8 w-full rounded-md border border-input bg-card/60 pl-8 pr-12 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      />
      {query && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            type="submit"
            className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Submit search"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </form>
  );
}
