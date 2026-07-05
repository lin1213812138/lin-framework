import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '账号',
    example: 'admin',
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

  @ApiProperty({ description: '昵称', example: '张三', required: false })
  @IsOptional()
  @MaxLength(32, { message: '昵称最多 32 个字符' })
  nickname?: string;
}
