import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @ApiPropertyOptional({ description: '搜索关键词（账号/昵称/邮箱）' })
  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string;

  @ApiPropertyOptional({
    description: '状态筛选：0-已禁用 / 1-在职 / 2-离职 / 3-试用期',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiPropertyOptional({ description: '角色编码筛选' })
  @IsOptional()
  @IsString({ message: '角色必须是字符串' })
  role?: string;

  @ApiPropertyOptional({ description: '开始时间（创建时间范围）' })
  @IsOptional()
  @IsString({ message: '开始时间必须是字符串' })
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString({ message: '结束时间必须是字符串' })
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码最小为 1' })
  page: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页条数必须是数字' })
  @Min(1, { message: '每页条数最小为 1' })
  limit: number = 20;
}
