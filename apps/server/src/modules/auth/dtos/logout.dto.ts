import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: '刷新令牌', example: 'uuid-string' })
  @IsString({ message: 'refreshToken 必须是字符串' })
  refreshToken: string;
}
