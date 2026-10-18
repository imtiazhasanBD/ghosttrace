import {
  Controller,
  Get,
  Query,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ErrorGroupsService } from './error-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/error-groups')
export class ErrorGroupsController {
  constructor(
    private readonly errorGroupsService: ErrorGroupsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveDefaultProjectId(userId: string, projectId?: string): Promise<string> {
    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!project || project.workspace.members.length === 0) {
        throw new ForbiddenException('You do not have access to this project');
      }

      return project.id;
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership || membership.workspace.projects.length === 0) {
      throw new BadRequestException('No projects available in your workspaces');
    }

    return membership.workspace.projects[0].id;
  }

  @Get()
  async getErrorGroups(
    @Request() req: any,
    @Query('projectId') projectId?: string,
  ) {
    const resolvedProjectId = await this.resolveDefaultProjectId(req.user.id, projectId);
    return this.errorGroupsService.listErrorGroups(resolvedProjectId);
  }
}
