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
import { UserService } from '@/modules/user/services/user.service';
import { CreateUserDto } from '@/modules/user/dtos/create-user.dto';
import { QueryUserDto } from '@/modules/user/dtos/query-user.dto';
import { UpdateUserDto } from '@/modules/user/dtos/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.userService.create(dto, user.id, user.username);
  }

  @Get()
  @ApiOperation({ summary: '分页查询用户列表' })
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '切换用户状态' })
  async toggleStatus(@Param('id') id: string) {
    return this.userService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户（软删除）' })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { deleted: true };
  }
}
