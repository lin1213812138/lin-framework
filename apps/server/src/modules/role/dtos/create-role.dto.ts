import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: '角色名称',
    example: '超级管理员',
    minLength: 2,
    maxLength: 32,
  })
  @IsString({ message: '角色名称必须是字符串' })
  @MinLength(2, { message: '角色名称至少需要 2 个字符' })
  @MaxLength(32, { message: '角色名称最多 32 个字符' })
  name: string;

  @ApiProperty({
    description: '角色编码',
    example: 'super_admin',
    minLength: 2,
    maxLength: 32,
  })
  @IsString({ message: '角色编码必须是字符串' })
  @MinLength(2, { message: '角色编码至少需要 2 个字符' })
  @MaxLength(32, { message: '角色编码最多 32 个字符' })
  code: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @MaxLength(128, { message: '角色描述最多 128 个字符' })
  description?: string;
}
