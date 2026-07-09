# AGENTS.md — LIN Framework

## 1. 项目定位

**LIN Framework** 是一个现代企业级全栈开发框架，基于 TypeScript 全栈技术体系构建。

### 目标

打造一套可以长期维护、不断扩展、适用于后台管理系统、SaaS 平台、AI 平台、CMS、内网穿透平台等项目的基础开发框架，而非普通的后台模板。

### 核心设计理念

- **AI First** — 所有代码结构、注释、规范均面向 AI 编程工具优化
- **Type Safety First** — 全链路类型安全，编译时消除大量潜在错误
- **Plugin First** — 核心框架稳定，功能通过插件机制扩展
- **Developer Experience First** — 开发体验优先，降低心智负担
- **High Maintainability** — 代码可维护性是最高优先级之一
- **High Scalability** — 横向与纵向可扩展
- **Clean Architecture** — 清晰的架构边界与层级依赖
- **Domain Driven Design (适度)** — 在复杂业务领域采用 DDD 战术模式
- **SOLID** — 面向对象设计五大原则
- **DRY** — 消除重复代码
- **KISS** — 保持简单，避免过度设计

---

## 2. 整体架构原则

### 2.1 分层架构

```
Presentation Layer (Controller / Resolver)
    ↓
Application Layer (Service / UseCase)
    ↓
Domain Layer (Entity / ValueObject / DomainService)
    ↓
Infrastructure Layer (Repository / Adapter / External)
```

### 2.2 依赖方向

- 外层依赖内层，内层绝不依赖外层
- 依赖倒置：高层模块不依赖低层模块，双方依赖抽象
- 所有跨层调用必须通过接口（Interface）

### 2.3 Monorepo 结构

使用 pnpm Workspace 管理，每个子包独立版本、独立构建。

### 2.4 模块化原则

- 每个 NestJS Module 是一个有界上下文（Bounded Context）
- 模块之间禁止循环依赖
- 模块之间通过 Interface / Event / CQRS 通信
- 公共逻辑提取到 Shared 层

---

## 3. 编码规范

### 3.1 通用规则

- 缩进：2 空格
- 分号：必须
- 引号：单引号优先，模板字符串使用反引号
- 行宽：120 字符
- 文件末尾保留一个空行

### 3.2 注释

- 所有函数必须有 JSDoc / TSDoc 注释
- 复杂逻辑必须有行内注释说明原因（而不是描述做了什么）
- 禁止注释掉的代码，直接删除
- 注释使用中文或英文均可，但同一文件内必须统一

### 3.3 ESLint & Prettier

- 使用 `@typescript-eslint/strict` 规则集
- 使用 `prettier` 统一格式化
- 提交前自动格式化与 lint 检查

---

## 4. TypeScript 规范

