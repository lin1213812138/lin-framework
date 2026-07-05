import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '@/core/decorators';
import type { AuthUser } from '@/modules/auth';
import { RoleService } from '@/modules/role/services/role.service';
import { CreateRoleDto } from '@/modules/role/dtos/create-role.dto';
import { UpdateRoleDto } from '@/modules/role/dtos/update-role.dto';
import { QueryRoleDto } from '@/modules/role/dtos/query-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: '分页查询角色列表' })
  async findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query);
  }

  @Get('all')
  @ApiOperation({ summary: '获取全部角色（下拉选择用）' })
  async findAllRaw() {
    return this.roleService.findAllRaw();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async findOne(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建角色' })
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    return this.roleService.create(dto, user.id, user.username);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleService.update(id, dto, user.id, user.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id);
    return { deleted: true };
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '绑定权限到角色' })
  async bindPermissions(
    @Param('id') id: string,
    @Body('permissionCodes') permissionCodes: string[],
  ) {
    return this.roleService.bindPermissions(id, permissionCodes);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色已绑定的权限编码列表' })
  async getPermissionCodes(@Param('id') id: string): Promise<string[]> {
    return this.roleService.getPermissionCodes(id);
  }
}
