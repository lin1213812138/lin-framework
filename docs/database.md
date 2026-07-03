# Database Design

> **设计依据**: AGENTS.md §7 MongoDB 规范、§8 Redis 规范、§10 权限规范
>
> 本文档描述 LIN Framework 的数据库设计，包括 Base Schema 定义、MongoDB Collection 设计、索引策略、Redis 数据结构与缓存策略。

---

## 1. 技术选型

| 存储 | 用途 | 版本 |
|------|------|------|
| MongoDB | 业务主数据库：核心实体、操作日志、审计日志 | ≥ 7.0 |
| Redis | 缓存、Session、Token、分布式锁、消息队列 | ≥ 7.0 |

### 设计原则

- Collection 命名使用小写 + 下划线（AGENTS.md §7.1）
- 所有 Schema 必须继承 `BaseEntity`（详见 [base-schema.md](./base-schema.md)）
- `_id` 使用 UUID 字符串，替代 MongoDB 自增 ObjectId（base-schema.md）
- 时间使用 double 类型 Unix 毫秒时间戳：`createDate` / `updateDate`（base-schema.md）
- 所有文档记录操作人：`creator` / `creatorId` / `updater` / `updaterId`（base-schema.md）
- 所有文档支持软删除：`isDeleted` / `deletedAt` / `deletedBy`（AGENTS.md §7.4 + base-schema.md）
- 所有查询默认过滤 `isDeleted: false`（AGENTS.md §7.4）
- 所有查询字段必须建立索引（AGENTS.md §7.5）
- 引用字段使用字符串 UUID 存储（base-schema.md）
- Redis Key 格式：`{project}:{module}:{entity}:{id}:{field}`（AGENTS.md §8.1）
- 缓存 Key 统一在 `constants/cache-keys.ts` 中管理（AGENTS.md §8.2）

---

## 2. Base Schema

所有 Collection 共享的公共字段定义在独立文档中：

> 详见 [base-schema.md](./base-schema.md)

### 公共字段速览

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | UUID v4 |
| `creator` | string | 创建人显示名称 |
| `creatorId` | string | 创建人用户 ID |
| `updater` | string | 最后更新人显示名称 |
| `updaterId` | string | 最后更新人用户 ID |
| `createDate` | number | 创建时间戳（Unix 毫秒） |
| `updateDate` | number | 更新时间戳（Unix 毫秒） |
| `isDeleted` | boolean | 软删除标记 |
| `deletedAt` | number | 删除时间戳（可选） |
| `deletedBy` | string | 删除人用户 ID（可选） |

以下所有业务 Collection 均包含上述字段，文档中仅列出业务特有字段。

---

## 3. MongoDB Collections

### 3.1 用户集合（users）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| username | string | required, unique, trim, lowercase | 用户名 |
| email | string | required, unique, trim, lowercase | 邮箱 |
| password | string | required | bcrypt 加密 |
| nickname | string | trim | 昵称 |
| avatar | string | | 头像 URL |
| phone | string | | 手机号 |
| status | string | enum: active/inactive/disabled, default: active | 用户状态 |
| roles | string[] | default: [] | 角色 ID 列表 |
| directPermissions | string[] | default: [] | 直接授权权限标识 |
| loginAttempts | number | default: 0 | 登录失败次数 |
| lockedUntil | number | | 锁定截止时间戳 |
| lastLoginAt | number | | 最后登录时间戳 |
| lastLoginIp | string | | 最后登录 IP |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | 唯一索引 | 邮箱唯一 |
| `username` | 唯一索引 | 用户名唯一 |
| `status, isDeleted` | 联合索引 | 过滤活跃用户 |
| `roles` | 单字段索引 | 按角色查用户 |
| `createDate` | 降序索引 | 列表排序 |

---

