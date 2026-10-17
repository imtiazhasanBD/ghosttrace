import { Module } from '@nestjs/common';
import { GhostTraceNestModule } from '@ghosttrace/instrumentation-nest';
import { DemoPrismaService } from './prisma.service';
import { HealthController } from './health.controller';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [GhostTraceNestModule],
  controllers: [HealthController, CheckoutController],
  providers: [DemoPrismaService],
})
export class AppModule {}
