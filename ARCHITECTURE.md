# ARCHITECTURE.md — LIN Framework 架构设计文档

> **规范来源**: AGENTS.md 第 1、2、5、6、9、10、11、12、13 章
>
> 本文档描述 LIN Framework 的整体架构设计，包括分层架构、模块组织、请求处理流程、数据流和关键设计决策。

---

## 1. 架构总览

### 1.1 四层架构

依据 AGENTS.md 第 2.1 节定义，系统采用严格四层架构：

```
Presentation Layer (Controller)
    ↓ 依赖
Application Layer (Service)
    ↓ 依赖
Domain Layer (Entity / ValueObject)
    ↓ 依赖
Infrastructure Layer (Repository / Adapter / External)
```

**核心约束**：

- 外层依赖内层，内层绝不依赖外层（AGENTS.md 2.2）
- 禁止跨层调用：Controller → Service → Repository，不可跳过（AGENTS.md 5.9）
- Controller 不得直接访问 Repository 或 Model（AGENTS.md 5.9）
- Service 不得直接操作数据库，必须通过 Repository（AGENTS.md 5.9）

### 1.2 依赖倒置

- 高层模块定义接口，低层模块实现接口（AGENTS.md 2.2）
- 所有跨层调用必须通过 Interface（AGENTS.md 2.2）
- Interface 命名格式：`I{Name}`，如 `IUserService`、`IUserRepository`（AGENTS.md 14.6）

### 1.3 Monorepo 结构

使用 pnpm Workspace 管理，包含以下子包（AGENTS.md 2.3）：

| 包                | 职责                                 |
| ----------------- | ------------------------------------ |
| `packages/server` | NestJS 后端应用                      |
| `packages/web`    | Vue3 前端应用                        |
| `packages/shared` | 前后端共享类型、常量、枚举、工具函数 |
| `packages/sdk`    | 对外 SDK（后续版本）                 |

### 1.4 模块化原则

- 每个 NestJS Module 是一个有界上下文（Bounded Context）（AGENTS.md 2.4）
- 模块之间禁止循环依赖（AGENTS.md 2.4）
- 模块之间通过 Interface / Event / CQRS 通信（AGENTS.md 2.4）
- 公共逻辑提取到 Shared 层（AGENTS.md 2.4）

---

## 2. 后端架构

### 2.1 模块目录结构

每个业务模块必须遵循 AGENTS.md 第 5.1 节定义的统一结构：

```
modules/{module}/
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

### 2.2 Module 职责

Module 只做依赖注册，不包含业务逻辑（AGENTS.md 5.2）：

- 使用 `forRoot` / `forFeature` 模式注册 Mongoose Model
- 跨模块需要的 Service 通过 `exports` 暴露
- `Global` 装饰器需谨慎使用，只对真正全局模块使用

### 2.3 Controller 职责

Controller 是 Presentation 层入口（AGENTS.md 5.3）：

- 接收请求、参数校验、调用 Service、返回响应
- 方法名对应 HTTP 语义：`findAll` / `findOne` / `create` / `update` / `remove`
- 路由路径使用复数形式：`/users` 而非 `/user`
- 必须添加 Swagger 装饰器（@ApiTags、@ApiOperation、@ApiResponse）

**Controller 不得包含任何业务逻辑，不得直接访问数据库。**

### 2.4 Service 职责

Service 是 Application 层核心（AGENTS.md 5.4）：

- 业务逻辑编排、事务管理、领域规则校验
- 方法名清晰表达业务意图：`activateUser` / `resetPassword` / `syncPermissions`
- 所有业务逻辑必须放在 Service
- 使用 `@Injectable()` 且作用域为 `DEFAULT`（单例）

### 2.5 Repository 职责

Repository 是 Infrastructure 层组件（AGENTS.md 5.5）：

- 所有数据库操作必须通过 Repository
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

### 2.6 请求处理全流程

```
HTTP Request
  │
  ▼
Middleware          → 请求日志、CORS、速率限制
  │
  ▼
Guard               → JWT 验证、角色/权限校验
  │
  ▼
