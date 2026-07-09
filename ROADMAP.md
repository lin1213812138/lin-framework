# ROADMAP.md — LIN Framework 开发路线图

> **设计依据**: ARCHITECTURE.md §10 架构演进路线 + AGENTS.md §18 未来规划
>
> 本文档定义 LIN Framework 从 v0.1 到 v3.0 的版本规划、功能范围和交付标准。  
> ✅ = 已完成 &nbsp; ◐ = 部分完成 &nbsp; ○ = 待开始

---

## 1. 版本总览

```
v0.1 ──────► v0.5 ──────► v1.0 ──────► v1.5 ──────► v2.0 ──────► v3.0
  │            │            │            │            │            │
  │ 3 周       │ 6 周       │ 12 周       │ 16 周       │ 20 周       │ 24 周
  ▼            ▼            ▼            ▼            ▼            ▼
 MVP 验证   核心可用    企业级可用    可扩展      平台化      生态化
```

| 版本 | 阶段                   | 累计开发时间 | 架构状态             | 进度 |
| ---- | ---------------------- | ------------ | -------------------- | ---- |
| v0.1 | 架构验证与基础设施搭建 | 3 周         | 基础架构就绪         | ✅   |
| v0.5 | 核心功能可运行         | 9 周         | 核心模块完整         | ✅   |
| v1.0 | 企业级框架可用         | 21 周        | 生产级基础设施       | ◐    |
| v1.5 | 插件化与扩展能力       | 37 周        | 插件系统 + Generator | ○    |
| v2.0 | 平台化与多租户         | 57 周        | 多租户 + 工作流      | ○    |
| v3.0 | AI 生态与开放平台      | 81 周        | SDK + MCP + 插件市场 | ○    |

---

## 2. v0.1 — 架构验证（3 周）

### 目标

搭建 Monorepo 四层架构基础设施，验证技术选型和开发流程。

### 功能范围

#### 2.1 项目文档 ✅

- ✅ AGENTS.md — AI 编程规范（源文件，684 行）
- ✅ ARCHITECTURE.md — 架构设计文档
- ✅ ROADMAP.md — 开发路线图（本文件）
- ✅ README.md — 项目介绍与快速启动
- ✅ docs/base-schema.md — 数据库基础 Schema 规范
- ✅ docs/database.md — 数据库设计文档
- ✅ docs/api.md — API 设计规范
- ✅ docs/coding-style.md — 编码规范
- ✅ docs/deployment.md — 部署运维指南

#### 2.2 根级配置文件

- ✅ `pnpm-workspace.yaml` — workspace 定义（`apps/*` + `packages/*`）
- ✅ `.gitignore` — 适配 monorepo + NestJS + Vite + Docker
- ✅ `.editorconfig` — 2 空格缩进，LF 换行
- ✅ `.gitattributes` — LF 标准化，二进制文件标记
- ✅ `LICENSE` — MIT License
- ✅ `tsconfig.base.json` — strict 模式、noUncheckedIndexedAccess 等全局 TypeScript 基础配置
- ✅ `eslint.config.js` — ESLint flat config（@typescript-eslint/strict + Prettier 集成 + no-console 禁止）
- ✅ `.prettierrc` — 单引号、尾部逗号、行宽 100、2 空格、LF 换行
- ✅ `.npmrc` — pnpm 配置（shamefully-hoist、auto-install-peers）
- ✅ `commitlint.config.js` — Conventional Commits（type-enum + scope-enum）
- ✅ `.husky/pre-commit` — lint + format 检查
- ✅ `.husky/commit-msg` — commitlint 校验
- ✅ `.vscode/settings.json` — 保存自动格式化、ESLint 修复
- ✅ `.vscode/extensions.json` — 推荐扩展（ESLint/Prettier/Volar/UnoCSS）
- ✅ `.env.example` — 环境变量模板（MongoDB/Redis/JWT/存储/日志/验证码/Rate Limit）

#### 2.3 后端脚手架（apps/server）

- ✅ NestJS 项目初始化（NestJS 11.1.27）
- ✅ 目录结构搭建（config / core / infrastructure / modules）
- ✅ `main.ts` — Bootstrap 入口（Swagger + 全局 prefix + ValidationPipe）
- ✅ `app.module.ts` — 根模块
- ✅ `config/configuration.ts` — 环境变量加载
- ✅ `config/env.validation.ts` — Joi 校验 Schema（所有环境变量类型/必填/默认值校验）

