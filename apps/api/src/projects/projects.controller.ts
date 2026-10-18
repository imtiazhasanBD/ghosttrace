import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(
    @Request() req: any,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.projectsService.listUserProjects(req.user.id, workspaceId);
  }

  @Post()
  async createProject(
    @Request() req: any,
    @Body('workspaceId') workspaceId: string,
    @Body('name') name: string,
  ) {
    return this.projectsService.createProject(req.user.id, workspaceId, name);
  }

  @Get(':id/api-keys')
  async getApiKeys(
    @Request() req: any,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.listApiKeys(req.user.id, projectId);
  }

  @Post(':id/api-keys')
  async createApiKey(
    @Request() req: any,
    @Param('id') projectId: string,
    @Body('name') name: string,
  ) {
    return this.projectsService.createApiKey(req.user.id, projectId, name);
  }

  @Delete('api-keys/:keyId')
  async revokeApiKey(
    @Request() req: any,
    @Param('keyId') keyId: string,
  ) {
    return this.projectsService.revokeApiKey(req.user.id, keyId);
  }
}
