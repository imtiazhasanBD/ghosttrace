import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: {
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      createdAt: m.workspace.createdAt.toISOString(),
      membersCount: m.workspace._count.members,
      projectsCount: m.workspace._count.projects,
      projects: m.workspace.projects.map((p) => ({
        id: p.id,
        workspaceId: p.workspaceId,
        name: p.name,
        slug: p.slug,
        createdAt: p.createdAt.toISOString(),
      })),
    }));
  }

  async createWorkspace(userId: string, name: string) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Workspace name is required');
    }

    const cleanName = name.trim();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: cleanName,
          slug,
          members: {
            create: {
              userId,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      // Create initial project for this workspace
      const projectSlug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-api`;
      const project = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: `${cleanName} API`,
          slug: projectSlug,
        },
      });

      // Create default API key
      const randomHex = crypto.randomBytes(24).toString('hex');
      const rawApiKey = `gt_live_${randomHex}`;
      const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
      const keyPrefix = rawApiKey.substring(0, 16);

      await tx.apiKey.create({
        data: {
          projectId: project.id,
          name: 'Default Ingestion Key',
          keyPrefix,
          keyHash,
        },
      });

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: WorkspaceRole.OWNER,
        createdAt: workspace.createdAt.toISOString(),
        membersCount: 1,
        projectsCount: 1,
        projects: [
          {
            id: project.id,
            workspaceId: project.workspaceId,
            name: project.name,
            slug: project.slug,
            createdAt: project.createdAt.toISOString(),
          },
        ],
      };
    });
  }

  async getWorkspaceMembers(userId: string, workspaceId: string) {
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

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    }));
  }

  async addWorkspaceMember(
    callingUserId: string,
    workspaceId: string,
    email: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ) {
    const callerMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: callingUserId,
        },
      },
    });

    if (!callerMembership || (callerMembership.role !== WorkspaceRole.OWNER && callerMembership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace Owners and Admins can invite team members');
    }

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists or create an invited user account
    let targetUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!targetUser) {
      // Auto-provision an account for the invited user
      const tempPassword = `Invite-${crypto.randomBytes(6).toString('hex')}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const displayName = cleanEmail.split('@')[0];

      targetUser = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          name: displayName,
        },
      });
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      // Update role if changed
      const updated = await this.prisma.workspaceMember.update({
        where: { id: existingMember.id },
        data: { role },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      return {
        id: updated.id,
        workspaceId: updated.workspaceId,
        userId: updated.userId,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
        user: updated.user,
      };
    }

    const created = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return {
      id: created.id,
      workspaceId: created.workspaceId,
      userId: created.userId,
      role: created.role,
      createdAt: created.createdAt.toISOString(),
      user: created.user,
    };
  }

  async removeWorkspaceMember(
    callingUserId: string,
    workspaceId: string,
    memberId: string,
  ) {
    const callerMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: callingUserId,
        },
      },
    });

    if (!callerMembership || (callerMembership.role !== WorkspaceRole.OWNER && callerMembership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace Owners and Admins can remove team members');
    }

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace member not found');
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('The workspace Owner cannot be removed');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { success: true, removedMemberId: memberId };
  }

  async createWorkspaceProject(
    callingUserId: string,
    workspaceId: string,
    projectName: string,
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: callingUserId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    if (!projectName || projectName.trim().length === 0) {
      throw new BadRequestException('Project name is required');
    }

    const cleanName = projectName.trim();
    const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: cleanName,
          slug,
        },
      });

      // Generate default ingestion key
      const randomHex = crypto.randomBytes(24).toString('hex');
      const rawApiKey = `gt_live_${randomHex}`;
      const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
      const keyPrefix = rawApiKey.substring(0, 16);

      const apiKey = await tx.apiKey.create({
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
        defaultApiKey: {
          id: apiKey.id,
          keyPrefix: apiKey.keyPrefix,
          rawApiKey,
        },
      };
    });
  }
}
