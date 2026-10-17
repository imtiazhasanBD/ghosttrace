import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TracesService } from './traces.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/traces')
export class TracesController {
  constructor(
    private readonly tracesService: TracesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveDefaultProjectId(projectId?: string): Promise<string> {
    if (projectId) return projectId;
    const defaultProject = await this.prisma.project.findFirst({
      where: { slug: 'demo-project' },
    });
    if (!defaultProject) {
      const anyProject = await this.prisma.project.findFirst();
      if (!anyProject) throw new BadRequestException('No projects available');
      return anyProject.id;
    }
    return defaultProject.id;
  }

  @Get()
  async getTraces(
    @Query('projectId') projectId?: string,
    @Query('serviceName') serviceName?: string,
    @Query('statusCode') statusCode?: any,
    @Query('minDurationMs') minDurationMs?: number,
    @Query('maxDurationMs') maxDurationMs?: number,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const resolvedProjectId = await this.resolveDefaultProjectId(projectId);
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
  async getOverview(@Query('projectId') projectId?: string) {
    const resolvedProjectId = await this.resolveDefaultProjectId(projectId);
    return this.tracesService.getOverviewMetrics(resolvedProjectId);
  }

  @Get('compare')
  async compareTraces(
    @Query('base') baseId: string,
    @Query('target') targetId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!baseId || !targetId) {
      throw new BadRequestException('Both base and target trace IDs must be specified');
    }
    return this.tracesService.compareTraces(baseId, targetId, projectId);
  }

  @Get(':id')
  async getTraceDetails(@Param('id') traceId: string) {
    return this.tracesService.getTraceDetails(traceId);
  }
}