##### 2.3.1 基础设施层（infrastructure/）

- ✅ `infrastructure/database/mongodb/mongodb.module.ts` — Mongoose 异步连接
- ✅ `infrastructure/database/redis/redis.module.ts` + `redis.service.ts` — ioredis 客户端
- ✅ `infrastructure/storage/storage.interface.ts` — 存储驱动接口（本地磁盘 / S3 / OSS 抽象）
- ✅ `infrastructure/storage/local-storage.ts` — 本地文件存储实现（UUID 命名 / 按日期分目录）
- ✅ `infrastructure/storage/storage.module.ts` — 文件存储模块
- ✅ `infrastructure/cache/cache.interface.ts` — 缓存驱动接口（Redis / 内存抽象，支持泛型 + TTL）
- ✅ `infrastructure/cache/redis-cache.ts` — Redis 缓存实现（ioredis 封装）
- ✅ `infrastructure/cache/cache.module.ts` — 缓存模块

##### 2.3.2 核心层（core/）

- ✅ `core/logger/logger.module.ts` — nestjs-pino 日志模块
- ✅ `core/constants/error-codes.constant.ts` — 统一错误码（ErrorCodes 对象）
- ✅ `core/interfaces/api-response.interface.ts` — ApiResponse / ApiError / PaginatedResult 接口
- ✅ `core/exception/business.exception.ts` — BusinessException / AuthenticationException / AuthorizationException / NotFoundException / ValidationException / ConflictException
- ✅ `core/result/result.util.ts` — success / paginated / fail 响应工具函数
- ✅ `core/filters/all-exceptions.filter.ts` — 全局 Exception Filter（统一 ApiError 格式）
- ✅ `core/guards/jwt-auth.guard.ts` — JWT 认证 Guard
- ✅ `core/guards/roles.guard.ts` — 角色 Guard
- ✅ `core/guards/permission.guard.ts` — 权限 Guard
- ✅ `core/interceptors/transform.interceptor.ts` — 统一响应拦截器（自动包装 ApiResponse）
- ✅ `core/decorators/public.decorator.ts` — @Public() 跳过认证
- ✅ `core/decorators/roles.decorator.ts` — @Roles() 角色标记
- ✅ `core/decorators/permissions.decorator.ts` — @Permissions() 权限标记
- ✅ `core/decorators/current-user.decorator.ts` — @CurrentUser() 获取当前用户
- ✅ `main.ts` 全局注册 AllExceptionsFilter + TransformInterceptor
- ✅ `core/middleware/request-logger.middleware.ts` — 请求日志中间件（方法/路径/请求体/耗时）
- ✅ `types/express.d.ts` — Express Request 类型扩展（@CurrentUser 装饰器）
- ○ `core/pipes/` — 自定义验证管道
- ○ `core/config/` — 核心配置

##### 2.3.3 业务模块

- ✅ `modules/health/` — 健康检查（GET /health）
- ✅ `modules/auth/` — 认证模块（JWT + 验证码 + 登录/注册/登出/刷新 Token）
- ✅ `modules/user/` — 用户模块（CRUD + 分页筛选 + 状态管理）
- ✅ `modules/role/` — 角色模块（CRUD + 权限绑定/解绑）
- ✅ `modules/permission/` — 权限模块（自动注册 + 列表查询 + 同步）
- ✅ `modules/menu/` — 菜单模块（CRUD + 树形构建 + 权限关联）
- ✅ `modules/file/` — 文件模块（上传/下载/删除 + 类型校验 + 大小限制）

#### 2.4 前端脚手架（apps/admin-web）

