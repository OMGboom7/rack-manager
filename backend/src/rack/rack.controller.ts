import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RackService } from './rack.service';
import { RowService } from './row.service';
import { CreateRowDto, UpdateRowDto, CreateRackDto, UpdateRackDto, PaginationDto } from '../common/dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('机柜与机排管理')
@ApiBearerAuth()
@Controller('racks')
@UseGuards(AuthGuard('jwt'))
export class RackController {
  constructor(private svc: RackService, private rowSvc: RowService) {}

  @Post('rows')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建排/列' })
  createRow(@Body() dto: CreateRowDto, @Req() req: any) {
    return this.rowSvc.create(dto, req.user?.id);
  }

  @Put('rows/:rowId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新排/列名称' })
  updateRow(@Param('rowId') rowId: string, @Body() dto: UpdateRowDto, @Req() req: any) {
    return this.rowSvc.update(+rowId, dto, req.user?.id);
  }

  @Delete('rows/:rowId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除排/列' })
  removeRow(@Param('rowId') rowId: string, @Req() req: any) {
    return this.rowSvc.remove(+rowId, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有机柜' })
  findAll(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return this.svc.findAll(pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个机柜详情(含设备列表)' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(+id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建机柜' })
  create(@Body() dto: CreateRackDto, @Req() req: any) {
    return this.svc.create(dto, req.user?.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新机柜' })
  update(@Param('id') id: string, @Body() dto: UpdateRackDto, @Req() req: any) {
    return this.svc.update(+id, dto, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除机柜' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.remove(+id, req.user?.id);
  }
}
