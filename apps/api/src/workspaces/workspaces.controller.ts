import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getWorkspaces(@Request() req: any) {
    return this.workspacesService.listUserWorkspaces(req.user.id);
  }

  @Post()
  async createWorkspace(
    @Request() req: any,
    @Body('name') name: string,
  ) {
    return this.workspacesService.createWorkspace(req.user.id, name);
  }

  @Get(':id/members')
  async getMembers(
    @Request() req: any,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.getWorkspaceMembers(req.user.id, workspaceId);
  }

  @Post(':id/members')
  async addMember(
    @Request() req: any,
    @Param('id') workspaceId: string,
    @Body('email') email: string,
    @Body('role') role?: WorkspaceRole,
  ) {
    return this.workspacesService.addWorkspaceMember(
      req.user.id,
      workspaceId,
      email,
      role || WorkspaceRole.MEMBER,
    );
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Request() req: any,
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeWorkspaceMember(
      req.user.id,
      workspaceId,
      memberId,
    );
  }

  @Post(':id/projects')
  async createProject(
    @Request() req: any,
    @Param('id') workspaceId: string,
    @Body('name') name: string,
  ) {
    return this.workspacesService.createWorkspaceProject(
      req.user.id,
      workspaceId,
      name,
    );
  }
}
