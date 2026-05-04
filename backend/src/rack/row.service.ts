import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';

@Injectable()
export class RowService {
  private readonly logger = new Logger(RowService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(data: { name: string; datacenterId: number }, userId?: number) {
    const row = await this.prisma.row.create({ data });
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'Row', row.id, `创建排: ${row.name}`).catch(() => {});
    }
    this.logger.log(`排已创建: ${row.name} (ID: ${row.id})`);
    return row;
  }

  async update(id: number, data: { name: string }, userId?: number) {
    const row = await this.prisma.row.update({ where: { id }, data });
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'Row', row.id, `更新排: ${row.name}`).catch(() => {});
    }
    return row;
  }

  async remove(id: number, userId?: number) {
    const row = await this.prisma.row.delete({ where: { id } });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'Row', row.id, `删除排: ${row.name}`).catch(() => {});
    }
    this.logger.log(`排已删除: ${row.name} (ID: ${row.id})`);
    return row;
  }
}
