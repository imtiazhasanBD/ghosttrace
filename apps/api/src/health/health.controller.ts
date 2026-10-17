import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'ghosttrace-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    };
  }

  @Get('ready')
  async getReadiness() {
    try {
      // Test DB connection with a quick query
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new HttpException(
        {
          status: 'unavailable',
          database: 'disconnected',
          error: err.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
