import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import type { PaginationDto } from '../common/dto';

interface DeviceCreateInput {
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  startU: number;
  heightU: number;
  rackId: number;
  deviceTypeId: number;
  status?: string;
  description?: string;
  tags?: string[];
  cpuModelId?: number;
  cpuCount?: number;
  memModelId?: number;
  memSize?: number;
  storage?: string;
  nic?: string;
}

interface DeviceUpdateInput {
  name?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  status?: string;
  startU?: number;
  heightU?: number;
  rackId?: number;
  deviceTypeId?: number;
  description?: string;
  tags?: string[];
  cpuModelId?: number;
  cpuCount?: number;
  memModelId?: number;
  memSize?: number;
  storage?: string;
  nic?: string;
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
      include: { deviceType: true, rack: true, cpuModel: true, memModel: true },
      orderBy: [{ rackId: 'asc' }, { startU: 'asc' }],
      }),
      this.prisma.device.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: number) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { deviceType: true, rack: { include: { row: { include: { datacenter: true } } } }, cpuModel: true, memModel: true },
    });
    if (!device) throw new NotFoundException('设备不存在');
    return device;
  }

  findByRack(rackId: number) {
    return this.prisma.device.findMany({
      where: { rackId },
      include: { deviceType: true },
      orderBy: { startU: 'asc' },
    });
  }

  async create(dto: DeviceCreateInput, userId?: number) {
    const data: Record<string, unknown> = { ...dto, heightU: dto.heightU ?? 1 };
    delete data.cpuBrandId;
    delete data.memBrandId;
    if (dto.tags) data.tags = JSON.stringify(dto.tags);
    const device = await this.prisma.$transaction(async (tx) => {
      await this.validatePosition(dto.rackId, dto.startU, dto.heightU ?? 1, undefined, tx);
      return tx.device.create({ data: data as any });
    });
    this.syncHardwareMeta(dto).catch((err) => this.logger.warn(`硬件元数据同步失败: ${err}`));
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'Device', device.id, `创建设备: ${device.name}`).catch(() => {});
    }
    this.logger.log(`设备已创建: ${device.name} (ID: ${device.id})`);
    return device;
  }

  async update(id: number, dto: DeviceUpdateInput, userId?: number) {
    const existing = await this.prisma.device.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('设备不存在');
    const rackId = dto.rackId ?? existing.rackId;
    const startU = dto.startU ?? existing.startU;
    const heightU = dto.heightU ?? existing.heightU;
    if (dto.startU != null || dto.heightU != null || dto.rackId != null) {
      await this.validatePosition(rackId, startU, heightU, id);
    }
    const data: Record<string, unknown> = { ...dto };
    delete data.cpuBrandId;
    delete data.memBrandId;
    delete data.deviceTypeId;
    if (dto.tags) data.tags = JSON.stringify(dto.tags);
    const device = await this.prisma.device.update({ where: { id }, data: data as any });
    this.syncHardwareMeta(dto).catch((err) => this.logger.warn(`硬件元数据同步失败: ${err}`));
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'Device', device.id, `更新设备: ${device.name}`).catch(() => {});
    }
    return device;
  }

  async remove(id: number, userId?: number) {
    const device = await this.prisma.device.delete({ where: { id } });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'Device', device.id, `删除设备: ${device.name}`).catch(() => {});
    }
    this.logger.log(`设备已删除: ${device.name} (ID: ${device.id})`);
    return device;
  }

  async getMetadata() {
    const devices = await this.prisma.device.findMany({
      select: { brand: true, model: true, deviceTypeId: true },
      where: { brand: { not: null }, model: { not: null } },
    });

    const brandsByType: Record<number, Set<string>> = {};
    const modelsByBrandType: Record<string, Record<number, Set<string>>> = {};
    const allBrands = new Set<string>();
    const allModelsByBrand: Record<string, Set<string>> = {};

    const seen = new Set<string>();
    for (const d of devices) {
      if (!d.brand || !d.model) continue;
      const key = `${d.brand}|${d.model}`;
      if (seen.has(key)) continue;
      seen.add(key);

      allBrands.add(d.brand);
      if (!allModelsByBrand[d.brand]) allModelsByBrand[d.brand] = new Set();
      allModelsByBrand[d.brand].add(d.model);

      if (!brandsByType[d.deviceTypeId]) brandsByType[d.deviceTypeId] = new Set();
      brandsByType[d.deviceTypeId].add(d.brand);

      if (!modelsByBrandType[d.brand]) modelsByBrandType[d.brand] = {};
      if (!modelsByBrandType[d.brand][d.deviceTypeId]) modelsByBrandType[d.brand][d.deviceTypeId] = new Set();
      modelsByBrandType[d.brand][d.deviceTypeId].add(d.model);
    }

    const toSorted = (s: Set<string>) => Array.from(s).sort();
    const brandsByTypeObj: Record<number, string[]> = {};
    for (const t of Object.keys(brandsByType)) brandsByTypeObj[+t] = toSorted(brandsByType[+t]);

    const modelsByBrandTypeObj: Record<string, Record<number, string[]>> = {};
    for (const b of Object.keys(modelsByBrandType)) {
      modelsByBrandTypeObj[b] = {};
      for (const t of Object.keys(modelsByBrandType[b])) {
        modelsByBrandTypeObj[b][+t] = toSorted(modelsByBrandType[b][+t]);
      }
    }

    const modelsByBrandObj: Record<string, string[]> = {};
    for (const b of Object.keys(allModelsByBrand)) {
      modelsByBrandObj[b] = toSorted(allModelsByBrand[b]);
    }

    const cpu = await this.prisma.cpuModel.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    const cpuModelSet = new Set<string>();
    const cpuBrandSet = new Set<string>();
    const cpuByBrand: Record<string, string[]> = {};
    for (const c of cpu) {
      cpuBrandSet.add(c.brand);
      cpuModelSet.add(`${c.brand}|${c.model}`);
      if (!cpuByBrand[c.brand]) cpuByBrand[c.brand] = [];
      cpuByBrand[c.brand].push(c.model);
    }

    const mem = await this.prisma.memoryModel.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    const memSet = new Set<string>();
    const memBrandSet = new Set<string>();
    const memByBrand: Record<string, string[]> = {};
    for (const m of mem) {
      memBrandSet.add(m.brand);
      memSet.add(m.model);
      if (!memByBrand[m.brand]) memByBrand[m.brand] = [];
      memByBrand[m.brand].push(m.model);
    }

    const nic = await this.prisma.nicModel.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    const nicSet = new Set<string>();
    const nicBrandSet = new Set<string>();
    const nicByBrand: Record<string, string[]> = {};
    for (const n of nic) {
      nicBrandSet.add(n.brand);
      nicSet.add(n.model);
      if (!nicByBrand[n.brand]) nicByBrand[n.brand] = [];
      nicByBrand[n.brand].push(n.model);
    }

    const sto = await this.prisma.storageModel.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    const stoSet = new Set<string>();
    const stoBrandSet = new Set<string>();
    const stoByBrand: Record<string, string[]> = {};
    for (const s of sto) {
      stoBrandSet.add(s.brand);
      stoSet.add(s.model);
      if (!stoByBrand[s.brand]) stoByBrand[s.brand] = [];
      stoByBrand[s.brand].push(s.model);
    }

    return {
      brands: toSorted(allBrands),
      brandsByType: brandsByTypeObj,
      modelsByBrand: modelsByBrandObj,
      modelsByBrandType: modelsByBrandTypeObj,
      cpuBrands: toSorted(cpuBrandSet).filter(b => b),
      cpuModelsByBrand: cpuByBrand,
      cpuModels: cpu,
      cpuCountOptions: ['1','2','4','8'],
      memBrands: toSorted(memBrandSet).filter(b => b),
      memModelsByBrand: memByBrand,
      memModels: mem,
      memTypeOptions: toSorted(memSet),
      nicBrands: toSorted(nicBrandSet).filter(b => b),
      nicModelsByBrand: nicByBrand,
      nicModels: nic,
      nicModel: toSorted(nicSet),
      storageModel: toSorted(stoSet),
      storageBrands: toSorted(stoBrandSet).filter(b => b),
      storageModelsByBrand: stoByBrand,
      storageModels: sto,
    };
  }

  private async syncHardwareMeta(deviceData: DeviceCreateInput | DeviceUpdateInput) {
    if (deviceData.nic) {
      const arr = typeof deviceData.nic === 'string' ? JSON.parse(deviceData.nic) : deviceData.nic;
      if (Array.isArray(arr)) {
        for (const e of arr) {
          if (e.brand && e.model) {
            const nicData: Record<string, unknown> = { brand: e.brand, model: e.model };
            if (e.speed) nicData.speed = e.speed;
            if (e.portType) nicData.portType = e.portType;
            if (e.ports != null) nicData.ports = e.ports;
            await this.prisma.nicModel.upsert({
              where: { brand_model: { brand: e.brand, model: e.model } },
              create: nicData as any,
              update: Object.keys(nicData).length > 2 ? nicData as any : {},
            });
          }
        }
      }
    }
    if (deviceData.storage) {
      const arr = typeof deviceData.storage === 'string' ? JSON.parse(deviceData.storage) : deviceData.storage;
      if (Array.isArray(arr)) {
        for (const e of arr) {
          if (e.model) {
            const stoData: Record<string, unknown> = { brand: e.brand || '', model: e.model };
            if (e.capacity != null) stoData.capacity = e.capacity;
            if (e.capUnit) stoData.capUnit = e.capUnit;
            if (e.interface) stoData.interface = e.interface;
            if (e.formFactor) stoData.formFactor = e.formFactor;
            await this.prisma.storageModel.upsert({
              where: { brand_model: { brand: e.brand || '', model: e.model } },
              create: stoData as any,
              update: Object.keys(stoData).length > 2 ? stoData as any : {},
            });
          }
        }
      }
    }
  }

  getDeviceTypes() {
    return this.prisma.deviceType.findMany();
  }

  async createDeviceType(data: { name: string; color: string }, userId?: number) {
    const dt = await this.prisma.deviceType.create({ data });
    if (userId) {
      this.auditLog.log(userId, 'CREATE', 'DeviceType', dt.id, `创建设备类型: ${dt.name}`).catch(() => {});
    }
    return dt;
  }

  async updateDeviceType(id: number, data: { name: string; color: string }, userId?: number) {
    const dt = await this.prisma.deviceType.update({ where: { id }, data });
    if (userId) {
      this.auditLog.log(userId, 'UPDATE', 'DeviceType', dt.id, `更新设备类型: ${dt.name}`).catch(() => {});
    }
    return dt;
  }

  async deleteDeviceType(id: number, userId?: number) {
    const dt = await this.prisma.deviceType.delete({ where: { id } });
    if (userId) {
      this.auditLog.log(userId, 'DELETE', 'DeviceType', dt.id, `删除设备类型: ${dt.name}`).catch(() => {});
    }
    return dt;
  }

  async getHwModels(type: 'cpu' | 'memory' | 'nic' | 'storage') {
    const map = {
      cpu: this.prisma.cpuModel,
      memory: this.prisma.memoryModel,
      nic: this.prisma.nicModel,
      storage: this.prisma.storageModel,
    };
    return (map[type] as any).findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
  }

  async createHwModel(type: 'cpu' | 'memory' | 'nic' | 'storage', data: Record<string, unknown>) {
    const map = {
      cpu: this.prisma.cpuModel,
      memory: this.prisma.memoryModel,
      nic: this.prisma.nicModel,
      storage: this.prisma.storageModel,
    };
    const m = await (map[type] as any).create({ data });
    this.auditLog.log(0, 'CREATE', `${type}Model`, m.id, `创建${type}型号: ${m.model}`).catch(() => {});
    return m;
  }

  async deleteHwModel(type: 'cpu' | 'memory' | 'nic' | 'storage', id: number) {
    const map = {
      cpu: this.prisma.cpuModel,
      memory: this.prisma.memoryModel,
      nic: this.prisma.nicModel,
      storage: this.prisma.storageModel,
    };
    const m = await (map[type] as any).delete({ where: { id } });
    this.auditLog.log(0, 'DELETE', `${type}Model`, m.id, `删除${type}型号: ${m.model}`).catch(() => {});
    return m;
  }

  async updateHwModel(type: 'cpu' | 'memory' | 'nic' | 'storage', id: number, data: Record<string, unknown>) {
    const map = {
      cpu: this.prisma.cpuModel,
      memory: this.prisma.memoryModel,
      nic: this.prisma.nicModel,
      storage: this.prisma.storageModel,
    };
    const m = await (map[type] as any).update({ where: { id }, data });
    this.auditLog.log(0, 'UPDATE', `${type}Model`, m.id, `更新${type}型号: ${m.model}`).catch(() => {});
    return m;
  }

  async getTemplates() {
    return this.prisma.deviceTemplate.findMany({
      include: { deviceType: true, cpuModel: true, memModel: true },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(data: Record<string, unknown>) {
    delete data.cpuBrandId;
    delete data.memBrandId;
    if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    if (data.storage && Array.isArray(data.storage)) data.storage = JSON.stringify(data.storage);
    if (data.nic && Array.isArray(data.nic)) data.nic = JSON.stringify(data.nic);
    const t = await this.prisma.deviceTemplate.create({ data: data as any });
    this.auditLog.log(0, 'CREATE', 'Template', t.id, `创建模板: ${t.name}`).catch(() => {});
    return t;
  }

  async updateTemplate(id: number, data: Record<string, unknown>) {
    delete data.cpuBrandId;
    delete data.memBrandId;
    delete data.deviceTypeId;
    if (data.tags && Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    if (data.storage && Array.isArray(data.storage)) data.storage = JSON.stringify(data.storage);
    if (data.nic && Array.isArray(data.nic)) data.nic = JSON.stringify(data.nic);
    const t = await this.prisma.deviceTemplate.update({ where: { id }, data: data as any });
    this.auditLog.log(0, 'UPDATE', 'Template', t.id, `更新模板: ${t.name}`).catch(() => {});
    return t;
  }

  async deleteTemplate(id: number) {
    const t = await this.prisma.deviceTemplate.delete({ where: { id } });
    this.auditLog.log(0, 'DELETE', 'Template', t.id, `删除模板: ${t.name}`).catch(() => {});
    return t;
  }

  async getMaintenance(deviceId: number) {
    return this.prisma.maintenanceLog.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMaintenance(deviceId: number, data: { type: string; summary: string; detail?: string; operator?: string }) {
    const m = await this.prisma.maintenanceLog.create({ data: { deviceId, ...data } });
    this.auditLog.log(0, 'CREATE', 'Maintenance', m.id, `维护记录: ${data.type} - ${data.summary}`).catch(() => {});
    return m;
  }

  private async validatePosition(rackId: number, startU: number, heightU: number, excludeId?: number, tx?: any) {
    const client = tx || this.prisma;
    const rack = await client.rack.findUnique({ where: { id: rackId } });
    if (!rack) throw new BadRequestException('机柜不存在');
    if (startU < 1 || startU + heightU - 1 > rack.totalU) {
      throw new BadRequestException(`U位超出机柜范围(1-${rack.totalU})`);
    }
    const conflicts = await client.device.findMany({
      where: {
        rackId,
        id: excludeId ? { not: excludeId } : undefined,
        AND: [
          { startU: { lt: startU + heightU } },
          { startU: { gte: startU - heightU + 1 } },
        ],
      },
    });
    for (const d of conflicts) {
      if (this.overlaps(startU, heightU, d.startU, d.heightU)) {
        throw new BadRequestException(`U位冲突: 与设备"${d.name}"重叠`);
      }
    }
  }

  private overlaps(s1: number, h1: number, s2: number, h2: number) {
    return s1 < s2 + h2 && s1 + h1 > s2;
  }
}