### 4.1 严格模式

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "exactOptionalPropertyTypes": true,
  "forceConsistentCasingInFileNames": true
}
```

### 4.2 类型使用规则

- **禁止 `any`** — 必须使用 `unknown` 替代，然后通过类型守卫收窄
- 优先 `interface` 而非 `type`（对象类型用 interface，联合类型用 type）
- 泛型参数命名：`T` / `K` / `V` 用于简单泛型，业务泛型使用完整单词
- 函数返回值必须显式标注类型
- 函数参数必须显式标注类型
- 避免类型断言（`as`），优先使用类型守卫或声明式类型
- 使用 `import type` 导入仅类型引用

### 4.3 枚举规范

- 使用 `const enum` 或 `as const` 对象
- 枚举值使用 `PascalCase`
- 枚举值必须是显式字符串或数字

```typescript
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISABLED: 'disabled',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
```

### 4.4 常量管理

- 所有常量集中在 `constants/` 目录
- 业务常量放在模块内 `{module}/constants/` 目录
- 禁止魔法字符串（Magic String）

---

## 5. NestJS 开发规范

### 5.1 分层与职责

```
{module}/
├── {module}.module.ts          # Module 定义
├── controllers/                # 控制器层
├── services/                   # 服务层
├── repositories/               # 数据访问层
├── schemas/                    # Mongoose Schema
├── dtos/                       # 数据传输对象
├── interfaces/                 # 接口定义
├── constants/                  # 常量
├── enums/                      # 枚举
└── tests/                      # 模块测试
```

### 5.2 Module

- 每个功能模块一个 Nest Module
- Module 只做依赖注册，不包含业务逻辑
- 使用 `forRoot` / `forFeature` 模式注册 Mongoose Model
- 将跨模块需要的 Service 通过 `exports` 暴露
- 使用 `Global` 装饰器需谨慎，只对真正全局模块使用

### 5.3 Controller

- Controller 职责：接收请求、参数校验、调用 Service、返回响应
- Controller 方法名对应 HTTP 语义：`findAll` / `findOne` / `create` / `update` / `remove`
- 所有 Controller 方法必须添加 Swagger 装饰器
- 路由路径使用复数形式：`/users` 而非 `/user`
- 使用 `@ApiTags` 分组
- **Controller 不得直接访问数据库**
- Controller 不包含任何业务逻辑

### 5.4 Service

- Service 职责：业务逻辑编排、事务管理、领域规则校验
- Service 方法名清晰表达业务意图：`activateUser` / `resetPassword` / `syncPermissions`
- 所有业务逻辑必须放在 Service
- Service 之间可通过构造器注入调用，但避免循环依赖
- 使用 `@Injectable()` 且设置作用域为 `DEFAULT`（单例）

### 5.5 Repository

- Repository 职责：所有数据库操作
- 所有 MongoDB 查询必须通过 Repository
- Repository 不得包含业务逻辑
- 提供标准 CRUD 方法 + 自定义查询方法
- 返回类型必须是 Domain Entity 或 DTO

```typescript
@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean();
  }
}
```

### 5.6 Schema

- 使用 `@Schema()` 装饰器定义
- 明确标注每个字段的 Mongoose 类型
- 使用 `required` / `default` / `validate` 约束
- 统一添加 `timestamps: true`
- 所有文档必须包含 `_id` 和 `__v`（Mongoose 默认）
- 使用 `@Prop()` 装饰器标注每个属性

### 5.7 DTO

- 所有输入数据必须使用 DTO + `class-validator` 校验
- 使用 `@ApiProperty()` 标注 Swagger 元数据
- DTO 分为 `CreateDto` / `UpdateDto` / `QueryDto` / `ResponseDto`
- 使用 `PartialType` / `PickType` / `OmitType` / `IntersectionType` 复用
- 禁止直接在 Controller 中使用 body/query 原始类型

### 5.8 Interface

- 定义 Repository、Service、Module 之间的契约
- Interface 命名：`IUserService` / `IUserRepository` / `IUserModuleOptions`
- Interface 放在 `interfaces/` 目录

### 5.9 禁止规则

- **禁止跨层调用**：Controller → Service → Repository，不可跳过
- **Controller 不得直接访问 Repository 或 Model**
- **Service 不得直接操作数据库，必须通过 Repository**
- **所有配置必须来自 ConfigService**，禁止 `process.env` 直接访问
- **禁止硬编码**（URL、密钥、超时时间等必须配置化）
- **禁止 `throw Error`** — 必须使用自定义异常类
- **禁止 `console.log`** — 必须使用 Logger

---

## 6. Vue3 开发规范

### 6.1 Composition API + `<script setup>`

- 所有组件必须使用 `<script setup lang="ts">`
- 禁止使用 Options API
- `defineProps` / `defineEmits` 使用类型声明方式

```typescript
const props = defineProps<{
  userId: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close', reason: 'cancel' | 'success'): void;
  (e: 'saved', id: string): void;
}>();
```

### 6.2 Pinia

- 每个 Store 独立文件
- Store 命名：`use{Name}Store`
- 使用 Setup Store 语法（函数式）
- State 必须显式定义类型
- Getter 只做派生数据，不修改 State
- Action 支持 async/await

### 6.3 Vue Router

- 路由懒加载：`() => import('@/views/xxx.vue')`
- 路由命名规范：`{module}-{page}`，如 `user-list` / `user-detail`
- 使用 Meta 元信息：`title` / `permission` / `icon` / `keepAlive`
- 路由守卫统一在 `router/guards/` 中管理

### 6.4 Composable

- 可复用逻辑提取为 Composable
- 命名：`use{Feature}`，如 `usePagination` / `useFormValidation`
- Composable 放在 `composables/` 目录
- 每个 Composable 只做一件事

### 6.5 API 管理

- 所有 API 请求封装在 `api/` 目录下
- 按模块拆分文件：`api/user.ts` / `api/role.ts`
- 使用统一的 Axios 实例（拦截器、错误处理、Token 刷新）
- API 函数命名：`fetchUsers` / `createUser` / `updateUser` / `deleteUser`
- 所有 API 函数返回完整的 Response 类型

### 6.6 页面目录规范

```
views/
├── user/
│   ├── index.vue         # 用户列表页
│   ├── [id].vue          # 用户详情页
│   ├── create.vue        # 新建用户页
│   ├── components/       # 页面私有组件
│   │   ├── UserForm.vue
│   │   └── UserTable.vue
│   └── composables/      # 页面私有 Composable
│       └── useUserForm.ts
```

### 6.7 组件规范

- 组件名使用 PascalCase：`UserAvatar.vue`
- 公共组件放在 `components/` 目录
- 组件 Props 必须有类型定义
- 组件单向数据流，禁止直接修改 Props
- 使用 `v-model` 模式实现双向绑定
- 复杂组件拆分为子组件，单一职责

---

## 7. MongoDB 规范

### 7.1 Collection 命名

- 使用小写 + 下划线：`users` / `user_roles` / `system_logs`
- 单数形式表达文档类型：`user` / `role` 而非 `users` / `roles`
- 关联表命名按字母顺序：`user_role` 而非 `role_user`

### 7.2 Schema 规范

- 统一使用 `@Schema({ timestamps: true })`
- 字段名使用小驼峰：`createdAt` / `updatedAt`
- 字段类型必须是显式 Mongoose 类型
- 数组字段必须有默认值 `[]`
- 可选字段明确 `required: false`

### 7.3 timestamps

```typescript
@Schema({ timestamps: true })
export class User {
  // Mongoose 自动管理 createdAt / updatedAt
}
```

### 7.4 软删除

- 使用 `isDeleted` 字段标记删除状态
- 所有查询默认过滤 `isDeleted: false`
- 提供 `findWithDeleted` / `findOnlyDeleted` 方法
- 软删除时记录 `deletedAt` 和 `deletedBy`

```typescript
interface SoftDelete {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
```

### 7.5 索引

- 所有查询字段必须建立索引
- 联合索引注意字段顺序（等值条件在前，排序在后）
- 使用 `@Index()` 装饰器或在 Schema 定义时声明
- TTL 索引用于自动过期数据
- 定期审查慢查询日志优化索引

### 7.6 ObjectId

- 所有引用字段使用 `Schema.Types.ObjectId` + `ref`
- 使用 `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ModelName' })`
- 使用 `populate` 或 `lookup` 关联查询

### 7.7 分页规范

- 统一分页参数：`page` / `limit` / `sort` / `order`
- 返回值：`{ data: T[], total: number, page: number, limit: number, totalPages: number }`
- 默认每页 20 条，最大 100 条
- 提供可复用的 Pagination 工具函数

---

## 8. Redis 规范

### 8.1 Key 命名

格式：`{project}:{module}:{entity}:{id}:{field}`

```
lin:user:session:abc123
lin:captcha:register:user@example.com
lin:rate-limit:api:/users
lin:lock:order:pay:ord_001
```

### 8.2 缓存规范

- 缓存 Key 统一在 `constants/cache-keys.ts` 中管理
- 缓存值序列化为 JSON 字符串
- 设置合理 TTL，默认 10 分钟
- 写操作后必须使关联缓存失效或更新

### 8.3 Token 管理

- Access Token 使用 JWT（无状态）
- Refresh Token 存储在 Redis 中
- Token 黑名单使用 Redis SET 存储
- Redis 中 Token 关联用户信息：`{ userId, roles, permissions }`

### 8.4 分布式锁

```typescript
const lockKey = `lin:lock:order:pay:${orderId}`;
const lock = await this.redisService.lock(lockKey, 3000);
try {
  // 业务逻辑
} finally {
  await this.redisService.unlock(lock);
}
```

### 8.5 缓存过期策略

- 热点数据：5-10 分钟
- 配置信息：30-60 分钟（或永不过期 + 主动刷新）
- 验证码：5 分钟
- Session：7-30 天
- 临时锁：3 秒

---

## 9. 接口规范

### 9.1 统一返回格式

```typescript
interface ApiResponse<T = unknown> {
  code: number; // 业务状态码
  message: string; // 提示信息
  data: T; // 响应数据
  timestamp: number; // 时间戳
  requestId: string; // 请求追踪 ID
}
```

### 9.2 统一异常

所有异常通过 Exception Filter 拦截，输出统一格式：

```typescript
interface ApiError {
  code: number;
  message: string;
  timestamp: number;
  requestId: string;
  path: string;
}
```

### 9.3 HTTP 状态码使用规范

| 状态码 | 场景                   |
| ------ | ---------------------- |
| 200    | 成功                   |
| 201    | 创建成功               |
| 204    | 删除成功（无返回体）   |
| 400    | 参数校验失败           |
| 401    | 未认证                 |
| 403    | 无权限                 |
| 404    | 资源不存在             |
| 409    | 资源冲突（如重复创建） |
| 422    | 业务规则校验失败       |
| 429    | 请求频率限制           |
| 500    | 服务器内部错误         |

### 9.4 RESTful 设计

| 方法   | 路径                         | 说明               |
| ------ | ---------------------------- | ------------------ |
| GET    | `/api/v1/users`              | 分页查询用户列表   |
| GET    | `/api/v1/users/:id`          | 查询单个用户       |
| POST   | `/api/v1/users`              | 创建用户           |
| PATCH  | `/api/v1/users/:id`          | 部分更新用户       |
| DELETE | `/api/v1/users/:id`          | 删除用户           |
| POST   | `/api/v1/users/:id/activate` | 自定义操作（动词） |

### 9.5 Swagger 要求

- 所有 Controller 必须添加 `@ApiTags()`
- 所有方法必须添加 `@ApiOperation({ summary, description })`
- DTO 属性必须添加 `@ApiProperty()`
- 使用 `@ApiBearerAuth()` 标识需要认证的接口
- 使用 `@ApiQuery()` / `@ApiParam()` 描述参数
- 使用 `@ApiResponse()` 描述可能的响应

---

## 10. 权限规范

### 10.1 RBAC 模型

```
User → Role → Permission
```

### 10.2 User

- 用户可绑定多个 Role
- 用户可拥有直接授权的 Permission（Direct Permission）
- 用户权限 = 角色权限 ∪ 直接权限

### 10.3 Role

- Role 是权限集合
- 支持角色继承（子角色继承父角色权限）
- 内置角色：`super_admin` / `admin` / `user`
- 角色可绑定多个 Permission

### 10.4 Permission

- 权限标识格式：`{module}:{action}`，如 `user:create` / `user:delete`
- 权限注册：模块启动时自动注册到权限表
- 权限只有两种状态：有 / 无

### 10.5 Menu

- 菜单树基于权限动态生成
- 菜单数据存储在数据库，支持动态配置
- 菜单节点包含：`name` / `path` / `icon` / `parentId` / `permission` / `sort`
- 按钮级权限通过 `permission` 字段关联

### 10.6 Button Permission

```vue
<template>
  <AButton v-permission="'user:create'">新建用户</AButton>
</template>
```

- 使用自定义指令 `v-permission` 控制按钮显隐
- 按钮权限标识与后端 Permission 一致

### 10.7 Route Permission

- 路由守卫中验证用户权限
- 无权限跳转 403 页面
- 路由 Meta 中声明 `permission` 字段

---

## 11. 日志规范

### 11.1 日志级别

| 级别    | 用途                     |
| ------- | ------------------------ |
| `LOG`   | 常规操作日志             |
| `DEBUG` | 调试信息（生产环境关闭） |
| `INFO`  | 关键业务流程记录         |
| `WARN`  | 异常但不影响流程         |
| `ERROR` | 业务异常和系统异常       |

### 11.2 请求日志

- 拦截所有 HTTP 请求
- 记录：`[method] [path] [status] [duration] [userId]`
- 请求体过大时截断（超过 1KB 省略）
- 敏感字段（password / token）自动脱敏

### 11.3 错误日志

- 使用 NestJS Logger 或 Winston
- 包含：`error message` / `stack` / `requestId` / `userId` / `context`
- 使用 `Logstash` 格式化输出（JSON）
- 聚合到 ELK / Grafana Loki

### 11.4 操作日志

- 记录用户关键操作：创建 / 更新 / 删除 / 登录 / 导出
- 记录操作前后的数据变更（Diff）
- 存储到 MongoDB Collection：`operation_logs`

### 11.5 审计日志

- 记录所有敏感操作：权限变更 / 角色变更 / 删除数据
- 审计日志不可删除、不可修改（Append Only）
- 包含 IP / User-Agent / 操作时间

---

## 12. 错误处理规范

### 12.1 Exception Filter

- 全局 Exception Filter 捕获所有未处理异常
- 统一转换为 `ApiError` 格式返回
- 区分业务异常（`BusinessException`）和系统异常（`SystemException`）

### 12.2 统一错误码

```typescript
export const ErrorCodes = {
  // 通用错误 (10000-10999)
  SUCCESS: { code: 0, message: 'success' },
  UNKNOWN_ERROR: { code: 10000, message: 'unknown error' },
  VALIDATION_FAILED: { code: 10001, message: 'validation failed' },
  NOT_FOUND: { code: 10002, message: 'resource not found' },

  // 认证错误 (11000-11999)
  UNAUTHORIZED: { code: 11000, message: 'unauthorized' },
  TOKEN_EXPIRED: { code: 11001, message: 'token expired' },
  TOKEN_INVALID: { code: 11002, message: 'token invalid' },

  // 权限错误 (12000-12999)
  FORBIDDEN: { code: 12000, message: 'permission denied' },

  // 业务错误 (20000-29999)
  USER_NOT_FOUND: { code: 20001, message: 'user not found' },
  USER_ALREADY_EXISTS: { code: 20002, message: 'user already exists' },
  PASSWORD_INCORRECT: { code: 20003, message: 'password incorrect' },
} as const;
```

### 12.3 禁止直接 `throw Error`

- 必须使用自定义异常类

```typescript
// ✅ 正确
throw new BusinessException(ErrorCodes.USER_NOT_FOUND);

// ❌ 错误
throw new Error('user not found');
throw 'user not found';
```

- 内置异常类：
  - `BusinessException` — 业务逻辑异常
  - `ValidationException` — 参数校验异常
  - `AuthenticationException` — 认证异常
  - `AuthorizationException` — 授权异常
  - `NotFoundException` — 资源未找到
  - `ConflictException` — 资源冲突

---

## 13. 项目目录规范

### 13.1 完整目录树

```
lin-framework/
├── .github/                          # GitHub 配置
│   ├── workflows/                    # CI/CD 配置
│   │   ├── ci.yml
│   │   └── deploy.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                             # 项目文档
│   ├── README.md
│   ├── CONTRIBUTING.md
│   ├── CHANGELOG.md
│   └── architecture/                 # 架构决策记录 (ADR)
│
├── packages/                         # Monorepo 子包
│   ├── server/                       # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts              # 应用入口
│   │   │   ├── app.module.ts        # 根模块
│   │   │   ├── config/              # 配置模块
│   │   │   │   ├── config.module.ts
│   │   │   │   ├── config.schema.ts  # Joi/Zod 配置校验
│   │   │   │   └── env/             # 环境变量配置
│   │   │   ├── common/              # 公共基础设施
│   │   │   │   ├── constants/       # 全局常量
│   │   │   │   ├── enums/           # 全局枚举
│   │   │   │   ├── interfaces/      # 全局接口
│   │   │   │   ├── decorators/      # 自定义装饰器
│   │   │   │   ├── filters/         # Exception Filters
│   │   │   │   ├── guards/          # Auth Guards
│   │   │   │   ├── interceptors/    # 拦截器
│   │   │   │   ├── pipes/           # Validation Pipes
│   │   │   │   ├── middleware/      # 中间件
│   │   │   │   ├── utils/           # 工具函数
│   │   │   │   └── helpers/         # 辅助函数
│   │   │   ├── modules/             # 业务模块
│   │   │   │   ├── auth/            # 认证模块
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   ├── schemas/
│   │   │   │   │   ├── dtos/
│   │   │   │   │   ├── interfaces/
│   │   │   │   │   ├── constants/
│   │   │   │   │   ├── enums/
│   │   │   │   │   └── tests/
│   │   │   │   ├── user/            # 用户模块
│   │   │   │   ├── role/            # 角色模块
│   │   │   │   ├── permission/      # 权限模块
│   │   │   │   ├── menu/            # 菜单模块
│   │   │   │   ├── captcha/         # 验证码模块
│   │   │   │   ├── storage/         # 文件存储模块
│   │   │   │   ├── notification/    # 通知模块
│   │   │   │   ├── system/          # 系统管理模块
│   │   │   │   └── monitor/         # 系统监控模块
│   │   │   ├── shared/             # 共享层
│   │   │   │   ├── database/        # 数据库连接与基类
│   │   │   │   ├── redis/           # Redis 连接与基类
│   │   │   │   ├── queue/           # 消息队列
│   │   │   │   ├── logger/          # 日志服务
│   │   │   │   ├── cache/           # 缓存服务
│   │   │   │   └── pagination/      # 分页工具
│   │   │   ├── plugins/            # 插件模块
│   │   │   │   ├── plugin.interface.ts
│   │   │   │   ├── plugin.module.ts
│   │   │   │   ├── plugin.service.ts
│   │   │   │   └── built-in/        # 内置插件
│   │   │   └── seeds/              # 数据库种子数据
│   │   │       ├── seed.module.ts
│   │   │       ├── seed.service.ts
│   │   │       └── data/
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── web/                          # Vue3 前端
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── App.vue
│   │   │   ├── api/                 # API 请求层
│   │   │   │   ├── request.ts       # Axios 实例
│   │   │   │   ├── user.ts
│   │   │   │   └── role.ts
│   │   │   ├── assets/             # 静态资源
│   │   │   ├── components/         # 公共组件
│   │   │   │   ├── common/         # 通用组件
│   │   │   │   │   ├── AButton.vue
│   │   │   │   │   ├── ATable.vue
│   │   │   │   │   └── AForm.vue
│   │   │   │   └── business/       # 业务组件
│   │   │   ├── composables/        # 可复用组合函数
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── usePagination.ts
│   │   │   │   └── usePermission.ts
│   │   │   ├── constants/          # 常量
│   │   │   ├── directives/         # 自定义指令
│   │   │   │   └── permission.ts
│   │   │   ├── layouts/            # 布局组件
│   │   │   ├── router/             # 路由
│   │   │   │   ├── index.ts
│   │   │   │   ├── routes/         # 路由定义
│   │   │   │   └── guards/         # 路由守卫
│   │   │   ├── stores/             # Pinia Store
│   │   │   │   ├── user.ts
│   │   │   │   ├── app.ts
│   │   │   │   └── permission.ts
│   │   │   ├── styles/             # 全局样式
│   │   │   ├── types/              # 类型定义
│   │   │   │   ├── api.d.ts
│   │   │   │   ├── user.d.ts
│   │   │   │   └── global.d.ts
│   │   │   ├── utils/              # 工具函数
│   │   │   └── views/              # 页面
│   │   │       ├── dashboard/
│   │   │       ├── user/
│   │   │       ├── role/
│   │   │       ├── login/
│   │   │       ├── error/
│   │   │       └── ...
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── uno.config.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── shared/                      # 前后端共享类型
│   │   ├── src/
│   │   │   ├── interfaces/
│   │   │   ├── constants/
│   │   │   ├── enums/
│   │   │   └── utils/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── sdk/                         # 对外 SDK（后续）
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
│
├── docker/                          # Docker 配置
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   ├── nginx.conf
│   └── mongo/
│       └── init.js
│
├── scripts/                         # 项目脚本
│   ├── build.sh
│   ├── deploy.sh
│   └── seed.ts
│
├── .vscode/                         # VSCode 配置
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .husky/                          # Git Hooks
│   ├── pre-commit
│   └── commit-msg
│
├── .env                             # 环境变量
├── .env.example
├── .gitignore
├── .editorconfig
├── .npmrc
├── .prettierrc
├── .eslintrc.js
├── jest.config.ts
├── commitlint.config.js
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── AGENTS.md                        # 本文件
└── README.md
```

### 13.2 目录职责说明

| 目录                           | 职责                                   |
| ------------------------------ | -------------------------------------- |
| `packages/server`              | NestJS 后端应用                        |
| `packages/web`                 | Vue3 前端应用                          |
| `packages/shared`              | 前后端共享类型定义                     |
| `packages/sdk`                 | 对外 SDK 包                            |
| `packages/server/src/common`   | 全局基础设施（过滤器、守卫、拦截器等） |
| `packages/server/src/modules`  | 业务模块（核心代码所在）               |
| `packages/server/src/shared`   | 共享服务（数据库、缓存、队列等）       |
| `packages/server/src/plugins`  | 插件系统                               |
| `packages/web/src/api`         | API 请求封装层                         |
| `packages/web/src/views`       | 页面组件                               |
| `packages/web/src/composables` | 可复用逻辑                             |
| `packages/web/src/stores`      | 全局状态管理                           |
| `docker/`                      | Docker 编排和容器配置                  |
| `scripts/`                     | 构建和部署脚本                         |

---

## 14. 命名规范

### 14.1 变量

- **变量**：小驼峰 `userName` / `accessToken`
- **常量**：全大写下划线 `MAX_RETRY_COUNT` / `DEFAULT_PAGE_SIZE`
- **布尔值**：用 `is` / `has` / `should` / `can` 前缀：`isActive` / `hasPermission`
- **枚举值**：PascalCase：`UserStatus.ACTIVE`
- **私有属性**：TypeScript 使用 `#` 前缀或 `private` 关键字

### 14.2 函数

- **函数名**：小驼峰，动词开头：`getUser` / `createUser` / `updateUser`
- **Controller 方法**：`findAll` / `findOne` / `create` / `update` / `remove`
- **Service 方法**：业务意图命名：`activateUser` / `resetPassword`
- **Repository 方法**：`findByCondition` / `updateById` / `softDeleteById`
- **Composable**：`use` 前缀：`useAuth` / `usePagination`
- **Event Handler**：`handle` 前缀：`handleUserCreated`

### 14.3 Class

- PascalCase：`UserService` / `UserController` / `UserRepository`
- 后缀必须表明类型：`Service` / `Controller` / `Repository` / `Module` / `Guard` / `Filter` / `Interceptor`

### 14.4 DTO

```
{Action}{Entity}Dto
```

- `CreateUserDto`
- `UpdateUserDto`
- `QueryUserDto`
- `UserResponseDto`
- `LoginDto`

### 14.5 Schema / Entity

```
{Entity}
```

- `User`
- `Role`
- `Permission`

### 14.6 Interface

```
I{Name}
```

- `IUserService`
- `IUserRepository`
- `IAuthConfig`

### 14.7 枚举

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}
```

或 `as const` 对象模式（推荐）：

```typescript
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;
```

### 14.8 Collection

- 小写 + 下划线：`users` / `user_roles` / `operation_logs`

### 14.9 文件名

- **Module 文件**：`{module}.module.ts` / `{module}.module.spec.ts`
- **Controller**：`{name}.controller.ts`
- **Service**：`{name}.service.ts`
- **Repository**：`{name}.repository.ts`
- **DTO**：`{name}.dto.ts`
- **Schema**：`{name}.schema.ts`
- **Interface**：`{name}.interface.ts`
- **Guard**：`{name}.guard.ts`
- **Filter**：`{name}.filter.ts`
- **Pipe**：`{name}.pipe.ts`
- **Interceptor**：`{name}.interceptor.ts`
- **Middleware**：`{name}.middleware.ts`

### 14.10 目录名

- 小写 + 中划线：`user-profile` / `system-config`
- 子目录统一复数形式：`controllers` / `services` / `repositories` / `dtos` / `interfaces`

---

## 15. Git 规范

### 15.1 Commit 规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type 类型：**

| Type       | 用途                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | Bug 修复               |
| `refactor` | 重构                   |
| `perf`     | 性能优化               |
| `style`    | 代码风格（不影响功能） |
| `test`     | 测试相关               |
| `docs`     | 文档相关               |
| `chore`    | 构建/工具/依赖         |
| `ci`       | CI/CD 配置             |
| `revert`   | 回滚                   |

**scope 示例：** `auth` / `user` / `permission` / `web` / `server` / `shared`

**示例：**

```
feat(auth): implement OAuth2 login with Google

