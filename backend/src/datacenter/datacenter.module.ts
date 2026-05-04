import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { DatacenterService } from './datacenter.service';
import { DatacenterController } from './datacenter.controller';

@Module({
  controllers: [DatacenterController],
  providers: [DatacenterService, PrismaService, AuditLogService],
})
export class DatacenterModule {}
