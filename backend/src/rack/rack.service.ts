import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import type { PaginationDto } from '../common/dto';

@Injectable()
export class RackService {
  private readonly logger = new Logger(RackService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll(pagination?: PaginationDto, search?: string) {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { row: { name: { contains: search, mode: 'insensitive' } } },
        { row: { datacenter: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.rack.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: { devices: { include: { deviceType: true, cpuModel: true, memModel: true } }, row: { include: { datacenter: true } } },
      }),
      this.prisma.rack.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: number) {
    const rack = await this.prisma.rack.findUnique({
      where: { id },
      include: { devices: { include: { deviceType: true, cpuModel: true, memModel: true }, orderBy: { startU: 'desc' } }, row: true },
    });
    if (!rack) throw new NotFoundException('机柜不存在');
    return rack;
  }

  findByRow(rowId: number) {
    return this.prisma.rack.findMany({
      where: { rowId },
      include: { devices: { include: { deviceType: true } } },
    });
  }

  async create(data: { name: string; rowId: number; totalU?: number; width?: number; purpose?: string }, userId?: number) {
    const rack = await this.prisma.rack.create({ data });
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'Rack', rack.id, `创建机柜: ${rack.name}`).catch(() => {});
    }
    this.logger.log(`机柜已创建: ${rack.name} (ID: ${rack.id})`);
    return rack;
  }

  async update(id: number, data: { name?: string; totalU?: number; width?: number; purpose?: string }, userId?: number) {
    const rack = await this.prisma.rack.update({ where: { id }, data });
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'Rack', rack.id, `更新机柜: ${rack.name}`).catch(() => {});
    }
    return rack;
  }

  async remove(id: number, userId?: number) {
    const rack = await this.prisma.rack.delete({ where: { id } });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'Rack', rack.id, `删除机柜: ${rack.name}`).catch(() => {});
    }
    this.logger.log(`机柜已删除: ${rack.name} (ID: ${rack.id})`);
    return rack;
  }
}
