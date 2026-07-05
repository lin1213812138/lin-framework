import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { BaseEntity, applyBaseHooks } from '@/shared/database';

export type MenuDocument = HydratedDocument<Menu>;

/**
 * 菜单实体
 *
 * 支持目录(dir)、菜单(menu)、按钮(button) 三种类型，通过 parentId 构建树形结构。
 */
@Schema({ _id: false, timestamps: false, collection: 'menus' })
export class Menu extends BaseEntity {
  /** 菜单名称 */
  @Prop({ required: true, trim: true })
  name: string;

  /** 路由路径（菜单类型必填） */
  @Prop({ trim: true })
  path?: string;

  /** 图标名称 */
  @Prop({ trim: true })
  icon?: string;

  /** 上级菜单 ID，null 表示根节点 */
  @Prop({ type: String, default: null, index: true })
  parentId: string | null;

  /** 绑定的权限标识（按钮类型必填） */
  @Prop({ trim: true })
  permission?: string;

  /** 排序值，越小越靠前 */
  @Prop({ default: 0 })
  sort: number;

  /** 类型：dir 目录 / menu 菜单 / button 按钮 */
  @Prop({ required: true, default: 'menu', trim: true })
  type: string;

  /** 是否外链 */
  @Prop({ default: false })
  isExternal: boolean;

  /** 状态：1-启用 / 0-禁用 */
  @Prop({ default: 1, type: Number })
  status: number;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

applyBaseHooks(MenuSchema);

/** 创建索引 */
MenuSchema.index({ parentId: 1, sort: 1 });
