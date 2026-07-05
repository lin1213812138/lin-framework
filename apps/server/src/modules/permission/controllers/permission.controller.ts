import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PermissionService } from '@/modules/permission/services/permission.service';
import type { PermissionTreeNode } from '@/modules/permission/interfaces/permission.interface';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: '分页查询权限列表' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('keyword') keyword?: string,
    @Query('module') module?: string,
  ) {
    return this.permissionService.findAll({
      keyword,
      module,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('tree')
  @ApiOperation({ summary: '获取权限树（按 module 分组）' })
  async getTree(): Promise<PermissionTreeNode[]> {
    return this.permissionService.getTree();
  }

  @Post('sync')
  @ApiOperation({ summary: '从内置常量同步权限到数据库' })
  async sync(): Promise<{ synced: boolean }> {
    await this.permissionService.syncBuiltin();
    return { synced: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.permissionService.remove(id);
    return { deleted };
  }
}
