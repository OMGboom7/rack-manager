import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditLogService } from '../src/common/services/audit-log.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
    };
    jwt = { sign: jest.fn().mockReturnValue('fake-token') };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('BUG: should log audit on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'admin', password: 'hash', role: 'ADMIN' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await service.login('admin', 'password');
      expect(audit.log).toHaveBeenCalledWith(1, 'LOGIN', 'Auth', 1, expect.any(String));
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('bad', 'user')).rejects.toThrow(UnauthorizedException);
    });

    it('should include role in JWT payload', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'admin', password: 'hash', role: 'ADMIN' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await service.login('admin', 'password');
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin', role: 'ADMIN' });
    });
  });

  describe('register', () => {
    it('BUG: should NOT allow registering with existing username', async () => {
      // Currently the register method does NOT check for duplicate usernames
      // Prisma would throw a P2002 unique constraint violation, not caught
      prisma.user.create.mockResolvedValue({ id: 2, username: 'newuser' });
      const result = await service.register({ username: 'newuser', password: 'pass' });
      expect(result).toBeDefined();
      // No validation for duplicate username exists = potential 500 error from Prisma
    });

    it('should hash password before storing', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 2 });
      await service.register({ username: 'user2', password: 'secret' });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
    });
  });
});