### 3.2 角色集合（roles）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| name | string | required, unique, trim | 角色名称 |
| description | string | trim | 角色描述 |
| permissions | string[] | default: [] | 权限标识列表 |
| parentId | string | default: null | 父角色 ID（角色继承） |
| sort | number | default: 0 | 排序权重 |
| isEnabled | boolean | default: true | 是否启用 |
| isSystem | boolean | default: false | 系统内置不可删除 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | 唯一索引 | 角色名称唯一 |
| `isEnabled, isDeleted` | 联合索引 | 过滤启用的角色 |
| `parentId` | 单字段索引 | 角色继承查询 |

---

### 3.3 权限集合（permissions）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| code | string | required, unique | 权限标识，如 "user:create" |
| name | string | required | 权限名称，如 "创建用户" |
| description | string | | 权限描述 |
| module | string | required | 所属模块，如 "user" |
| action | string | required | 操作，如 "create" |
| sort | number | default: 0 | 排序权重 |
| isEnabled | boolean | default: true | 是否启用 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | 唯一索引 | 权限标识唯一 |
| `module, action` | 联合索引 | 模块级查询 |
| `module, isEnabled` | 联合索引 | 过滤模块启用权限 |

---

### 3.4 菜单集合（menus）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| name | string | required | 菜单名称 |
| path | string | | 前端路由路径 |
| component | string | | Vue 组件路径 |
| icon | string | | 图标名称 |
| parentId | string | default: null | 父菜单 ID |
| sort | number | default: 0 | 排序权重 |
| isHidden | boolean | default: false | 是否隐藏（按钮级菜单） |
| permission | string | | 关联权限标识 |
| isEnabled | boolean | default: true | 是否启用 |
| roles | string[] | default: [] | 允许访问的角色名称列表 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `parentId, sort` | 复合索引 | 菜单树构建 |
| `permission` | 单字段索引 | 权限关联查询 |

---

### 3.5 刷新令牌集合（refresh_tokens）

**继承**: BaseEntity

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| token | string | required, index | Refresh Token 值 |
| userId | string | required | 关联用户 ID |
| expiresAt | number | required | 过期时间戳 |
| isRevoked | boolean | default: false | 是否已撤销 |
| revokedAt | number | | 撤销时间戳 |
| userAgent | string | | 客户端 User-Agent |
| ip | string | | 登录 IP |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | 唯一索引 | Token 查找 |
| `userId, expiresAt` | 联合索引 | 用户有效 Token |
| `expiresAt` | TTL 索引 | 自动过期清理（需 MongoDB 支持 TTL on non-Date fields via expiry） |

---

### 3.6 登录日志集合（login_logs）

**继承**: BaseEntity

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| userId | string | required | 用户 ID |
| action | string | enum: login/logout/refresh | 操作类型 |
| status | string | enum: success/failed | 状态 |
| ip | string | | 登录 IP |
| userAgent | string | | User-Agent |
| failReason | string | | 失败原因 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId, createDate` | 降序联合索引 | 用户登录历史 |
| `createDate` | 降序索引 | 日志列表排序 |

---

### 3.7 验证码集合（captchas）

**继承**: BaseEntity

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| key | string | required, index | 验证码标识（邮箱/手机/会话 ID） |
| code | string | required | 验证码值 |
| type | string | enum: register/login/reset_password | 验证码类型 |
| expiresAt | number | required | 过期时间戳 |
| isUsed | boolean | default: false | 是否已使用 |
| usedAt | number | | 使用时间戳 |
| attempts | number | default: 0 | 已尝试次数 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `key, type` | 联合索引 | 验证码查找 |
| `expiresAt` | 单字段索引 | 定时清理过期数据 |

---

### 3.8 文件集合（files）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| originalName | string | required | 原始文件名 |
| filename | string | required | 存储文件名（UUID 生成） |
| mimeType | string | required | MIME 类型 |
| size | number | required | 文件大小（字节） |
| path | string | required | 存储路径 |
| url | string | | 访问 URL |
| storageType | string | enum: local/s3/oss/cos | 存储类型 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `uploadedBy, createDate` | 降序联合索引 | 用户文件列表 |
| `mimeType` | 单字段索引 | 按类型筛选 |

---

### 3.9 通知集合（notifications）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| title | string | required | 通知标题 |
| content | string | | 通知内容 |
| scope | string | enum: system/user/role | 通知范围 |
| userId | string | | 目标用户 ID |
| type | string | enum: info/warning/error/success | 通知类型 |
| isRead | boolean | default: false | 是否已读 |
| readAt | number | | 读取时间戳 |
| actionUrl | string | | 点击跳转链接 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId, isRead, createDate` | 降序联合索引 | 用户通知列表 |
| `scope, createDate` | 降序联合索引 | 范围通知查询 |

