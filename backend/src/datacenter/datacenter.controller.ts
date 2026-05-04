import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DatacenterService } from './datacenter.service';
import { CreateDatacenterDto, UpdateDatacenterDto, PaginationDto } from '../common/dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('机房管理')
@ApiBearerAuth()
@Controller('datacenters')
@UseGuards(AuthGuard('jwt'))
export class DatacenterController {
  constructor(private svc: DatacenterService) {}

  @Get()
  @ApiOperation({ summary: '获取所有机房' })
  findAll(@Query() pagination: PaginationDto) {
    return this.svc.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个机房详情(含机柜设备)' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(+id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建机房' })
  create(@Body() dto: CreateDatacenterDto, @Req() req: any) {
    return this.svc.create(dto, req.user?.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新机房' })
  update(@Param('id') id: string, @Body() dto: UpdateDatacenterDto, @Req() req: any) {
    return this.svc.update(+id, dto, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除机房' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(+id, req.user?.id);
  }
}