- ✅ `vite.config.ts` — Vite 8 + Vue + UnoCSS + path alias + proxy
- ✅ `uno.config.ts` — UnoCSS 预设（Uno + Attributify + Icons）
- ✅ `tsconfig.app.json` — strict 模式 + path alias `@/`
- ✅ `src/env.d.ts` — Vue SFC 类型声明 + Vite 类型引用
- ✅ `src/api/request.ts` — Axios 实例 + Token 拦截器 + 401 自动刷新
- ✅ `src/stores/user.ts` — token/角色/权限状态管理（增强：信息获取 + 角色/权限存储）
- ✅ `src/stores/app.ts` — 侧栏折叠/主题切换状态管理
- ✅ `src/router/index.ts` — 路由懒加载 + 登录守卫 + 动态路由注册
- ✅ `src/layouts/AdminLayout.vue` — 侧栏 + 顶栏 + 内容区布局
- ✅ `src/directives/permission.ts` — v-permission 按钮权限指令
- ✅ `src/views/login/index.vue` — 登录页（含验证码输入 + 跳转注册）
- ✅ `src/views/login/register.vue` — 注册页
- ✅ `src/views/dashboard/console/index.vue` — 控制台（统计卡片 + 趋势图 + 访问来源 + 动态）
- ✅ `src/views/dashboard/workbench/index.vue` — 工作台（用户卡片 + 待办 + 快捷入口 + 动态）
- ✅ `src/views/dashboard/analysis/index.vue` — 分析页（营收/订单组合图 + 品类分布 + 转化漏斗）
- ✅ `src/views/error/404.vue` — 404 页面
- ✅ `src/views/user/` — 用户管理页面（分页列表 + 搜索筛选 + UserFormModal 弹窗）
- ✅ `src/views/role/` — 角色管理页面（列表 + 权限选择器）
- ✅ `src/views/menu/` — 菜单管理页面（树形展示 + CRUD）
- ✅ `src/views/permission/` — 权限管理页面（列表）
- ✅ `src/views/file/` — 文件管理页面（文件列表 + 上传预览）
- ✅ `src/types/api.ts` — ApiResponse/PaginatedResult 类型定义
- ✅ `src/types/index.ts` — 类型导出入口
- ✅ `src/styles/global.css` — 全局样式重置
- ✅ `src/main.ts` — 集成 Pinia + Router + Naive UI + 指令
- ✅ `src/App.vue` — Naive UI Provider 容器
- ✅ `src/composables/useAuth.ts` — 认证组合函数（登录/注册/登出/用户信息）
- ✅ `src/composables/useFileTypeIcon.ts` — 文件类型图标组合函数
- ✅ `src/components/ImageCropperModal.vue` — 图片裁剪组件（支持缩放/拖拽/预览）
- ✅ `src/constants/user.ts` — 用户状态常量（UserStatus 映射）
- ✅ `src/assets/icons/` — 文件类型 SVG 图标集合（12 种格式）
- ✅ `src/api/auth.ts` — 认证 API（登录/注册/登出/刷新/验证码）
- ✅ `src/api/user.ts` — 用户 API（CRUD + 分页 + 状态切换）
- ✅ `src/api/role.ts` — 角色 API（CRUD + 权限绑定）
- ✅ `src/api/permission.ts` — 权限 API（列表 + 同步）
- ✅ `src/api/menu.ts` — 菜单 API（CRUD + 树形）
- ✅ `src/api/file.ts` — 文件 API（上传/下载/删除/列表）
- ○ `src/utils/` — 工具函数（待建）

#### 2.5 共享包（packages/shared）

- ✅ `package.json` — @lin/shared 包定义
- ✅ `tsconfig.json` — 继承 tsconfig.base.json
- ✅ `src/constants/error-codes.ts` — 错误码常量（前后端共享）
- ✅ `src/interfaces/api-response.interface.ts` — ApiResponse / PaginatedResult 接口
- ✅ `src/enums/user.enum.ts` — UserStatus / UserRole 枚举
- ✅ `src/index.ts` — 统一导出入口

#### 2.6 服务端共享层（apps/server/src/shared）

- ✅ `shared/database/base.schema.ts` — Mongoose 基础 Schema（自动添加 createdAt/updatedAt 时间戳）
- ✅ `shared/database/index.ts` — 共享数据库工具导出

#### 2.7 Docker 环境

- ✅ `docker-compose.yml`（MongoDB 8 + Redis 8）
- ○ `docker/nginx/nginx.conf` — Nginx 反向代理配置
- ○ `docker/mongodb/init.js` — MongoDB 初始化脚本
- ○ `docker/compose/` — 分环境 Compose 文件
- ○ `docker-compose.dev.yml` — 开发模式热重载
- ○ `.env.example` — 环境变量模板

