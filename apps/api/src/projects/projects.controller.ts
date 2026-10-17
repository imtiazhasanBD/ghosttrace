import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    return this.projectsService.listProjects();
  }

  @Get(':id/api-keys')
  async getApiKeys(@Param('id') projectId: string) {
    return this.projectsService.listApiKeys(projectId);
  }

  @Post(':id/api-keys')
  async createApiKey(
    @Param('id') projectId: string,
    @Body('name') name: string,
  ) {
    return this.projectsService.createApiKey(projectId, name);
  }

  @Delete('api-keys/:keyId')
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.projectsService.revokeApiKey(keyId);
  }
}
