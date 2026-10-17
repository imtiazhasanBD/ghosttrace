import { Controller, Get } from '@nestjs/common';
import { DemoPrismaService } from './prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: DemoPrismaService) {}

  @Get()
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'ghosttrace-demo-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        status: 'degraded',
        service: 'ghosttrace-demo-api',
        database: 'error',
        error: e.message,
      };
    }
  }
}
