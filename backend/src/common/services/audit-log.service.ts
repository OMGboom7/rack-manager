import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(userId: number, action: string, entity: string, entityId?: number, detail?: string) {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, entity, entityId, detail },
      });
    } catch (err) {
      this.logger.error(`审计日志写入失败: ${err}`);
    }
  }
}
