/*
 * @Author: 林翔 2276928094@qq.com
 * @Date: 2026-07-05 07:16:24
 * @LastEditors: 林翔 2276928094@qq.com
 * @LastEditTime: 2026-07-05 15:39:36
 * @FilePath: \lin-framework\apps\server\src\modules\role\schemas\role.schema.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { BaseEntity, applyBaseHooks } from '@/shared/database';

export type RoleDocument = HydratedDocument<Role>;

/**
 * 角色实体
 *
 * 定义角色及其绑定的权限集合，支持多个角色继承关系。
 */
@Schema({ _id: false, timestamps: false, collection: 'roles' })
export class Role extends BaseEntity {
  /** 角色名称，如 "超级管理员" */
  @Prop({ required: true, trim: true })
  name: string;

  /** 角色编码，如 "super_admin"，唯一 */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** 角色描述（可选） */
  @Prop({ trim: true })
  description?: string;

  /** 绑定的权限标识列表 */
  @Prop({ type: [String], default: [] })
  permissions: string[];

  /** 状态：1-启用 / 0-禁用 */
  @Prop({ default: 1, type: Number })
  status: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

applyBaseHooks(RoleSchema);