Interceptor (前)    → 请求转换、缓存检查
  │
  ▼
Pipe                → DTO 验证、参数转换（class-validator）
  │
  ▼
Controller          → 接收请求，调用 Service
  │
  ▼
Service             → 业务逻辑编排、事务管理
  │
  ▼
Repository          → 数据库 CRUD 操作
  │
  ▼
Interceptor (后)    → 响应转换、统一格式包装
  │
  ▼
Exception Filter    → 捕获异常，统一错误格式输出
```

### 2.7 公共基础设施

依据 AGENTS.md 13.1 目录规范，全局基础设施位于 `packages/server/src/common/`：

| 目录            | 职责              | 对应 AGENTS.md 章节 |
| --------------- | ----------------- | ------------------- |
| `constants/`    | 全局常量          | 4.4                 |
| `enums/`        | 全局枚举          | 4.3                 |
| `interfaces/`   | 全局接口          | 5.8                 |
| `decorators/`   | 自定义装饰器      | —                   |
| `filters/`      | Exception Filters | 12.1                |
| `guards/`       | Auth Guards       | —                   |
| `interceptors/` | 拦截器            | —                   |
| `pipes/`        | Validation Pipes  | —                   |
| `middleware/`   | 中间件            | —                   |
| `utils/`        | 工具函数          | —                   |

### 2.8 Shared 共享层

位于 `packages/server/src/shared/`，提供通用服务（AGENTS.md 13.1）：

| 模块          | 职责                         |
| ------------- | ---------------------------- |
| `database/`   | 数据库连接与基类 Repository  |
| `redis/`      | Redis 连接与缓存服务         |
| `queue/`      | 消息队列（BullMQ，后续版本） |
| `logger/`     | 日志服务（基于 Winston）     |
| `cache/`      | 缓存服务抽象                 |
| `pagination/` | 分页工具                     |

---

## 3. 前端架构

### 3.1 技术选型

依据 AGENTS.md 第 6 章定义：

- Vue3 Composition API + `<script setup lang="ts">`
- Pinia 状态管理（Setup Store 语法）
- Vue Router（懒加载 + 路由守卫）
- Naive UI 组件库
- UnoCSS 原子化样式
- Axios HTTP 客户端

### 3.2 目录结构

```
src/
├── api/                  # API 请求层（按模块拆分）
├── assets/               # 静态资源
├── components/           # 公共组件
│   ├── common/           # 通用组件（AButton、ATable、AForm）
│   └── business/         # 业务组件
├── composables/          # 可复用组合函数
├── constants/            # 全局常量
├── directives/           # 自定义指令（v-permission）
├── layouts/              # 布局组件
├── router/               # 路由配置 + 守卫
├── stores/               # Pinia Store
├── styles/               # 全局样式
├── types/                # 类型定义
├── utils/                # 工具函数
└── views/                # 页面组件
```

### 3.3 数据流

```
User Action
  │
  ▼
Component (View)        → `<script setup>` + `defineProps` / `defineEmits`
  │
  ▼
Composable / Store      → 业务逻辑 + 状态管理
  │
  ▼
API Layer               → Axios 实例（拦截器、Token 刷新）
  │
  ▼
NestJS Backend API      → RESTful JSON
```

### 3.4 组件层级

```
App.vue
└── Layout.vue
    ├── Sidebar.vue              (菜单树，基于权限动态生成)
    ├── Header.vue               (面包屑 + 用户下拉)
    └── <router-view />          (页面内容)
