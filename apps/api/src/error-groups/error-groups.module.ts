import { Module } from '@nestjs/common';
import { ErrorGroupsController } from './error-groups.controller';
import { ErrorGroupsService } from './error-groups.service';

@Module({
  controllers: [ErrorGroupsController],
  providers: [ErrorGroupsService],
  exports: [ErrorGroupsService],
})
export class ErrorGroupsModule {}
