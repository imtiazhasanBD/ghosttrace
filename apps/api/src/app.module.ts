import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { TracesModule } from './traces/traces.module';
import { ErrorGroupsModule } from './error-groups/error-groups.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { LiveTailModule } from './live-tail/live-tail.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    IngestionModule,
    TracesModule,
    ErrorGroupsModule,
    ProjectsModule,
    WorkspacesModule,
    LiveTailModule,
  ],
})
export class AppModule {}


