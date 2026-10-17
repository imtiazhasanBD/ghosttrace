import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { WorkspaceRole } from '@prisma/client';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const workspaceName = dto.workspaceName || `${dto.name}'s Workspace`;
    const workspaceSlug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const rawApiKey = `gt_live_${crypto.randomBytes(16).toString('hex')}`;
    const keyHash = hashApiKey(rawApiKey);

    // Atomic creation of user, personal workspace, member relation, default project, and default ingestion key
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: workspaceSlug,
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      const project = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: 'Primary Application',
          slug: 'primary-app',
        },
      });

      const apiKey = await tx.apiKey.create({
        data: {
          projectId: project.id,
          name: 'Default Ingestion Key',
          keyPrefix: rawApiKey.slice(0, 14),
          keyHash,
        },
      });

      return { user, workspace, project, apiKey, rawApiKey };
    });

    const token = this.jwtService.sign({
      sub: result.user.id,
      email: result.user.email,
    });

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
      },
      project: {
        id: result.project.id,
        name: result.project.name,
        slug: result.project.slug,
      },
      apiKey: result.rawApiKey,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: {
              include: {
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    let isValid = false;
    try {
      isValid = await bcrypt.compare(dto.password, user.passwordHash);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const workspaces = user.memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      projects: m.workspace.projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
      })),
    }));

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspaces,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        memberships: {
          include: {
            workspace: {
              include: {
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const workspaces = user.memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      projects: m.workspace.projects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
      })),
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      workspaces,
    };
  }
}