- Add Passport Google strategy
- Add social account linking
- Add unit tests for OAuth service

Closes #123
```

### 15.2 分支规范

```
main          # 生产分支，只接受 PR
├── develop   # 开发分支
├── feat/*    # 功能分支：feat/user-export
├── fix/*     # 修复分支：fix/login-crash
├── refactor/* # 重构分支：refactor/auth-module
└── release/* # 发布分支：release/v1.2.0
```

### 15.3 PR 规范

- PR 标题遵循 Conventional Commit 格式
- PR 描述包含：背景 / 变更内容 / 影响范围 / 测试说明
- 每个 PR 至少 1 个 Approve
- 合并前确保 CI 通过
- 合并方式：Squash Merge（功能分支）或 Merge Commit（发布分支）

### 15.4 Git 仓库规范

- **单 Git 仓库**：仅项目根目录存在 `.git` 目录，所有子包（`apps/*`、`packages/*`）不得包含嵌套的 `.git` 目录
- **默认分支**：`main`
- monorepo 内所有代码统一在根仓库管理版本，子包不独立维护 Git 历史

---

## 16. AI Coding 规范

### 16.1 核心原则

作为 AI Coding 工具，生成代码时必须遵循以下原则：

1. **遵循 NestJS 最佳实践** — 所有生成代码必须符合 NestJS 官方推荐架构和模式
2. **禁止重复代码** — 发现重复代码必须提取为可复用函数/服务/组件
3. **优先复用** — 修改前先查项目是否已有类似实现，优先复用现有工具函数、基类、装饰器
4. **优先扩展** — 扩展而非修改，通过继承/组合/插件机制扩展现有功能
5. **保持模块解耦** — 新增代码不得引入循环依赖，不破坏模块边界
6. **所有代码必须可维护** — 考虑半年后的开发者阅读代码时的理解成本
7. **优先考虑长期演进** — 避免"临时方案""快速实现"，每个决策考虑未来 3 次迭代
8. **不要为了少写代码牺牲架构** — 架构正确性优先于代码行数

### 16.2 生成代码前的流程

```
分析项目现有架构与风格
    ↓
确定代码所属模块与层级
    ↓
检查是否有可复用基类/工具/组件
    ↓
生成代码（遵循所有规范）
    ↓
自我审查：是否满足所有规范？
```

### 16.3 模块新增规则

- 新增模块必须保持统一目录结构（Module / Controller / Service / Repository / Schema / DTO / Interface）
- 新增 API 必须自动添加 Swagger 装饰器
- 所有 DTO 必须添加 `class-validator` Validation 装饰器
- 每个新增功能必须包含单元测试

### 16.4 代码生成禁区

```typescript
// ❌ 禁止代码

const data = await this.someModel.find(); // 禁止直接操作 Model
throw new Error('something wrong'); // 禁止直接 throw Error
console.log('debug'); // 禁止 console.log
const apiUrl = 'http://localhost:3000'; // 禁止硬编码
const result: any = response; // 禁止 any
// TODO: fix this later                    // 禁止 TODO（要么现在做，要么建 Issue）
if (status === 3) {
  /* magic number */
} // 禁止魔法数字
```

### 16.5 代码与注释同步生成

**生成代码时必须同时生成注释，禁止先写代码后补注释。** AI 生成任何函数、类、接口、DTO、组件时，必须同步输出完整的 TSDoc / JSDoc 注释。注释不是"可选项"，是代码交付物的必要组成部分。

- 生成函数 → 同步生成 `@param` / `@returns` / `@throws`
- 生成类 → 同步生成类说明
- 生成 DTO → 同步生成字段说明
- 生成组件 → 同步生成 Props / Emits 说明
- 修改已有代码 → 同步更新对应注释
- 禁止提交无注释的新增函数

### 16.6 函数注释规范

所有函数必须包含完整 TSDoc：

```typescript
/**
 * 根据用户 ID 查询用户信息并组装权限
 *
 * @param userId - 用户唯一标识
 * @param includePermissions - 是否包含权限树
 * @returns 用户完整信息，含角色和权限
 * @throws NotFoundException 用户不存在时抛出
 */
