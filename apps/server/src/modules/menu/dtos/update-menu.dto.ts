/*
 * @Author: 林翔 2276928094@qq.com
 * @Date: 2026-07-05 07:15:05
 * @LastEditors: 林翔 2276928094@qq.com
 * @LastEditTime: 2026-07-15 21:01:34
 * @FilePath: \lin-framework\apps\server\src\modules\menu\dtos\update-menu.dto.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ description: '是否外链', default: 0 })
  @IsOptional()
  @IsNumber()
  isLink?: number;

  @ApiPropertyOptional({ description: '是否隐藏', default: 0 })
  @IsOptional()
  @IsNumber()
  isHidden?: number;

  @ApiPropertyOptional({ description: '是否固定', default: 0 })
  @IsOptional()
  @IsNumber()
  isAffix?: number;

  @ApiPropertyOptional({ description: '页面缓存', default: 0 })
  @IsOptional()
  @IsNumber()
  keepAlive?: number;

  @ApiPropertyOptional({ description: '是否内嵌', default: 0 })
  @IsOptional()
  @IsNumber()
  isIframe?: number;
}
