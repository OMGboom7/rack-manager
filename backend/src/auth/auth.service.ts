import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');
    const token = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });
    this.auditLog.log(user.id, 'LOGIN', 'Auth', user.id, `用户登录: ${user.username}`).catch(() => {});
    return { token, user: { id: user.id, username: user.username, realName: user.realName, role: user.role } };
  }

  async register(dto: { username: string; password: string; realName?: string }, byUserId?: number) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('用户名已存在');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hash, realName: dto.realName },
    });
    if (byUserId) {
      this.auditLog.log(byUserId, 'REGISTER', 'User', user.id, `注册用户: ${user.username}`).catch(() => {});
    }
    return user;
  }
}
