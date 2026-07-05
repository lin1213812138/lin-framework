import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '账号', example: 'admin' })
  @IsString({ message: '账号必须是字符串' })
  @MinLength(2, { message: '账号至少需要 2 个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(1, { message: '密码不能为空' })
  password: string;

  @ApiProperty({ description: '验证码标识', example: 'uuid' })
  @IsString({ message: '验证码标识必须是字符串' })
  captchaId: string;

  @ApiProperty({ description: '验证码', example: 'A3KF' })
  @IsString({ message: '验证码必须是字符串' })
  @MinLength(1, { message: '请输入验证码' })
  @MaxLength(4, { message: '验证码最长 4 位' })
  captcha: string;
}