async findById(userId: string, includePermissions = false): Promise<UserResponse> {
  // ...
}
```

### 16.7 类型安全红线

- **禁止 `any`** — 使用 `unknown` + 类型守卫
- **禁止 `as` 断言**（除非在类型守卫或边界转换中）
- **禁止 `// @ts-ignore`**
- **禁止 `@ts-nocheck`**
- **禁止非类型化的 `Object.keys()` 遍历**
- **禁止 `.d.ts` 中使用 `any`**

### 16.8 导入路径规范

所有文件必须使用 `@/` 路径别名，禁止使用相对路径（`./`、`../`）。

```typescript
// ✅ 正确
import { User } from '@/modules/auth/schemas/user.schema';
import { PermissionService } from '@/modules/permission/services/permission.service';
import { RedisService } from '@/infrastructure/database/redis/redis.service';
import { ErrorCodes } from '@/core/constants';

// ❌ 错误
import { User } from '../../auth/schemas/user.schema';
import { PermissionService } from '@/modules/permission';
import { RedisService } from './redis.service'; // 同一目录下也不行
import { ErrorCodes } from '../constants';
```

**Barrel 文件**（`index.ts`）用于将模块能力暴露给其他模块消费，模块内部文件不应通过 barrel 导入。

### 16.9 代码自检清单