```

### 3.5 路由与权限

- 路由懒加载：`() => import('@/views/xxx.vue')`（AGENTS.md 6.3）
- 路由命名：`{module}-{page}`，如 `user-list`（AGENTS.md 6.3）
- Meta 元信息：`title` / `permission` / `icon` / `keepAlive`（AGENTS.md 6.3）
- 路由守卫统一在 `router/guards/` 中管理（AGENTS.md 6.3）
- 按钮权限通过 `v-permission` 指令控制（AGENTS.md 10.6）

---

## 4. API 设计

### 4.1 统一返回格式

依据 AGENTS.md 第 9.1 节：

```typescript
interface ApiResponse<T = unknown> {
  code: number; // 业务状态码
  message: string; // 提示信息
  data: T; // 响应数据
  timestamp: number; // 时间戳
  requestId: string; // 请求追踪 ID
}
```

### 4.2 统一异常格式

依据 AGENTS.md 第 9.2 节：

```typescript
interface ApiError {
  code: number;
  message: string;
  timestamp: number;
  requestId: string;
  path: string;
}
```

### 4.3 RESTful 路由设计

依据 AGENTS.md 第 9.4 节：

| 方法   | 路径                         | 说明               |
| ------ | ---------------------------- | ------------------ |
| GET    | `/api/v1/users`              | 分页查询用户列表   |
| GET    | `/api/v1/users/:id`          | 查询单个用户       |
| POST   | `/api/v1/users`              | 创建用户           |
| PATCH  | `/api/v1/users/:id`          | 部分更新用户       |
| DELETE | `/api/v1/users/:id`          | 删除用户           |
| POST   | `/api/v1/users/:id/activate` | 自定义操作（动词） |

### 4.4 HTTP 状态码

依据 AGENTS.md 第 9.3 节：

| 状态码 | 场景                 |
| ------ | -------------------- |
| 200    | 成功                 |
| 201    | 创建成功             |
| 204    | 删除成功（无返回体） |
| 400    | 参数校验失败         |
| 401    | 未认证               |
| 403    | 无权限               |
| 404    | 资源不存在           |
| 409    | 资源冲突             |
| 422    | 业务规则校验失败     |
| 429    | 请求频率限制         |
| 500    | 服务器内部错误       |

### 4.5 Swagger 要求

依据 AGENTS.md 第 9.5 节：

- 所有 Controller 必须添加 `@ApiTags()`
- 所有方法必须添加 `@ApiOperation({ summary, description })`
- DTO 属性必须添加 `@ApiProperty()`
- 使用 `@ApiBearerAuth()` 标识需要认证的接口
- 使用 `@ApiQuery()` / `@ApiParam()` 描述参数

---

## 5. 权限架构

### 5.1 RBAC 模型

依据 AGENTS.md 第 10 章定义：

```
User → Role → Permission
```

- 用户可绑定多个 Role（AGENTS.md 10.2）
- 用户可拥有直接授权的 Permission（Direct Permission）（AGENTS.md 10.2）
- 用户权限 = 角色权限 ∪ 直接权限（AGENTS.md 10.2）
- 支持角色继承（子角色继承父角色权限）（AGENTS.md 10.3）
- 权限标识格式：`{module}:{action}`，如 `user:create`（AGENTS.md 10.4）
- 权限注册：模块启动时自动注册到权限表（AGENTS.md 10.4）

### 5.2 内置角色

依据 AGENTS.md 第 10.3 节：

- `super_admin` — 超级管理员（拥有所有权限）
- `admin` — 管理员
- `user` — 普通用户

### 5.3 权限校验流程

```
请求到达
  │
  ▼
JwtAuthGuard         → 验证 Access Token，提取用户身份
  │
  ▼
RolesGuard           → 验证用户角色是否满足要求（@Roles()）
  │
  ▼
PermissionsGuard     → 验证用户权限是否满足要求（@Permissions()）
  │
  ▼
