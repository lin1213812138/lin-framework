import { Prop } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { Schema } from 'mongoose';

import { userContext } from '@/shared/database/async-context';

/**
 * 所有实体的公共基类
 *
 * 包含基础字段 + 软删除字段，所有业务 Collection 的 Schema 必须继承此类。
 *
 * 数据库规范：
 * - `_id` — UUID v4 字符串
 * - `createDate`/`updateDate` — Unix 毫秒时间戳（number）
 */
export abstract class BaseEntity {
  /** 主键，UUID v4 字符串 */
  @Prop({ type: String, default: () => uuidv4() })
  _id!: string;

  /** 创建人显示名称（冗余存储，防止用户删除后丢失） */
  @Prop({ required: true, type: String, default: 'system' })
  creator!: string;

  /** 创建人用户 ID */
  @Prop({ required: true, type: String, default: 'system' })
  creatorId!: string;

  /** 最后更新人显示名称（冗余存储） */
  @Prop({ required: true, type: String, default: 'system' })
  updater!: string;

  /** 最后更新人用户 ID */
  @Prop({ required: true, type: String, default: 'system' })
  updaterId!: string;

  /** 创建时间，Unix 毫秒时间戳 */
  @Prop({ required: true, type: Number, default: () => Date.now() })
  createDate!: number;

  /** 更新时间，Unix 毫秒时间戳 */
  @Prop({ required: true, type: Number, default: () => Date.now() })
  updateDate!: number;

  /** 软删除标记 */
  @Prop({ default: false, type: Boolean })
  isDeleted!: boolean;

  /** 删除时间戳，Unix 毫秒（可选） */
  @Prop({ type: Number })
  deletedAt?: number;

  /** 删除人用户 ID（可选） */
  @Prop({ type: String })
  deletedBy?: string;
}

/**
 * 为 Schema 挂载基础 hooks，自动填充 createDate / updateDate / creator / updater。
 *
 * Mongoose 生命周期：default → validate → pre('save') → 写入
 * - default 保证验证通过
 * - `pre('save')` 根据 AsyncLocalStorage 中的用户信息赋真实值
 * - `pre('findOneAndUpdate')` 处理 findByIdAndUpdate 等不触发 pre('save') 的操作
 *
 * 所有业务 Schema 在导出后应立即调用本函数。
 */
export function applyBaseHooks(schema: Schema): void {
  schema.pre('save', function () {
    const now = Date.now();
    const currentUser = userContext.getStore();

    if (this.isNew) {
      this.createDate = now;
      if (currentUser) {
        this.creator = currentUser.username;
        this.creatorId = currentUser.id;
      }
    }

    this.updateDate = now;
    if (currentUser) {
      this.updater = currentUser.username;
      this.updaterId = currentUser.id;
    }
  });

  schema.pre('findOneAndUpdate', function () {
    const now = Date.now();
    const update: Record<string, unknown> = { updateDate: now };

    const currentUser = userContext.getStore();
    if (currentUser) {
      update.updater = currentUser.username;
      update.updaterId = currentUser.id;
    }

    this.set(update);
  });
}
