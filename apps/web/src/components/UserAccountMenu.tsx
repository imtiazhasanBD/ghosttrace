'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User,
  Settings,
  BookOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';
import { useProjectTelemetry } from '../lib/ProjectTelemetryContext';
import { logoutUser } from '../lib/api';
import { AuthModal } from './AuthModal';
import { cn } from '../lib/utils';

export interface UserAccountMenuProps {
  variant?: 'header' | 'sidebar';
  collapsed?: boolean;
  className?: string;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  variant = 'header',
  collapsed = false,
  className,
}) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submenu, setSubmenu] = useState<'main' | 'appearance'>('main');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const {
    currentUser,
    setCurrentUser,
    currentProjectId,
    currentWorkspace,
    refreshData,
  } = useProjectTelemetry();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSubmenu('main');
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSubmenu('main');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsOpen(false);
    router.push('/');
  };

  const currentTheme = mounted ? theme || 'system' : 'system';

  // If not logged in
  if (!currentUser) {
    return (
      <div className={cn('relative', className)}>
        {variant === 'header' ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md bg-primary hover:bg-primary/90 px-2.5 sm:px-3 text-xs font-semibold text-primary-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Sign In</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className={cn(
              'w-full flex items-center gap-2 rounded-md border border-border/70 bg-card/50 hover:bg-accent text-xs font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed ? 'justify-center p-2' : 'px-2.5 py-2'
            )}
            title="Sign In to GhostTrace"
          >
            <User className="h-4 w-4 text-primary shrink-0" />
            {!collapsed && <span>Sign In</span>}
          </button>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(u) => {
            setCurrentUser(u);
            refreshData();
          }}
        />
      </div>
    );
  }

  const userInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* TRIGGER BUTTON */}
      {variant === 'header' ? (
        <button
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            if (!next) setSubmenu('main');
          }}
          className={cn(
            'flex items-center gap-1.5 h-8.5 sm:h-9 rounded-md border px-1.5 sm:px-2 text-xs text-foreground transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isOpen
              ? 'bg-accent text-accent-foreground border-border'
              : 'border-border/70 bg-card/50 hover:bg-accent hover:border-border'
          )}
          title={`User Profile: ${currentUser.name || currentUser.email}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <span className="hidden md:inline font-medium max-w-[85px] truncate">
            {currentUser.name}
          </span>
          <ChevronDown
            className={cn(
              'h-3 w-3 text-muted-foreground transition-transform duration-150 hidden sm:inline',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      ) : (
        <button
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            if (!next) setSubmenu('main');
          }}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left',
            collapsed ? 'justify-center p-2' : 'p-2',
            isOpen
              ? 'bg-accent text-accent-foreground border-border'
              : 'border-border/60 bg-card/50 hover:bg-accent/80 hover:border-border'
          )}
          title={collapsed ? `${currentUser.name} (${currentUser.email})` : undefined}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold flex items-center justify-center shrink-0">
            {userInitial}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 leading-tight">
              <div className="font-semibold text-foreground truncate text-xs">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                {currentUser.email}
              </div>
            </div>
          )}

          {!collapsed && (
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 shrink-0',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </button>
      )}

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          className={cn(
            'rounded-lg border border-border bg-popover text-popover-foreground p-1 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100',
            variant === 'header'
              ? 'absolute right-0 mt-1.5 w-60'
              : collapsed
              ? 'absolute left-full bottom-0 ml-2 w-60'
              : 'absolute bottom-full left-0 mb-1.5 w-full min-w-[220px]'
          )}
        >
          {/* Main User Menu */}
          {submenu === 'main' ? (
            <div className="space-y-0.5">
              {/* User Identity Info */}
              <div className="px-2.5 py-2 border-b border-border/80 space-y-0.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-semibold text-foreground truncate text-xs">
                    {currentUser.name}
                  </span>
                  {currentWorkspace?.role && (
                    <span className="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold font-mono text-primary border border-primary/20 uppercase tracking-wider shrink-0">
                      {currentWorkspace.role}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">
                  {currentUser.email}
                </div>
              </div>

              {/* Action Links */}
              <Link
                href={`/projects/${currentProjectId}/settings`}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Account Settings</span>
              </Link>

              <Link
                href={`/projects/${currentProjectId}/settings/sdk`}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span>SDK & Documentation</span>
              </Link>

              {/* Appearance Trigger */}
              <button
                onClick={() => setSubmenu('appearance')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {currentTheme === 'dark' ? (
                    <Moon className="h-3.5 w-3.5 text-cyan-400" />
                  ) : currentTheme === 'light' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>Appearance</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
                  <span>{currentTheme}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
                </div>
              </button>

              <div className="h-px bg-border my-1" />

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center justify-between"
              >
                <span>Sign Out</span>
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            /* Appearance Submenu */
            <div className="space-y-0.5">
              <button
                onClick={() => setSubmenu('main')}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Back</span>
              </button>
              <div className="h-px bg-border my-1" />
              <div className="px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Theme
              </div>
              <button
                onClick={() => {
                  setTheme('light');
                  setIsOpen(false);
                  setSubmenu('main');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                  currentTheme === 'light'
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Light</span>
                </div>
                {currentTheme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>

              <button
                onClick={() => {
                  setTheme('dark');
                  setIsOpen(false);
                  setSubmenu('main');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                  currentTheme === 'dark'
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Moon className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Dark</span>
                </div>
                {currentTheme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>

              <button
                onClick={() => {
                  setTheme('system');
                  setIsOpen(false);
                  setSubmenu('main');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors',
                  currentTheme === 'system'
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Laptop className="h-3.5 w-3.5 text-primary" />
                  <span>System</span>
                </div>
                {currentTheme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
