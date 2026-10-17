import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import {
  ApiKeyCreatedResponse,
  ApiKeyMetadata,
  ProjectSummary,
} from '@ghosttrace/shared-types';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(): Promise<ProjectSummary[]> {
    const projects = await this.prisma.project.findMany({
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

  async createApiKey(projectId: string, name: string): Promise<ApiKeyCreatedResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
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

  async listApiKeys(projectId: string): Promise<ApiKeyMetadata[]> {
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

  async revokeApiKey(keyId: string): Promise<{ success: boolean; message: string }> {
    const key = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw new NotFoundException('API Key not found');

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: `API Key ${key.keyPrefix}... revoked successfully` };
  }
}