v-permission (前端)  → 按钮级权限控制
```

---

## 6. 日志架构

### 6.1 日志分级

依据 AGENTS.md 第 11.1 节：

| 级别    | 用途                     |
| ------- | ------------------------ |
| `LOG`   | 常规操作日志             |
| `DEBUG` | 调试信息（生产环境关闭） |
| `INFO`  | 关键业务流程记录         |
| `WARN`  | 异常但不影响流程         |
| `ERROR` | 业务异常和系统异常       |

### 6.2 日志分类

依据 AGENTS.md 第 11.2-11.5 节：

| 日志类型 | 记录内容                                             | 存储位置                 |
| -------- | ---------------------------------------------------- | ------------------------ |
| 请求日志 | `[method] [path] [status] [duration] [userId]`       | 文件 / ELK               |
| 错误日志 | error message / stack / requestId / userId / context | 文件 / ELK               |
| 操作日志 | 用户关键操作、数据变更 Diff                          | MongoDB `operation_logs` |
| 审计日志 | 权限变更、角色变更、删除数据（Append Only）          | MongoDB `audit_logs`     |

---

## 7. 错误处理架构

### 7.1 全局 Exception Filter

依据 AGENTS.md 第 12.1 节：

- 捕获所有未处理异常
- 统一转换为 `ApiError` 格式返回
- 区分业务异常（`BusinessException`）和系统异常（`SystemException`）

### 7.2 错误码体系

依据 AGENTS.md 第 12.2 节：

| 范围        | 分类     |
| ----------- | -------- |
| 0           | 成功     |
| 10000-10999 | 通用错误 |
| 11000-11999 | 认证错误 |
| 12000-12999 | 权限错误 |
| 20000-29999 | 业务错误 |

### 7.3 自定义异常类

依据 AGENTS.md 第 12.3 节，必须使用以下自定义异常类：

```typescript
throw new BusinessException(ErrorCodes.USER_NOT_FOUND); // ✅
throw new ValidationException('参数校验失败'); // ✅
throw new AuthenticationException('未登录'); // ✅
throw new AuthorizationException('无权限'); // ✅
throw new NotFoundException('资源不存在'); // ✅
throw new ConflictException('资源冲突'); // ✅

throw new Error('user not found'); // ❌ 禁止
```

---

## 8. 数据库架构

### 8.1 MongoDB

依据 AGENTS.md 第 7 章：

- Collection 命名：小写 + 下划线（AGENTS.md 7.1）
- Schema 必须使用 `@Schema({ timestamps: true })`（AGENTS.md 7.2、7.3）
- 所有文档支持软删除：`isDeleted` / `deletedAt` / `deletedBy`（AGENTS.md 7.4）
- 所有查询字段必须建立索引（AGENTS.md 7.5）
- ObjectId 引用字段使用 `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ModelName' })`（AGENTS.md 7.6）
- 统一分页参数：`page` / `limit` / `sort` / `order`（AGENTS.md 7.7）

### 8.2 Redis

依据 AGENTS.md 第 8 章：

- Key 命名格式：`{project}:{module}:{entity}:{id}:{field}`（AGENTS.md 8.1）
- 缓存 Key 统一在 `constants/cache-keys.ts` 中管理（AGENTS.md 8.2）
- Access Token 使用 JWT（无状态），Refresh Token 存储在 Redis（AGENTS.md 8.3）
- Token 黑名单使用 Redis SET 存储（AGENTS.md 8.3）
- 分布式锁基于 Redis SET NX（AGENTS.md 8.4）

---

## 9. 目录结构

完整目录结构依据 AGENTS.md 第 13.1 节定义，以下为顶层结构：

```
lin-framework/
├── packages/
│   ├── server/           # NestJS 后端
│   ├── web/              # Vue3 前端
│   ├── shared/           # 共享类型
│   └── sdk/              # 对外 SDK
├── docs/                 # 项目文档
├── docker/               # Docker 编排
├── scripts/              # 构建部署脚本
├── .github/              # CI/CD + Issue/PR 模板
├── .husky/               # Git Hooks
├── AGENTS.md             # AI 编程规范
├── ARCHITECTURE.md       # 本文件 — 架构设计文档
├── ROADMAP.md            # 开发路线图
└── README.md             # 项目说明
```

---

## 10. 架构演进路线

依据 AGENTS.md 第 18 章未来规划：

| 阶段     | 版本      | 新增架构组件                                         |
| -------- | --------- | ---------------------------------------------------- |
| 第一阶段 | v0.1-v1.0 | 四层架构、RBAC、日志系统、文件存储、通知             |
| 第二阶段 | v1.5      | 插件系统、CRUD Generator、BullMQ 消息队列、WebSocket |
| 第三阶段 | v2.0      | 多租户隔离、工作流引擎、开放平台                     |
| 第四阶段 | v3.0      | AI Gateway、支付模块、内网穿透、SDK、MCP Server      |
