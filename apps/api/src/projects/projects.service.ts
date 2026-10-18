import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import * as crypto from 'crypto';
import {
  ApiKeyCreatedResponse,
  ApiKeyMetadata,
  ProjectSummary,
} from '@ghosttrace/shared-types';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listUserProjects(userId: string, workspaceId?: string): Promise<ProjectSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });

    const allowedWorkspaceIds = memberships.map((m) => m.workspaceId);

    if (allowedWorkspaceIds.length === 0) {
      return [];
    }

    if (workspaceId) {
      if (!allowedWorkspaceIds.includes(workspaceId)) {
        throw new ForbiddenException('You do not have access to this workspace');
      }
      const projects = await this.prisma.project.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'asc' },
      });
      return projects.map((p) => ({
        id: p.id,
        workspaceId: p.workspaceId,
        name: p.name,
        slug: p.slug,
        createdAt: p.createdAt.toISOString(),
      }));
    }

    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: allowedWorkspaceIds } },
      orderBy: { createdAt: 'asc' },
    });

    return projects.map((p) => ({
      id: p.id,
      workspaceId: p.workspaceId,
      name: p.name,
      slug: p.slug,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async checkUserProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return { project, role: membership.role };
  }

  async createProject(userId: string, workspaceId: string, name: string): Promise<ProjectSummary> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Project name is required');
    }

    const cleanName = name.trim();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name: cleanName,
        slug,
      },
    });

    // Auto-create initial ingestion key
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawApiKey = `gt_live_${randomHex}`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const keyPrefix = rawApiKey.substring(0, 16);

    await this.prisma.apiKey.create({
      data: {
        projectId: project.id,
        name: 'Default Ingestion Key',
        keyPrefix,
        keyHash,
      },
    });

    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      slug: project.slug,
      createdAt: project.createdAt.toISOString(),
    };
  }

  async createApiKey(userId: string, projectId: string, name: string): Promise<ApiKeyCreatedResponse> {
    const { project, role } = await this.checkUserProjectAccess(userId, projectId);

    if (role !== WorkspaceRole.OWNER && role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only workspace Owners and Admins can create API keys');
    }

    // Generate cryptographically secure API key
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawApiKey = `gt_live_${randomHex}`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const keyPrefix = rawApiKey.substring(0, 16);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        projectId,
        name: name || 'Default Ingestion Key',
        keyPrefix,
        keyHash,
      },
    });

    return {
      id: apiKey.id,
      projectId: apiKey.projectId,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      rawApiKey, // ONLY returned once
      createdAt: apiKey.createdAt.toISOString(),
    };
  }

  async listApiKeys(userId: string, projectId: string): Promise<ApiKeyMetadata[]> {
    await this.checkUserProjectAccess(userId, projectId);

    const keys = await this.prisma.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      projectId: k.projectId,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
      revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async revokeApiKey(userId: string, keyId: string): Promise<{ success: boolean; message: string }> {
    const key = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { project: true },
    });

    if (!key) throw new NotFoundException('API Key not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: key.project.workspaceId,
          userId,
        },
      },
    });

    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace Owners and Admins can revoke API keys');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: `API Key ${key.keyPrefix}... revoked successfully` };
  }
}