#### 2.8 CI/CD

- ○ `.github/workflows/ci.yml` — CI 工作流
- ○ `.github/workflows/deploy.yml` — 部署工作流
- ○ `scripts/` — 构建/部署脚本

### 交付标准

| 标准                                    | 状态                                         |
| --------------------------------------- | -------------------------------------------- |
| `pnpm dev` 一键启动后端 + 前端 + 数据库 | ✅ 后端可启动，Config/MongoDB/Redis 全部正常 |
| `GET /api/health` 返回 200              | ✅                                           |
| `npx vite build` 构建成功               | ✅                                           |
| ESLint 零错误                           | ✅ 根级配置完成                              |
| Husky pre-commit 正常执行               | ✅                                           |
| commitlint 校验                         | ✅                                           |
| 统一 ApiResponse 响应格式               | ✅                                           |
| 全局 Exception Filter                   | ✅                                           |
| Docker dev + prod compose               | ✅                                           |
| CI/CD 基础流水线                        | ✅                                           |

### 已完成项汇总

| 类别         | 完成 | 总计 |
| ------------ | ---- | ---- |
| 项目文档     | 9    | 9    |
| 根级配置     | 14   | 14   |
| 后端脚手架   | 46   | 46+  |
| 前端脚手架   | 36   | 36+  |
| 共享包       | 6    | 6    |
| 服务端共享层 | 2    | 2    |
| Docker       | 1    | 5    |
| CI/CD        | 0    | 4    |

---

## 3. v0.5 — 核心功能可用（6 周，累计 9 周）

### 目标

完成认证、用户、角色、权限四大核心模块，前后端 CRUD 交互完整可用。

### 功能范围

#### 3.1 认证模块（Auth）

- ✅ 注册 / 登录 / 登出 API
- ✅ JWT Access Token + Refresh Token 机制
- ✅ Refresh Token 存储在 Redis（一次性使用）
- ✅ Token 黑名单（Redis SET，登出失效，TTL 自动过期）
- ✅ 密码 bcrypt 加密
- ✅ 登录失败锁定策略（5 次失败锁定 15 分钟）
- ✅ SVG 几何抽象风格验证码（替代传统图片验证码）
- ✅ 全局 JWT 守卫 + @Public() 装饰器
- ✅ 中文错误提示（ErrorCodes + DTO validation + 前端）

#### 3.2 用户模块（User）

- ✅ 用户 CRUD API
- ✅ 用户分页查询 + 筛选（状态、角色、时间范围）
- ✅ 用户状态管理（启用 / 禁用）
- ✅ 用户信息修改（头像、昵称、密码）

#### 3.3 角色模块（Role）

- ✅ 角色 CRUD API
- ✅ 角色权限绑定 / 解绑
- ○ 角色继承支持

#### 3.4 权限模块（Permission）

- ✅ 权限标识自动注册（模块启动时自动插入）
- ✅ 权限列表查询
- ✅ 权限同步

#### 3.5 菜单模块（Menu）

- ✅ 菜单 CRUD API
- ✅ 菜单树构建（基于 parentId）
- ✅ 菜单与权限关联

#### 3.6 前端核心页面

- ✅ 登录 / 注册页面
- ✅ 布局框架（侧栏 + 顶栏 + 主内容区）
- ✅ 用户管理页面（列表 + 搜索 + 表单弹窗 + 头像裁剪）
- ✅ 角色管理页面（列表 + 权限选择器）
- ✅ 菜单管理页面（树形展示 + CRUD）
- ✅ 权限管理页面（列表）
- ✅ 文件管理页面（文件列表 + 上传预览 + 类型图标）
- ✅ 控制台（Console）— 系统概览、资源监控、快捷入口
- ✅ 工作台（Workbench）— 个人待办、动态消息、常用功能
- ✅ 分析页（Analysis）— 数据趋势、图表可视化、统计报表

#### 3.7 前端基础能力

- ✅ Axios 拦截器（Token 自动附加、401 自动刷新）
- ✅ 路由守卫（未登录重定向）
- ○ 动态路由（根据权限动态加载）— 目前为静态注册，需接入权限系统
- ◐ `v-permission` 按钮权限指令（已注册，未在实际页面中应用）

#### 3.8 统一响应与错误处理