---

### 3.10 系统配置集合（system_configs）

**继承**: BaseEntity + SoftDelete

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| key | string | required, unique | 配置键 |
| value | unknown | required | 配置值 |
| description | string | | 配置描述 |
| type | string | enum: string/number/boolean/json, default: string | 值类型 |
| isEncrypted | boolean | default: false | 是否加密存储 |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | 唯一索引 | 配置键唯一 |

---

### 3.11 操作日志集合（operation_logs）

**继承**: BaseEntity

**特有字段**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| userId | string | | 操作人 ID |
| username | string | | 操作人用户名（冗余） |
| module | string | required | 操作模块 |
| action | string | required | 操作类型 |
| resourceId | string | | 资源 ID |
| resourceType | string | | 资源类型 |
| before | unknown | | 操作前数据快照 |
| after | unknown | | 操作后数据快照 |
| ip | string | required | 操作 IP |
| userAgent | string | | User-Agent |
| duration | number | | 操作耗时（毫秒） |
| status | string | enum: success/failed, default: success | 状态 |
| failReason | string | | 失败原因 |
| isAudit | boolean | default: false | 审计日志标记（不可删除） |

**索引**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId, createDate` | 降序联合索引 | 用户操作历史 |
| `module, action` | 联合索引 | 模块操作追踪 |
| `createDate` | 降序索引 | 日志列表排序 |
| `isAudit, createDate` | 降序联合索引 | 审计日志查询 |

---

## 4. 集合关系

```
users ─── N:N ───> roles ─── N:N ───> permissions
  │                                      │
  │  directPermissions[]                │  code: "user:create"
  │                                      │
  │                                      ▼
  │                                   menus
  │                                   permission: "user:create"
  │
  └── 1:N ──> refresh_tokens (可过期)
  └── 1:N ──> login_logs
  └── 1:N ──> notifications
  └── 1:N ──> operation_logs
