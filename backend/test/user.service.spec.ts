import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserService } from '../src/user/user.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditLogService } from '../src/common/services/audit-log.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UserService - Bug Analysis', () => {
  let service: UserService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('BUG: findAll pagination returns raw array when pagination undefined', () => {
    it('should handle undefined pagination gracefully', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1, username: 'admin' }]);
      prisma.user.count.mockResolvedValue(1);
      const result = await service.findAll();
      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
    });
  });

  describe('BUG: update - partial update with empty object', () => {
    it('should handle empty update gracefully', async () => {
      prisma.user.update.mockResolvedValue({ id: 1, username: 'admin' });
      const result = await service.update(1, {});
      expect(result).toBeDefined();
    });
  });

  describe('FIXED: remove - self-deletion blocked', () => {
    it('should reject self-deletion', async () => {
      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject deleting last admin', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      await expect(service.remove(2, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