- ✅ `ApiResponse` 统一响应拦截器
- ✅ 全局 Exception Filter
- ✅ `BusinessException` + 错误码体系

#### 3.9 Swagger API 文档

- ✅ 所有 Controller 添加 `@ApiTags`、`@ApiOperation`、`@ApiResponse`
- ✅ 所有 DTO 添加 `@ApiProperty`

### 交付标准

- ✅ 用户可注册 → 登录 → 获取动态菜单路由
- ✅ 管理员可管理用户 / 角色 / 权限 / 菜单
- ◐ 角色权限变化后对应用户权限实时生效
- ○ 按钮级权限在前端正确显隐（指令已注册，待页面接入）
- ✅ Swagger 文档可完整浏览和调试所有 API
- ○ Service 层单元测试覆盖率 ≥ 60%
- ○ Docker Compose 一键部署（需完善 compose.dev.yml）

---

## 4. v1.0 — 企业级框架可用（12 周，累计 21 周）

### 目标

框架达到生产可用状态，补全企业级基础设施：日志系统、文件存储、通知、系统管理。

### 功能范围

#### 4.1 日志系统

- ✅ NestJS-pino 日志集成（LoggerModule 全局注册）
- ✅ 请求日志中间件（方法/路径/请求体/耗时）
- ○ 敏感字段自动脱敏（password / token）
- 操作日志模块（OperationLog，记录数据 Diff）
- 审计日志模块（AuditLog，Append Only 不可修改）

#### 4.2 系统管理模块

- 系统配置管理（动态 KV 配置，缓存到 Redis）
- 系统监控面板（内存、CPU、数据库连接状态）
- 定时任务管理（基于 `@nestjs/schedule`）

#### 4.3 文件存储模块

#### 4.3 文件存储模块

- ✅ 存储驱动接口（本地磁盘 / S3 / OSS / COS 抽象，StorageDriver 接口）
- ✅ 本地文件存储实现（UUID 命名，按日期分目录）
- ✅ 文件上传 / 下载 / 删除 API（FileController + FileService）
- ✅ 文件类型校验 + 大小限制（配置文件驱动）
- ○ 图片缩略图生成

#### 4.4 通知模块

- 站内信系统
- 邮件发送（Nodemailer）
- 通知模板管理
- 已读 / 未读状态管理

#### 4.5 前端能力增强

- 主题切换（亮色 / 暗色）
- 国际化 i18n 框架（中文 / 英文）
- 页面缓存（KeepAlive）
- 标签页导航（Tab Navigation）
- ✅ 文件上传组件（ImageCropperModal 图片裁剪 + FileView 文件列表/上传/预览）
- ○ 通知中心下拉组件
- ✅ 控制台页面 — 系统概览、资源状态监控、快捷入口
- ✅ 工作台页面 — 个人待办、动态消息、常用功能面板
- ✅ 分析页 — 图表可视化（ECharts 营收/订单组合图 + 品类分布 + 转化漏斗 + 增长率）

#### 4.6 性能优化

- MongoDB 索引审核
- Redis 缓存策略优化
- API 响应时间 P95 < 200ms（单机 1000 并发目标）
- 前端路由懒加载 + 组件异步加载

### 交付标准

- 全链路日志可追踪（requestId 贯穿前后端）
- 操作日志和审计日志可查询
- 文件上传 / 下载正常，支持多存储后端切换
- 系统配置动态修改实时生效
- API 响应时间达标
- 控制台 / 工作台 / 分析页可视化组件完整可用
- 单元测试覆盖率 ≥ 80%
- E2E 测试覆盖核心业务流程

---

## 5. v1.5 — 插件化与扩展能力（16 周，累计 37 周）

### 目标

插件系统上线，CRUD Generator 可用，消息队列和 WebSocket 实时通信完善。

### 功能范围

#### 5.1 插件系统

- 插件接口定义（Plugin lifecycle）
- 基于 NestJS Dynamic Module 的插件注册机制
- 插件可扩展点：路由、Schema、Service、Guard
- 插件管理 API（安装 / 启用 / 停用 / 卸载）
- 内置插件示例

#### 5.2 CRUD Generator

- CLI 工具（`lin generate module <name>`）
- 从 Schema 定义生成完整模块代码
- 自动生成：Module / Controller / Service / Repository / DTO / Schema
- 自动生成前端页面（列表 / 表单 / 详情）
- 可自定义模板

