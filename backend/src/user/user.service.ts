import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import * as bcrypt from 'bcryptjs';
import type { PaginationDto } from '../common/dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, username: true, realName: true, role: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, pageSize };
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, realName: true, role: true, createdAt: true },
    });
  }

  async create(dto: { username: string; password: string; realName?: string; role?: string }, userId?: number) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hash, realName: dto.realName, role: dto.role },
      select: { id: true, username: true, realName: true, role: true },
    });
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'User', user.id, `创建用户: ${user.username}`).catch(() => {});
    }
    this.logger.log(`用户已创建: ${user.username}`);
    return user;
  }

  async update(id: number, dto: { realName?: string; role?: string; password?: string }, userId?: number) {
    const data: Record<string, unknown> = {};
    if (dto.realName !== undefined) data.realName = dto.realName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.update({
      where: { id },
      data: data as any,
      select: { id: true, username: true, realName: true, role: true },
    });
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'User', user.id, `更新用户: ${user.username}`).catch(() => {});
    }
    return user;
  }

  async remove(id: number, userId?: number) {
    if (userId === id) throw new BadRequestException('不能删除自己的账户');
    const admins = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    const target = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === 'ADMIN' && admins <= 1) throw new BadRequestException('不能删除最后一个管理员');
    const user = await this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true, realName: true, role: true },
    });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'User', user.id, `删除用户: ${user.username}`).catch(() => {});
    }
    this.logger.log(`用户已删除: ${user.username}`);
    return user;
  }
}
