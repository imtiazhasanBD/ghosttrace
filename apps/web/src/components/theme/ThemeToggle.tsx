'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-8 w-8 rounded-md border border-border bg-card/60 flex items-center justify-center opacity-70',
          className
        )}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ];

  const currentTheme = theme || 'system';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle theme"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className
        )}
        title={`Theme: ${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}`}
      >
        {currentTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-cyan-400" />
        ) : currentTheme === 'light' ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Laptop className="h-4 w-4 text-primary" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-lg border border-border bg-popover p-1 shadow-lg shadow-black/20 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Theme
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = currentTheme === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