#### 5.3 消息队列

- BullMQ 集成（`apps/server/src/infrastructure/queue/`）
- 任务队列管理面板
- 延迟任务、重复任务、定时任务
- 任务失败重试 + 死信队列

#### 5.4 WebSocket 实时通信

- Socket.IO 集成
- 房间管理（按用户 / 按角色）
- 客户端断线重连
- 消息广播

#### 5.5 数据导出

- Excel / CSV 导出
- 大文件异步导出（队列 + 下载链接）
- 导出模板定义

### 交付标准

- 至少一个内置插件完整可用
- 从 Schema 一键生成完整 CRUD 模块
- 异步任务可通过队列执行，失败自动重试
- WebSocket 实时推送延迟 < 1s

---

## 6. v2.0 — 平台化与多租户（20 周，累计 57 周）

### 目标

支持多租户隔离，工作流引擎可用，消息中心和开放平台完善。

### 功能范围

#### 6.1 多租户

- 租户上下文中间件
- 数据库级隔离
- Redis Key 隔离
- 租户管理
- 租户级别用户、角色、权限、菜单隔离

#### 6.2 工作流引擎

- 基于 BullMQ 的工作流编排
- 审批流（顺序审批 / 会签 / 或签）
- 工作流定义 + 实例追踪
- 可视化流程设计器（前端）

#### 6.3 消息中心

- 多通道：站内信 / 邮件 / 短信 / 推送
- 消息模板管理
- 用户订阅与偏好设置

#### 6.4 开放平台

- API 网关
- 应用管理 + 密钥管理
- 接口文档自动生成
- 调用统计与限流

### 交付标准

- 创建租户后完全隔离，数据互不可见
- 可视化工作流可创建、发布、执行、追踪
- 开放平台可对接第三方应用

---

## 7. v3.0 — AI 生态与开放平台（24 周，累计 81 周）

### 目标

AI 模块上线，支付模块和内网穿透模块可用，SDK 与 MCP Server 对外开放。

### 功能范围

#### 7.1 AI 模块

- AI Gateway（OpenAI / Claude / 本地模型）
- AI Agent 框架（工具调用 + 记忆 + RAG）
- 知识库（文档上传 + 向量化 + 语义搜索）

#### 7.2 支付模块

- 多支付渠道（微信 / 支付宝 / Stripe）
- 统一支付接口
- 对账系统

#### 7.3 内网穿透模块

- WebSocket 隧道
- 客户端管理
- 流量统计

#### 7.4 TypeScript SDK

- REST API 封装
- WebSocket 客户端
- 发布到 npm

#### 7.5 MCP Server

- Model Context Protocol
- 服务发现与动态工具注册

#### 7.6 插件市场

- 插件包管理
- 在线插件商店 UI

### 交付标准

- AI Gateway 同时接入 OpenAI 和 Claude
- 支付模块支持微信 + 支付宝
- SDK 发布到 npm
- MCP Server 可被 Claude Code / Cursor 发现和调用

---

## 8. 开发顺序与依赖关系

### 8.1 任务依赖链

```
v0.1 ──────────────────────────────────────── 基础架构
  │
  ├── 文档  ─── 根级配置 ─── 后端 ─── 前端 ─── 共享包
  ├── Docker 环境
  ├── ESLint / Prettier / Husky / Commitlint
  │
v0.5 ──────────────────────────────────────── 核心模块
  │
  ├── Auth ─── User ─── Role ─── Permission ─── Menu
  │                            └── 前端动态路由 + 按钮权限
  ├── 统一响应 / 错误处理 / Swagger
  │
v1.0 ──────────────────────────────────────── 企业级
  │
  ├── Logger ─── 请求日志 ─── 操作日志 ─── 审计日志
  ├── 文件存储 ─── 前端上传组件
  ├── 通知 ─── 邮件 ─── 站内信
  ├── 系统管理 ─── 配置 ─── 监控
  │
v1.5 ──────────────────────────────────────── 可扩展
  │
  ├── 插件系统 ─── CRUD Generator
  ├── BullMQ 队列 ─── 异步任务 ─── 数据导出
  ├── WebSocket ─── 实时推送
  │
v2.0 ──────────────────────────────────────── 平台化
  │
  ├── 多租户 ─── 租户管理 ─── 数据隔离
  ├── 工作流引擎 ─── 可视化设计器
  ├── 消息中心 ─── 多通道
  ├── 开放平台 ─── API 网关
  │
v3.0 ──────────────────────────────────────── 生态
  │
  ├── AI Gateway ─── Agent ─── 知识库
  ├── 支付模块
  ├── 内网穿透
  ├── SDK ─── MCP Server ─── 插件市场
```

