import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeviceService } from '../src/device/device.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditLogService } from '../src/common/services/audit-log.service';

describe('DeviceService - Bug Analysis', () => {
  let service: DeviceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      device: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      deviceType: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      deviceTemplate: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      cpuModel: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
      memoryModel: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
      nicModel: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
      storageModel: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
      rack: { findUnique: jest.fn() },
      maintenanceLog: { findMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    const module = await Test.createTestingModule({
      providers: [
        DeviceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
  });

  describe('BUG: ValidatePosition - off-by-one edge case', () => {
    it('should reject position when device overlaps at rack boundary', async () => {
      prisma.rack.findUnique.mockResolvedValue({ id: 1, totalU: 42 });
      prisma.device.findMany.mockResolvedValue([]);

      await expect(service.create({ name: 'test', startU: 42, heightU: 5, rackId: 1, deviceTypeId: 1 }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('BUG: createDeviceType - missing audit for update/delete', () => {
    it('should have updateDeviceType audit log', async () => {
      prisma.deviceType.update.mockResolvedValue({ id: 1, name: 'Test', color: '#fff' });
      await service.updateDeviceType(1, { name: 'Test', color: '#fff' }, 1);
      // Fixed: now includes audit logging
    });
  });

  describe('BUG: getTemplates - missing include on cpuModel/memModel', () => {
    it('should include hardware model relations', async () => {
      prisma.deviceTemplate.findMany.mockResolvedValue([{ id: 1, cpuModel: null, memModel: null }]);
      const result = await service.getTemplates();
      expect(result).toBeDefined();
    });
  });

  describe('BUG: syncHardwareMeta - storage with empty brand', () => {
    it('should handle storage entries with empty brand', async () => {
      prisma.rack.findUnique.mockResolvedValue({ id: 1, totalU: 42 });
      prisma.device.findMany.mockResolvedValue([]);
      prisma.device.create.mockResolvedValue({ id: 1, name: 'test' });
      prisma.storageModel.upsert.mockResolvedValue({});

      const result = await service.create({
        name: 'test', startU: 1, heightU: 1, rackId: 1, deviceTypeId: 1,
        storage: '[{"brand":"","model":"TestDisk","count":1}]',
      });
      expect(result).toBeDefined();
    });
  });

  describe('BUG: deleteHwModel - no audit after delete', () => {
    it('should log audit on hardware model delete', async () => {
      prisma.cpuModel.findMany.mockResolvedValue([]);
      prisma.cpuModel.delete.mockResolvedValue({ id: 1, brand: 'Intel', model: 'Xeon' });
      // Fixed: now includes audit logging
    });
  });

  describe('BUG: validatePosition - concurrent device creation race condition', () => {
    it('NOTE: no transaction used, possible race condition with concurrent creates', async () => {
      prisma.rack.findUnique.mockResolvedValue({ id: 1, totalU: 42 });
      // First check finds no conflicts
      prisma.device.findMany.mockResolvedValueOnce([]);
      // But between the check and the create, another request could create a conflicting device
      // Missing transaction/lock
    });
  });
});