生成代码后，AI 必须自我检查：

- [ ] 是否有重复代码？
- [ ] 是否使用了 `any`？
- [ ] 是否有 TODO？
- [ ] 是否有魔法字符串/数字？
- [ ] 是否有硬编码配置？
- [ ] 是否有直接 `throw Error`？
- [ ] 是否有 `console.log`？
- [ ] DTO 是否添加了 Validation？
- [ ] Controller 是否添加了 Swagger？
- [ ] 是否有单元测试？
- [ ] 是否遵守了分层调用规则？
- [ ] 是否引入了循环依赖？

---

## 17. 代码质量要求

### 17.1 ESLint

- 使用 `@typescript-eslint/strict-type-checked` 规则集
- 结合 `eslint-plugin-import` 检查模块导入顺序
- 结合 `eslint-plugin-prettier` 集成格式化
- 自定义规则：禁止 `any` / 禁止 `console.log` / 禁止 `require` 等

### 17.2 Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 17.3 Strict Mode

- `tsconfig.json` 启用 `strict: true`
- 启用 `noUncheckedIndexedAccess` 防止未定义属性访问
- 启用 `exactOptionalPropertyTypes` 防止可选属性误用
- 启用 `forceConsistentCasingInFileNames` 防止大小写问题

### 17.4 单元测试要求

