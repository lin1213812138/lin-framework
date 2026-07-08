import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class UpdateMenuDto {
  @ApiPropertyOptional({ description: '菜单名称' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  name?: string;

  @ApiPropertyOptional({ description: '路由名称' })
  @IsOptional()
  @IsString()
  routeName?: string;

  @ApiPropertyOptional({ description: '路由路径' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '菜单组件' })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiPropertyOptional({ description: '重定向' })
  @IsOptional()
  @IsString()
  redirect?: string;

  @ApiPropertyOptional({ description: '图标名称' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '外链/内嵌链接地址' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: '上级菜单 ID' })
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({ description: '权限标识' })
  @IsOptional()
  @IsString()
  permission?: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '状态：0-禁用 / 1-启用' })
  @IsOptional()
  @IsNumber({}, { message: '状态必须是数字' })
  status?: number;

  @ApiPropertyOptional({ description: '是否外链', default: false })
  @IsOptional()
  @IsBoolean()
  isLink?: boolean;

  @ApiPropertyOptional({ description: '是否隐藏', default: false })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional({ description: '是否固定', default: false })
  @IsOptional()
  @IsBoolean()
  isAffix?: boolean;

  @ApiPropertyOptional({ description: '是否总是显示', default: false })
  @IsOptional()
  @IsBoolean()
  isAlwaysShow?: boolean;

  @ApiPropertyOptional({ description: '页面缓存', default: true })
  @IsOptional()
  @IsBoolean()
  keepAlive?: boolean;

  @ApiPropertyOptional({ description: '是否内嵌', default: false })
  @IsOptional()
  @IsBoolean()
  isIframe?: boolean;
}
