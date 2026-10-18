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
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-cyan-400" />
          Project & Workspace Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace membership, role-based access control (RBAC), and project identifiers
        </p>
      </div>

      {/* Workspace & Team RBAC Management */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Workspace: {currentWorkspace?.name || 'Default Workspace'}
              </h3>
              {currentWorkspace?.role && (
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider border border-cyan-800/40">
                  Your Role: {currentWorkspace.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Slug: <span className="font-mono text-cyan-400">{currentWorkspace?.slug}</span> &bull; ID: <span className="font-mono text-slate-400">{currentWorkspace?.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{members.length} Team Members</span>
          </div>
        </div>

        {/* Invite Member Form (Only for Owner / Admin) */}
        {isOwnerOrAdmin && (
          <form onSubmit={handleInviteMember} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <UserPlus className="h-4 w-4 text-cyan-400" />
              <span>Invite New Team Member</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
              />

              <select
                value={inviteRole}
                onChange={(e: any) => setInviteRole(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="MEMBER">Member (View & Debug Traces)</option>
                <option value="ADMIN">Admin (Manage Projects & Keys)</option>
              </select>

              <button
                type="submit"
                disabled={isInviting}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50 shrink-0"
              >
                {isInviting ? 'Inviting...' : 'Add Member'}
              </button>
            </div>

            {inviteSuccess && (
              <p className="text-[11px] text-emerald-400 font-medium">{inviteSuccess}</p>
            )}
            {inviteError && (
              <p className="text-[11px] text-rose-400 font-medium">{inviteError}</p>
            )}
          </form>
        )}

        {/* Team Members List */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Members & Roles
          </div>

          {isLoadingMembers ? (
            <div className="text-xs text-slate-500 font-mono py-2">Loading workspace members...</div>
          ) : (
            <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 text-xs hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-xs font-bold text-white flex items-center justify-center shadow-sm">
                      {member.user.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{member.user.name}</span>
                        {currentUser?.id === member.userId && (
                          <span className="text-[10px] text-cyan-400 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{member.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        member.role === 'OWNER'
                          ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                          : member.role === 'ADMIN'
                          ? 'border-indigo-500/40 bg-indigo-950/60 text-indigo-300'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {member.role}
                    </span>

                    {isOwnerOrAdmin && member.role !== 'OWNER' && currentUser?.id !== member.userId && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user.email)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Remove member from workspace"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Metadata Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Project Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Project Name
            </span>
            <p className="font-semibold text-slate-200">{currentProject?.name || 'Demo Project'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Slug Identifier
            </span>
            <p className="font-mono text-cyan-400">{currentProject?.slug || 'demo-project'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Project UUID
            </span>
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="select-all">{currentProjectId}</span>
              <button
                onClick={() => copyToClipboard(currentProjectId, 'projId')}
                className="text-slate-500 hover:text-white"
                title="Copy Project ID"
              >
                {copiedKey === 'projId' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Created Date
            </span>
            <p className="text-slate-400">
              {currentProject?.createdAt
                ? new Date(currentProject.createdAt).toLocaleDateString()
                : 'Initial Setup'}
            </p>
          </div>
        </div>
      </div>

      {/* Ingestion & Security Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">SDK & API Keys</h4>
              <p className="text-xs text-slate-400">Generate and revoke OTLP ingestion tokens</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure instrumentation for NestJS, Node.js, and Prisma services using cryptographic API keys.
          </p>
          <button
            onClick={() => router.push(`/projects/${currentProjectId}/settings/sdk`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Manage Ingestion Keys</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Zero-Trust Telemetry</h4>
              <p className="text-xs text-slate-400">Security & privacy protocols</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Telemetry is authenticated per span via SHA-256 key hashing with automated PII redaction rules.
          </p>
          <div className="text-xs text-slate-500 font-mono">
            OTLP Endpoint: <strong className="text-slate-300">/v1/traces</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
