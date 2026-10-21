import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';
  size?: 'default' | 'sm';
}

export function Badge({ className, variant = 'default', size = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-primary/15 text-primary border-primary/30',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'border-border text-foreground bg-transparent',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    destructive: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    muted: 'bg-muted text-muted-foreground border-border/50',
  };

  const sizeClasses = {
    default: 'px-2 py-0.5 text-xs',
    sm: 'px-1.5 py-0.2 text-[10px]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium border rounded transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

export function MethodBadge({ method, className }: { method: string; className?: string }) {
  const normalized = method.toUpperCase();
  let colorStyle = 'bg-muted text-muted-foreground border-border';

  if (normalized === 'GET') {
    colorStyle = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
  } else if (normalized === 'POST') {
    colorStyle = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  } else if (normalized === 'PUT' || normalized === 'PATCH') {
    colorStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  } else if (normalized === 'DELETE') {
    colorStyle = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold text-[10px] tracking-tight px-1.5 py-0.5 rounded border uppercase shrink-0',
        colorStyle,
        className
      )}
    >
      {normalized}
    </span>
  );
}
