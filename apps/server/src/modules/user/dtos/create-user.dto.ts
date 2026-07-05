import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '账号',
    example: 'zhangsan',
    minLength: 2,
    maxLength: 32,
  })
  @IsString({ message: '账号必须是字符串' })
  @MinLength(2, { message: '账号至少需要 2 个字符' })
  @MaxLength(32, { message: '账号最多 32 个字符' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
    maxLength: 32,
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要 6 个字符' })
  @MaxLength(32, { message: '密码最多 32 个字符' })
  password: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @MaxLength(32, { message: '昵称最多 32 个字符' })
  nickname?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '头像文件 ID' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '角色编码', example: 'user' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: '状态：0-已禁用 / 1-在职 / 2-离职 / 3-试用期',
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;
}