```

---

## 5. 索引策略

### 5.1 索引设计规则

| 规则 | 说明 |
|------|------|
| 查询先行 | 根据业务查询模式设计索引，不为所有字段加索引 |
| ESR 顺序 | 联合索引按 Equality → Sort → Range 排列字段 |
| 覆盖查询 | 尽量使用覆盖索引避免回表 |
| TTL 索引 | 自动过期数据（验证码、refresh token） |
| 降序索引 | 时间排序字段统一使用降序索引（`createDate`） |

### 5.2 索引总表

| 集合 | 索引字段 | 类型 | 场景 |
|------|---------|------|------|
| users | email | 唯一 | 登录、注册查重 |
| users | username | 唯一 | 登录、注册查重 |
| users | status, isDeleted | 联合 | 用户列表按状态筛选 |
| users | roles | 单字段 | 按角色查询用户 |
| roles | name | 唯一 | 角色名称查重 |
| roles | isEnabled, isDeleted | 联合 | 角色列表 |
| permissions | code | 唯一 | 权限标识查重 |
| permissions | module, action | 联合 | 模块权限注册 |
| menus | parentId, sort | 复合 | 菜单树排序 |
| refresh_tokens | token | 唯一 | Token 查找 |
| captchas | key, type | 联合 | 验证码校验 |
| operation_logs | createDate | 降序 | 日志分页列表 |
| system_configs | key | 唯一 | 配置查询 |

---

## 6. Redis 数据设计

### 6.1 Key 命名空间

```
lin:{module}:{entity}:{id}:{field}
```

| Key 模式 | 用途 | TTL |
|----------|------|-----|
| `lin:auth:refresh:{userId}` | Refresh Token 关联 | Token 有效期 |
| `lin:auth:blacklist:{jti}` | Token 黑名单 | Token 有效期 |
| `lin:captcha:{type}:{key}` | 验证码 | 5 分钟 |
| `lin:user:session:{userId}` | 用户会话信息 | 7 天 |
| `lin:user:permissions:{userId}` | 用户权限缓存 | 10 分钟 |
| `lin:role:{roleId}` | 角色信息缓存 | 10 分钟 |
| `lin:menu:tree` | 菜单树缓存 | 30 分钟 |
| `lin:config:{key}` | 系统配置缓存 | 60 分钟 |
| `lin:rate-limit:{ip}:{path}` | 速率限制 | 1 分钟 |
| `lin:lock:{resource}` | 分布式锁 | 3 秒 |

### 6.2 缓存 Key 定义

```typescript
// constants/cache-keys.ts
export const CacheKeys = {
  refreshToken: (userId: string) => `lin:auth:refresh:${userId}`,
  tokenBlacklist: (jti: string) => `lin:auth:blacklist:${jti}`,
  captcha: (type: string, key: string) => `lin:captcha:${type}:${key}`,
  userSession: (userId: string) => `lin:user:session:${userId}`,
  userPermissions: (userId: string) => `lin:user:permissions:${userId}`,
  role: (roleId: string) => `lin:role:${roleId}`,
  menuTree: 'lin:menu:tree',
  systemConfig: (key: string) => `lin:config:${key}`,
  rateLimit: (ip: string, path: string) => `lin:rate-limit:${ip}:${path}`,
  lock: (resource: string) => `lin:lock:${resource}`,
} as const;
```

### 6.3 TTL 定义

```typescript
export const CacheTTL = {
  USER_PERMISSIONS: 600,          // 10 分钟
  ROLE_INFO: 600,                 // 10 分钟
  MENU_TREE: 1800,                // 30 分钟
  SYSTEM_CONFIG: 3600,            // 60 分钟
  CAPTCHA: 300,                   // 5 分钟
  SESSION: 604800,                // 7 天
  RATE_LIMIT_WINDOW: 60,           // 1 分钟
  LOCK_DEFAULT: 3000,             // 3 秒
} as const;
```

### 6.4 缓存失效策略

写操作后必须使关联缓存失效或更新（AGENTS.md §8.2）：

| 写操作 | 失效缓存 |
|---------|-----------|
| 用户角色变更 | `user:permissions:{userId}` |
| 角色权限变更 | `role:{roleId}` + 所有关联用户的 `user:permissions:{userId}` |
| 菜单变更 | `menu:tree` |
| 系统配置更新 | `config:{key}` |

---

## 7. 分页规范

依据 AGENTS.md §7.7：

### 请求参数

```typescript
interface PaginationQuery {
  page?: number;      // 默认 1
  limit?: number;     // 默认 20，最大 100
  sort?: string;      // 默认 createDate
  order?: 'asc' | 'desc'; // 默认 desc
}
```

### 响应格式

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 8. 种子数据

系统初始化时通过 `pnpm seed` 注册以下数据。

### 内置角色

```typescript
const systemRoles = [
  { name: 'super_admin', description: '超级管理员', isSystem: true, sort: 0 },
  { name: 'admin', description: '管理员', isSystem: true, sort: 1 },
  { name: 'user', description: '普通用户', isSystem: true, sort: 2 },
];
```

### 内置权限（模块启动时自动注册）

```typescript
// 各模块在 onModuleInit 时注册自己的权限
// user:query, user:create, user:update, user:delete
// role:query, role:create, role:update, role:delete
// permission:query, permission:sync
// menu:query, menu:create, menu:update, menu:delete
// system:config, system:log
```

### 管理员账号

```typescript
const adminUser = {
  username: 'admin',
  email: 'admin@linframework.com',
  password: bcrypt.hashSync('admin123', 10),
  nickname: '超级管理员',
  status: 'active',
  roles: [superAdminRoleId],
};
```
