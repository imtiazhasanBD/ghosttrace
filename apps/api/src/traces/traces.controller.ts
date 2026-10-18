import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TracesService } from './traces.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/traces')
export class TracesController {
  constructor(
    private readonly tracesService: TracesService,
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
  async getTraces(
    @Request() req: any,
    @Query('projectId') projectId?: string,
    @Query('serviceName') serviceName?: string,
    @Query('statusCode') statusCode?: any,
    @Query('minDurationMs') minDurationMs?: number,
    @Query('maxDurationMs') maxDurationMs?: number,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const resolvedProjectId = await this.resolveDefaultProjectId(req.user.id, projectId);
    return this.tracesService.listTraces({
      projectId: resolvedProjectId,
      serviceName,
      statusCode,
      minDurationMs,
      maxDurationMs,
      search,
      limit,
      offset,
    });
  }

  @Get('overview')
  async getOverview(
    @Request() req: any,
    @Query('projectId') projectId?: string,
  ) {
    const resolvedProjectId = await this.resolveDefaultProjectId(req.user.id, projectId);
    return this.tracesService.getOverviewMetrics(resolvedProjectId);
  }

  @Get('compare')
  async compareTraces(
    @Request() req: any,
    @Query('base') baseId: string,
    @Query('target') targetId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!baseId || !targetId) {
      throw new BadRequestException('Both base and target trace IDs must be specified');
    }
    const resolvedProjectId = await this.resolveDefaultProjectId(req.user.id, projectId);
    return this.tracesService.compareTraces(baseId, targetId, resolvedProjectId);
  }

  @Get(':id')
  async getTraceDetails(
    @Request() req: any,
    @Param('id') traceId: string,
  ) {
    const trace = await this.tracesService.getTraceDetails(traceId);
    if (!trace) {
      throw new NotFoundException(`Trace ${traceId} not found`);
    }

    // Verify user has access to trace's project
    const project = await this.prisma.project.findUnique({
      where: { id: trace.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: req.user.id },
            },
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have access to this trace');
    }

    return trace;
  }
}