### 8.2 可并行开发任务

| 版本 | 可并行任务                                                  |
| ---- | ----------------------------------------------------------- |
| v0.1 | 后端 core（filters/guards/interceptors）← 并行 → 前端脚手架 |
| v0.1 | Docker 环境 ← 并行 → 共享包初始化                           |
| v0.1 | CI/CD ← 并行 → Git Hooks 配置                               |
| v0.5 | Auth API ← 并行 → 前端登录页                                |
| v0.5 | User API ← 并行 → Role API ← 并行 → Permission API          |
| v1.0 | 日志系统 ← 并行 → 文件存储                                  |
| v1.5 | CRUD Generator ← 并行 → WebSocket ← 并行 → 数据导出         |
| v2.0 | 工作流 ← 并行 → 消息中心                                    |
| v3.0 | AI ← 并行 → 支付 ← 并行 → 内网穿透                          |

### 8.3 里程碑

| 里程碑 | 时间点   | 关键交付                                           | 决策问题                              |
| ------ | -------- | -------------------------------------------------- | ------------------------------------- |
| **M0** | 第 3 周  | 基础设施就绪：配置文件完整，后端可启动，前端可运行 | 基础架构是否满足需求？是否继续 v0.5？ |
| **M1** | 第 9 周  | Auth + User + Role + Permission + Menu 完整 CRUD   | 架构是否满足需求？是否进入 v1.0？     |
| **M2** | 第 21 周 | 日志 / 文件 / 通知 / 系统管理 完整                 | 是否进入插件化阶段？                  |
| **M3** | 第 37 周 | 插件系统 + Generator + WebSocket                   | 是否投入多租户？                      |
| **M4** | 第 57 周 | 多租户 + 工作流 + 开放平台                         | 是否启动 AI 模块？                    |
| **M5** | 第 81 周 | AI + 支付 + SDK + MCP                              | 社区运营模式？                        |

---

## 9. 版本发布规范

### 9.1 版本号规范

```
v{major}.{minor}.{patch}

major: 不兼容 API 变更
minor: 向下兼容的功能新增
patch: 向下兼容的问题修复
```

### 9.2 预发布标签

| 标签     | 说明                 |
| -------- | -------------------- |
| `alpha`  | 内部测试，功能不完整 |
| `beta`   | 公开测试，功能冻结   |
| `rc`     | 候选发布，只修 Bug   |
| `stable` | 正式发布             |

### 9.3 发布节奏

| 版本范围    | 发布类型   | 发布间隔    |
| ----------- | ---------- | ----------- |
| v0.1 - v0.9 | 内部预览版 | 每 2-4 周   |
| v1.0 - v1.9 | 稳定版     | 每 4-8 周   |
| v2.0 - v2.9 | LTS 候选版 | 每 8-12 周  |
| v3.0+       | LTS 版     | 每 12-16 周 |

### 9.4 当前项目结构

```
lin-framework/
├── apps/
│   ├── server/           # NestJS 后端（工作中）
│   ├── admin-web/        # Vue 3 管理后台（脚手架）
├── packages/
│   ├── shared/           # 共享类型/常量/枚举（空）
│   ├── types/            # 类型定义（空）
│   ├── utils/            # 工具函数（空）
│   └── eslint-config/    # 共享 ESLint 配置（空）
├── docker/               # Docker 配置（空目录，compose 在根级）
├── docs/                 # 项目文档
├── scripts/              # 构建脚本（空）
├── .github/workflows/    # CI/CD（空）

根级配置：.gitignore ✅ .editorconfig ✅ .gitattributes ✅
          tsconfig.base.json ◐ eslint.config.js ◐ .prettierrc ◐
          .npmrc ❌ commitlint.config.js ❌ .husky/ ❌
```
