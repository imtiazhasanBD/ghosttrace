import { Module, Global } from '@nestjs/common';
import { LiveTailService } from './live-tail.service';

@Global()
@Module({
  providers: [LiveTailService],
  exports: [LiveTailService],
})
export class LiveTailModule {}
