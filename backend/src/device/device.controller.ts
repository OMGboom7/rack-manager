import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeviceService } from './device.service';
import { CreateDeviceDto, UpdateDeviceDto, CreateDeviceTypeDto, PaginationDto } from '../common/dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('设备管理')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(AuthGuard('jwt'))
export class DeviceController {
  constructor(private svc: DeviceService) {}

  @Get('types/all')
  @ApiOperation({ summary: '获取所有设备类型' })
  getDeviceTypes() {
    return this.svc.getDeviceTypes();
  }

  @Get('metadata')
  @ApiOperation({ summary: '获取品牌和型号映射' })
  getMetadata() {
    return this.svc.getMetadata();
  }

  @Get()
  @ApiOperation({ summary: '获取所有设备' })
  findAll(@Query() pagination: PaginationDto) {
    return this.svc.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个设备详情' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(+id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建设备(含U位验证)' })
  create(@Body() dto: CreateDeviceDto, @Req() req: any) {
    return this.svc.create(dto as any, req.user?.id);
  }

  @Post('types')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建设备类型' })
  createDeviceType(@Body() dto: CreateDeviceTypeDto, @Req() req: any) {
    return this.svc.createDeviceType(dto, req.user?.id);
  }

  @Put('types/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新设备类型' })
  updateDeviceType(@Param('id') id: string, @Body() dto: CreateDeviceTypeDto, @Req() req: any) {
    return this.svc.updateDeviceType(+id, dto, req.user?.id);
  }

  @Delete('types/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除设备类型' })
  deleteDeviceType(@Param('id') id: string, @Req() req: any) {
    return this.svc.deleteDeviceType(+id, req.user?.id);
  }

  @Get('hw/cpu')
  @ApiOperation({ summary: '获取所有CPU型号' })
  getCpuModels() {
    return this.svc.getHwModels('cpu');
  }

  @Post('hw/cpu')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建CPU型号' })
  createCpuModel(@Body() dto: { brand: string; model: string; cores: number; threads: number; architecture: string }) {
    return this.svc.createHwModel('cpu', dto);
  }

  @Put('hw/cpu/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新CPU型号' })
  updateCpuModel(@Param('id') id: string, @Body() dto: { brand?: string; model?: string; cores?: number; threads?: number; architecture?: string }) {
    return this.svc.updateHwModel('cpu', +id, dto);
  }

  @Delete('hw/cpu/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除CPU型号' })
  deleteCpuModel(@Param('id') id: string) {
    return this.svc.deleteHwModel('cpu', +id);
  }

  @Get('hw/memory')
  @ApiOperation({ summary: '获取所有内存型号' })
  getMemoryModels() {
    return this.svc.getHwModels('memory');
  }

  @Post('hw/memory')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建内存型号' })
  createMemoryModel(@Body() dto: { brand: string; model: string; capacity: number; type: string; speed: number; ecc: boolean }) {
    return this.svc.createHwModel('memory', dto);
  }

  @Put('hw/memory/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新内存型号' })
  updateMemoryModel(@Param('id') id: string, @Body() dto: { brand?: string; model?: string; capacity?: number; type?: string; speed?: number; ecc?: boolean }) {
    return this.svc.updateHwModel('memory', +id, dto);
  }

  @Delete('hw/memory/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除内存型号' })
  deleteMemoryModel(@Param('id') id: string) {
    return this.svc.deleteHwModel('memory', +id);
  }

  @Get('hw/nic')
  @ApiOperation({ summary: '获取所有网卡型号' })
  getNicModels() {
    return this.svc.getHwModels('nic');
  }

  @Post('hw/nic')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建网卡型号' })
  createNicModel(@Body() dto: { brand: string; model: string; speed: string; portType: string; ports: number }) {
    return this.svc.createHwModel('nic', dto);
  }

  @Put('hw/nic/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新网卡型号' })
  updateNicModel(@Param('id') id: string, @Body() dto: { brand?: string; model?: string; speed?: string; portType?: string; ports?: number }) {
    return this.svc.updateHwModel('nic', +id, dto);
  }

  @Delete('hw/nic/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除网卡型号' })
  deleteNicModel(@Param('id') id: string) {
    return this.svc.deleteHwModel('nic', +id);
  }

  @Get('hw/storage')
  @ApiOperation({ summary: '获取所有存储型号' })
  getStorageModels() {
    return this.svc.getHwModels('storage');
  }

  @Post('hw/storage')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建存储型号' })
  createStorageModel(@Body() dto: { brand: string; model: string; capacity: number; capUnit: string; interface: string; formFactor: string }) {
    return this.svc.createHwModel('storage', dto);
  }

  @Put('hw/storage/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新存储型号' })
  updateStorageModel(@Param('id') id: string, @Body() dto: { brand?: string; model?: string; capacity?: number; capUnit?: string; interface?: string; formFactor?: string }) {
    return this.svc.updateHwModel('storage', +id, dto);
  }

  @Delete('hw/storage/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除存储型号' })
  deleteStorageModel(@Param('id') id: string) {
    return this.svc.deleteHwModel('storage', +id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新设备' })
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto, @Req() req: any) {
    return this.svc.update(+id, dto, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除设备' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(+id, req.user?.id);
  }

  // ====== 设备模板 ======
  @Get('templates/all')
  @ApiOperation({ summary: '获取所有设备模板' })
  getTemplates() {
    return this.svc.getTemplates();
  }

  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建设备模板' })
  createTemplate(@Body() dto: any) {
    return this.svc.createTemplate(dto);
  }

  @Put('templates/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新设备模板' })
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateTemplate(+id, dto);
  }

  @Delete('templates/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除设备模板' })
  deleteTemplate(@Param('id') id: string) {
    return this.svc.deleteTemplate(+id);
  }

  // ====== 维护记录 ======
  @Get(':id/maintenance')
  @ApiOperation({ summary: '获取设备维护记录' })
  getMaintenance(@Param('id') id: string) {
    return this.svc.getMaintenance(+id);
  }

  @Post(':id/maintenance')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '添加维护记录' })
  addMaintenance(@Param('id') id: string, @Body() dto: { type: string; summary: string; detail?: string; operator?: string }) {
    return this.svc.addMaintenance(+id, dto);
  }
}