- 使用 Jest + `@nestjs/testing`
- Service 层测试覆盖率 ≥ 90%
- Controller 层测试覆盖率 ≥ 80%
- Repository 层测试覆盖率 ≥ 70%
- 测试文件与被测文件同目录，后缀 `.spec.ts`
- 每个测试使用 `describe` / `it` / `expect` 结构
- 使用 Mock 替代外部依赖（数据库、缓存）
- 测试数据使用 Factory 或 Fixture 生成

```typescript
// 测试文件示例
describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, { provide: IUserRepository, useValue: mockRepository }],
    }).compile();

    service = module.get(UserService);
    repository = module.get(IUserRepository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      repository.findById.mockResolvedValue(mockUser);
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## 18. 未来规划

### 18.1 插件系统

- 基于 NestJS Dynamic Module 实现插件机制
- 插件可扩展：路由 / Schema / Service / Guard / 资源
- 提供 Plugin API 和 Plugin Lifecycle Hook
- 插件市场（Package Manager 集成）

### 18.2 CRUD Generator

- CLI 工具快速生成完整模块代码
- 支持从 Schema 定义生成 CRUD API
- 自动生成前端列表/表单/详情页面
- 代码生成模板化，可自定义

### 18.3 多租户（Multi-Tenant）

- 数据库级隔离（独立 Collection 或 Database 前缀）
- 中间件自动解析租户上下文
- 租户级别的配置、权限、主题隔离

### 18.4 AI 模块

- AI Gateway（统一 OpenAI / Claude / 本地模型接入）
- AI Agent 框架（工具调用 + 记忆 + RAG）
- 智能搜索与推荐引擎
- AI 驱动的代码生成与审查

### 18.5 工作流（Workflow）

- 基于 BullMQ 的工作流引擎
- 可视化流程设计器
- 审批流、任务流、自动化流
- 超时/重试/补偿机制

### 18.6 消息中心

- 站内信 / 邮件 / 短信 / 推送
- WebSocket 实时推送
- 消息模板管理
- 订阅与偏好设置

### 18.7 支付模块

- 多支付渠道对接（微信 / 支付宝 / Stripe）
- 统一支付接口
- 退款、对账、统计
- 支付通知与回调

### 18.8 内网穿透模块

- 基于 WebSocket 的隧道实现
- 客户端管理
- 流量统计与分析
- 访问控制

### 18.9 开放平台（Open Platform）

- API 网关与鉴权
- 应用管理 / 密钥管理
- 接口文档自动生成
- 调用统计与限流

### 18.10 SDK

- TypeScript SDK（Node.js / Browser）
- REST API 封装
- WebSocket 客户端
- 类型安全、完整文档

### 18.11 MCP

- Model Context Protocol 集成
- 提供 Framework 能力的 MCP Server
- 允许 AI 工具直接操作框架资源
- 服务发现与动态工具注册

---

## 19. 文档索引（Documentation Index）

以下文档是框架的核心设计说明书。**AI 工具在每次回答或执行任务前，必须先读取与当前任务相关的所有文档文件**，以确保回答基于完整的框架设计上下文。

### 19.1 文档清单

| 文件                   | 行数 | 内容概要                                                                    |
| ---------------------- | ---- | --------------------------------------------------------------------------- |
| `docs/coding-style.md` | 727  | 编码规范、TypeScript 规范、命名规范、AI Coding 规范、代码质量要求           |
| `docs/api.md`          | 1045 | API 设计规范、统一响应格式、认证鉴权、所有业务接口定义                      |
| `docs/database.md`     | 539  | 数据库设计、Base Schema、MongoDB Collection、索引策略、Redis 数据结构与缓存 |
| `docs/deployment.md`   | 850  | 部署架构、环境配置、CI/CD 流程、Docker/Nginx 配置、运维规范                 |
| `docs/base-schema.md`  | 237  | 所有数据模型公共基类字段定义（BaseEntity / TreeEntity / Auditable 等）      |
| `ROADMAP.md`           | 650  | 版本规划、功能范围、交付标准、开发进度追踪                                  |
| `ARCHITECTURE.md`      | 506  | 分层架构、模块组织、请求处理流程、数据流、关键设计决策                      |
| `README.md`            | 192  | 项目定位、技术栈、快速启动、核心功能概览                                    |

### 19.2 预读规则

- **每次回答前**：读取本节索引，判断当前任务涉及哪些文档
- **涉及即读**：如果任务涉及一个或多个文档领域，必须先 Read 对应 .md 文件
- **保守原则**：不确定是否相关时，优先读取。例如涉及数据库操作时读 `database.md` + `base-schema.md`
- **避免重复读取**：同一对话中已读取的文件无需重复读取，但新建对话或任务切换后必须重新读取

### 19.3 进度同步规范（强制）

`ROADMAP.md` 是项目开发进度的唯一权威记录。**每完成一个功能特性后，必须同步更新 `ROADMAP.md`**，将对应条目从 `○`（待开始）改为 `◐`（部分完成）或 `✅`（已完成），并确保版本总览和交付标准与实际状态一致。

此规则适用于所有 AI 工具和人类开发者，违反该规范将导致进度记录与实际代码脱节。
