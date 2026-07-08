import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称', minLength: 1, maxLength: 32 })
  @IsString({ message: '菜单名称必须是字符串' })
  @MinLength(1, { message: '菜单名称不能为空' })
  @MaxLength(32, { message: '菜单名称最多 32 个字符' })
  name: string;

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

  @ApiPropertyOptional({ description: '上级菜单 ID，null 表示根节点' })
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({ description: '权限标识' })
  @IsOptional()
  @IsString()
  permission?: string;

  @ApiPropertyOptional({ description: '排序值', default: 0 })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '类型：dir / menu / button' })
  @IsString({ message: '类型必须是字符串' })
  type: string;

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
