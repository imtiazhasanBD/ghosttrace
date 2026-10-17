import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ErrorGroupsService } from './error-groups.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/error-groups')
export class ErrorGroupsController {
  constructor(
    private readonly errorGroupsService: ErrorGroupsService,
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
  async getErrorGroups(@Query('projectId') projectId?: string) {
    const resolvedProjectId = await this.resolveDefaultProjectId(projectId);
    return this.errorGroupsService.listErrorGroups(resolvedProjectId);
  }
}
