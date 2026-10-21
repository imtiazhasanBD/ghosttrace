import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none rounded-md';

    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:translate-y-[0.5px]',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
      outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      subtle: 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20',
    };

    const sizeClasses = {
      xs: 'h-6 px-2 text-[11px] rounded',
      sm: 'h-7 px-2.5 text-xs',
      default: 'h-8 px-3 text-xs',
      lg: 'h-10 px-4 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
