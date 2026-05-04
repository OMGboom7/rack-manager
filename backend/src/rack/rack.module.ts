import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { RackService } from './rack.service';
import { RowService } from './row.service';
import { RackController } from './rack.controller';

@Module({
  controllers: [RackController],
  providers: [RackService, RowService, PrismaService, AuditLogService],
})
export class RackModule {}
