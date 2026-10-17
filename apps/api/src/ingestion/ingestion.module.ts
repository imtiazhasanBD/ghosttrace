import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Module({
  controllers: [IngestionController],
  providers: [IngestionService, ApiKeyGuard],
  exports: [IngestionService],
})
export class IngestionModule {}
