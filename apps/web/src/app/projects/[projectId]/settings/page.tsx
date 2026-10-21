'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Key,
  Shield,
  Copy,
  Check,
  Users,
  Briefcase,
  UserPlus,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import {
  fetchWorkspaceMembers,
  inviteWorkspaceMember,
  removeWorkspaceMember,
} from '../../../../lib/api';
import { WorkspaceMemberEntity } from '@ghosttrace/shared-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const { currentProjectId, projects, currentWorkspace, currentUser } = useProjectTelemetry();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Team state
  const [members, setMembers] = useState<WorkspaceMemberEntity[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const isOwnerOrAdmin =
    currentWorkspace?.role === 'OWNER' || currentWorkspace?.role === 'ADMIN';

  const loadMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setIsLoadingMembers(true);
    try {
      const data = await fetchWorkspaceMembers(currentWorkspace.id);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load workspace members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !currentWorkspace?.id) return;
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await inviteWorkspaceMember(currentWorkspace.id, inviteEmail, inviteRole);
      setInviteSuccess(`Successfully added ${inviteEmail} to ${currentWorkspace.name}`);
      setInviteEmail('');
      await loadMembers();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this workspace?`)) return;
    if (!currentWorkspace?.id) return;

    try {
      await removeWorkspaceMember(currentWorkspace.id, memberId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Project & Workspace Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage organization access, project telemetry IDs, and team permissions
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${currentProjectId}/settings/sdk`)}
          className="text-xs self-start sm:self-auto"
        >
          <Key className="h-3.5 w-3.5 mr-1.5 text-primary" />
          <span>Manage API Keys & SDK</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      {/* 1. Project Identity Card */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Project Telemetry Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Project Name</label>
              <div className="h-9 px-3 rounded-md border border-input bg-muted/20 flex items-center text-xs font-medium text-foreground">
                {currentProject?.name || 'Project'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Workspace</label>
              <div className="h-9 px-3 rounded-md border border-input bg-muted/20 flex items-center justify-between text-xs font-medium text-foreground">
                <span>{currentWorkspace?.name || 'Default Workspace'}</span>
                {currentWorkspace?.role && (
                  <Badge variant="default" size="sm" className="font-mono uppercase">
                    {currentWorkspace.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Project UUID (Telemetry Stream ID)</label>
            <div className="flex items-center gap-2">
              <div className="h-9 px-3 rounded-md border border-input bg-muted/20 flex-1 flex items-center font-mono text-xs text-foreground select-all overflow-hidden truncate">
                {currentProjectId}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentProjectId, 'projId')}
                className="h-9 px-3 shrink-0"
              >
                {copiedKey === 'projId' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                <span>{copiedKey === 'projId' ? 'Copied' : 'Copy ID'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Team Members Card */}
      <Card>
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Workspace Team Members
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Member Invite Form */}
          {isOwnerOrAdmin && (
            <form onSubmit={handleInviteMember} className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                Add Teammate to Workspace
              </span>

              {inviteError && (
                <div className="p-2 rounded border border-destructive/30 bg-destructive/10 text-xs text-destructive">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400">
                  {inviteSuccess}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 h-8 rounded-md border border-input bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring font-mono"
                >
                  <option value="MEMBER">Member (Read & Ingest)</option>
                  <option value="ADMIN">Admin (Manage Keys & Team)</option>
                </select>

                <Button
                  type="submit"
                  disabled={isInviting}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold shrink-0"
                >
                  {isInviting ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="rounded-md border border-border overflow-hidden">
            {isLoadingMembers ? (
              <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No team members found.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((m) => {
                  const isCurrent = currentUser?.id === m.userId;
                  return (
                    <div key={m.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                          {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{m.user?.name || m.user?.email || 'User'}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-muted-foreground font-mono">(You)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">{m.user?.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={m.role === 'OWNER' ? 'default' : m.role === 'ADMIN' ? 'info' : 'secondary'}
                          size="sm"
                          className="font-mono uppercase font-bold"
                        >
                          {m.role}
                        </Badge>

                        {isOwnerOrAdmin && m.role !== 'OWNER' && !isCurrent && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveMember(m.id, m.user?.email || 'this user')}
                            className="text-muted-foreground hover:text-destructive p-1"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
