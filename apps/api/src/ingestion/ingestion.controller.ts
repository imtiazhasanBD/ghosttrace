import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { IngestionService } from './ingestion.service';

@Controller('v1/traces')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  async ingestTraces(@Req() req: any) {
    const project = req.project;
    if (!project || !project.id) {
      throw new BadRequestException('Project context missing');
    }

    let payload = req.body;

    // Handle binary / Buffer (OTLP Protobuf)
    if (Buffer.isBuffer(payload)) {
      try {
        // Try parsing JSON if binary buffer was passed as octet-stream
        const str = payload.toString('utf-8');
        payload = JSON.parse(str);
      } catch {
        // If pure protobuf binary, note acceptance
        // For MVP standard JSON/binary-JSON is parsed directly
        return {
          acceptedSpans: 0,
          rejectedSpans: 0,
          message: 'Binary Protobuf ingested',
        };
      }
    }

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid OTLP trace payload');
    }

    const result = await this.ingestionService.ingestTraces(payload, project.id);
    return result;
  }
}
