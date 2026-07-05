import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { BaseEntity, applyBaseHooks } from '@/shared/database';

export type UserDocument = HydratedDocument<User>;

/**
 * 用户实体
 *
 * 继承 BaseEntity 基类，包含认证与权限相关业务字段。
 */
@Schema({ _id: false, timestamps: false, versionKey: false })
export class User extends BaseEntity {
  /** 登录账号，唯一 */
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  /** 邮箱（可选），唯一，自动转小写 */
  @Prop({
    required: false,
    unique: false,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  email?: string;

  /** bcrypt 加密后的密码哈希 */
  @Prop({ required: true })
  password: string;

  /** 用户状态：0-已禁用 / 1-在职 / 2-离职 / 3-试用期 */
  @Prop({ default: 1, type: Number })
  status: number;

  /** 用户角色标识 */
  @Prop({ default: 'user' })
  role: string;

  /** 直接授权的权限标识列表 */
  @Prop({ type: [String], default: [] })
  permissions: string[];

  /** 昵称（可选） */
  @Prop({ trim: true })
  nickname?: string;

  /** 头像 URL（可选） */
  @Prop()
  avatar?: string;

  /** 连续登录失败次数 */
  @Prop({ default: 0 })
  loginAttempts: number;

  /** 账号锁定截止时间戳，Unix 毫秒（可选） */
  @Prop({ type: Number })
  lockUntil?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

applyBaseHooks(UserSchema);
