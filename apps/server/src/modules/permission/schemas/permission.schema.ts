import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { BaseEntity, applyBaseHooks } from '@/shared/database';

export type PermissionDocument = HydratedDocument<Permission>;

/**
 * 权限实体
 *
 * 定义系统中每个可授权的操作，按 module 分组管理。
 */
@Schema({ _id: false, timestamps: false, collection: 'permissions' })
export class Permission extends BaseEntity {
  /** 权限名称，如 "创建用户" */
  @Prop({ required: true, trim: true })
  name: string;

  /** 权限标识，如 "user:create"，唯一 */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** 权限描述（可选） */
  @Prop({ trim: true })
  description?: string;

  /** 所属模块，如 "user"、"role" */
  @Prop({ required: true, trim: true, index: true })
  module: string;

  /** 状态：1-启用 / 0-禁用 */
  @Prop({ default: 1, type: Number })
  status: number;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

applyBaseHooks(PermissionSchema);

/** 创建索引 */
PermissionSchema.index({ module: 1, code: 1 });
