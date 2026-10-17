import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';

@Injectable()
export class DemoPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    attachGhostTracePrismaMiddleware(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
