# Base Schema

> 本文档定义 LIN Framework 所有数据模型的公共基类字段，所有业务 Collection 必须继承此基类。

---

## BaseEntity

所有实体必须继承的公共基类：

```typescript
export interface BaseEntity {
  /** 主键，UUID 字符串 */
  _id: string;

  /** 创建人显示名称 */
  creator: string;

  /** 创建人用户 ID */
  creatorId: string;

  /** 最后更新人显示名称 */
  updater: string;

  /** 最后更新人用户 ID */
  updaterId: string;

  /** 创建时间戳，Unix 毫秒（double） */
  createDate: number;

  /** 更新时间戳，Unix 毫秒（double） */
  updateDate: number;
}
```

### Mongoose Schema 定义

```typescript
import { Schema, Prop } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ _id: false, timestamps: false, versionKey: false })
export class BaseEntitySchema {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true, type: String })
  creator: string;

  @Prop({ required: true, type: String })
  creatorId: string;

  @Prop({ required: true, type: String })
  updater: string;

  @Prop({ required: true, type: String })
  updaterId: string;

  @Prop({ required: true, type: Number })
  createDate: number;

  @Prop({ required: true, type: Number })
  updateDate: number;
}
```

---

## SoftDelete

需要软删除的实体额外混入此接口：

```typescript
export interface SoftDelete {
  /** 软删除标记 */
  isDeleted: boolean;

  /** 删除时间戳，Unix 毫秒 */
  deletedAt?: number;

  /** 删除人用户 ID */
  deletedBy?: string;
}
```

### Mongoose Schema 定义

```typescript
@Schema({ _id: false })
export class SoftDeleteSchema {
  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;

  @Prop({ type: Number })
  deletedAt?: number;

  @Prop({ type: String })
  deletedBy?: string;
}
```

---

## 组合使用

```typescript
// 用户实体完整定义
export class User extends BaseEntity {
  username: string;
  email: string;
  password: string;
  // ... 业务字段
}

// 需要软删除的实体
export class UserWithSoftDelete extends BaseEntity implements SoftDelete {
  username: string;
  email: string;
  password: string;
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: string;
  // ... 业务字段
}
```

### Mongoose 中的继承方式

```typescript
// 方案一：内嵌子文档（推荐）
@Schema({ _id: false })
export class BaseFields {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true, type: String })
  creator: string;

  @Prop({ required: true, type: String })
  creatorId: string;

  @Prop({ required: true, type: String })
  updater: string;

  @Prop({ required: true, type: String })
  updaterId: string;

  @Prop({ required: true, type: Number })
  createDate: number;

  @Prop({ required: true, type: Number })
  updateDate: number;
}

@Schema({ _id: false })
export class SoftDeleteFields {
  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;

  @Prop({ type: Number })
  deletedAt?: number;

  @Prop({ type: String })
  deletedBy?: string;
}

// 在具体 Schema 中使用
@Schema({ timestamps: false })
export class UserSchema {
  // Base fields
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true, type: String })
  creator: string;

  @Prop({ required: true, type: String })
  creatorId: string;

  @Prop({ required: true, type: String })
  updater: string;

  @Prop({ required: true, type: String })
  updaterId: string;

  @Prop({ required: true, type: Number })
  createDate: number;

  @Prop({ required: true, type: Number })
  updateDate: number;

  // Soft delete
  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;

  @Prop({ type: Number })
  deletedAt?: number;

  @Prop({ type: String })
  deletedBy?: string;

  // Business fields
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  // ...
}
```

---

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | UUID v4 字符串，替代 MongoDB 自增 ObjectId |
| `creator` | string | 创建人的显示名称（冗余存储，防止用户删除后丢失） |
| `creatorId` | string | 创建人用户 ID |
| `updater` | string | 最后更新人的显示名称（冗余存储） |
| `updaterId` | string | 最后更新人用户 ID |
| `createDate` | number | 创建时间，Unix 毫秒时间戳 |
| `updateDate` | number | 最后更新时间，Unix 毫秒时间戳 |
| `isDeleted` | boolean | 软删除标记，默认 false |
| `deletedAt` | number | 删除时间戳（可选） |
| `deletedBy` | string | 删除人用户 ID（可选） |

### 与原有设计的差异

| 原有设计 | 新设计 | 原因 |
|----------|--------|------|
| `_id: ObjectId` | `_id: string (UUID)` | 分布式系统避免 ID 冲突，前端无需处理 ObjectId 转换 |
| `@Schema({ timestamps: true })` | 显式 `createDate` / `updateDate` | 统一字段名和类型，使用 double 时间戳便于跨语言处理 |
| Mongoose 自动管理 | 手动维护 | 可在 Service 层统一赋值，保证 creator/updater 可追溯 |
