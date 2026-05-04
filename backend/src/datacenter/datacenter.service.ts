import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import type { PaginationDto } from '../common/dto';

@Injectable()
export class DatacenterService {
  private readonly logger = new Logger(DatacenterService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const [data, total] = await Promise.all([
      this.prisma.datacenter.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          rows: { include: { racks: { include: { devices: { include: { deviceType: true } } } } } },
        },
      }),
      this.prisma.datacenter.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: number) {
    const dc = await this.prisma.datacenter.findUnique({
      where: { id },
      include: {
        rows: { include: { racks: { include: { devices: { include: { deviceType: true } } } } } },
      },
    });
    if (!dc) throw new NotFoundException('机房不存在');
    return dc;
  }

  async create(data: { name: string; location?: string }, userId?: number) {
    const dc = await this.prisma.datacenter.create({ data });
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'Datacenter', dc.id, `创建机房: ${dc.name}`).catch(() => {});
    }
    this.logger.log(`机房已创建: ${dc.name} (ID: ${dc.id})`);
    return dc;
  }

  async update(id: number, data: { name?: string; location?: string }, userId?: number) {
    const dc = await this.prisma.datacenter.update({ where: { id }, data });
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'Datacenter', dc.id, `更新机房: ${dc.name}`).catch(() => {});
    }
    return dc;
  }

  async remove(id: number, userId?: number) {
    const dc = await this.prisma.datacenter.delete({ where: { id } });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'Datacenter', dc.id, `删除机房: ${dc.name}`).catch(() => {});
    }
    this.logger.log(`机房已删除: ${dc.name} (ID: ${dc.id})`);
    return dc;
  }
}
