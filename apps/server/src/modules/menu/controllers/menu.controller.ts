import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { MenuService } from '@/modules/menu/services/menu.service';
import { CreateMenuDto } from '@/modules/menu/dtos/create-menu.dto';
import { UpdateMenuDto } from '@/modules/menu/dtos/update-menu.dto';
import type { MenuTreeNode } from '@/modules/menu/interfaces/menu.interface';

@ApiTags('Menus')
@ApiBearerAuth()
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: '获取菜单树（完整）' })
  async getTree(): Promise<MenuTreeNode[]> {
    return this.menuService.getTree();
  }

  @Get('user/menus')
  @ApiOperation({ summary: '获取当前用户的菜单树（按权限过滤）' })
  async getUserMenus(@Req() req: Request): Promise<MenuTreeNode[]> {
    // 从 JWT payload 获取用户权限（在 v0.5 完整实现权限时完善）
    const user = req.user as { permissions?: string[] } | undefined;
    const permissionCodes = user?.permissions ?? [];
    return this.menuService.getUserMenus(permissionCodes);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜单详情' })
  async findOne(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建菜单' })
  async create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新菜单' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单（级联删除子菜单）' })
  async remove(@Param('id') id: string) {
    await this.menuService.remove(id);
    return { deleted: true };
  }
}
