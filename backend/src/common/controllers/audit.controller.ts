import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto';

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '获取审计日志' })
  async findAll(@Query() pagination: PaginationDto, @Query('entity') entity?: string) {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 50;
    const where: any = entity ? { entity } : {};
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: { user: { select: { username: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }
}
