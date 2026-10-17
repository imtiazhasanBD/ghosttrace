import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorGroupEntity } from '@ghosttrace/shared-types';

@Injectable()
export class ErrorGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async listErrorGroups(projectId: string): Promise<ErrorGroupEntity[]> {
    const groups = await this.prisma.errorGroup.findMany({
      where: { projectId },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
    });

    return groups.map((g) => ({
      id: g.id,
      projectId: g.projectId,
      serviceName: g.serviceName,
      errorType: g.errorType,
      message: g.message,
      stackHash: g.stackHash,
      sampleStackTrace: g.sampleStackTrace || undefined,
      firstSeenAt: g.firstSeenAt.toISOString(),
      lastSeenAt: g.lastSeenAt.toISOString(),
      count: g.count,
      status: g.status as any,
    }));
  }
}
