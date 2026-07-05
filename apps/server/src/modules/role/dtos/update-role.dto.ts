import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ description: '角色名称', required: false })
  @IsOptional()
  @IsString({ message: '角色名称必须是字符串' })
  @MaxLength(32, { message: '角色名称最多 32 个字符' })
  name?: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @MaxLength(128, { message: '角色描述最多 128 个字符' })
  description?: string;

  @ApiProperty({
    description: '状态：0-禁用 / 1-启用',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;
}
