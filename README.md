# LIN Framework

现代企业级全栈开发框架 · 基于 TypeScript 全栈技术体系构建

LIN Framework 是一套可长期维护、不断扩展的企业级基础开发框架，适用于后台管理系统、SaaS 平台、AI 平台、CMS、内网穿透平台等场景，而非普通的后台模板。

## 项目特色

**AI 原生** — 代码结构和注释面向 AI 编程工具优化，与 Claude Code、Cursor、OpenCode 等 AI 工具深度协作，内置 AI 模块（v3.0）。

**企业级架构** — 严格四层架构（Controller → Service → Domain → Infrastructure），依赖倒置、模块隔离、禁止跨层调用，架构边界清晰。

**类型安全** — 全链路 TypeScript 类型覆盖，启用 strict / noUncheckedIndexedAccess / exactOptionalPropertyTypes 严格模式，禁止 any。

**现代化前端** — Vue3 Composition API + Naive UI + UnoCSS，Pinia 状态管理，动态路由，按钮级权限指令 v-permission。

**插件化设计** — 基于 NestJS Dynamic Module 的插件机制（v1.5），支持路由 / Schema / Service / Guard 扩展。

**Monorepo 管理** — pnpm Workspace 统一管理后端、前端、共享类型、SDK 四个子包。

## 技术栈

| 前端             | 后端                           | DevOps             |
| ---------------- | ------------------------------ | ------------------ |
| Vue3 ≥ 3.4       | NestJS ≥ 10                    | pnpm ≥ 9.0         |
| TypeScript ≥ 5.0 | TypeScript ≥ 5.0               | Docker + Compose   |
| Vite ≥ 5.0       | MongoDB ≥ 7.0 + Mongoose ≥ 8.0 | Nginx              |
| Pinia ≥ 2.0      | Redis ≥ 7.0                    | Husky + Commitlint |
| Vue Router ≥ 4.0 | JWT + Passport                 |                    |
| Naive UI ≥ 2.38  | Swagger ≥ 7.0                  |                    |
| UnoCSS ≥ 0.58    | BullMQ ≥ 4.0（v1.5+）          |                    |
| Axios ≥ 1.6      | Socket.IO ≥ 4.0（v1.5+）       |                    |

## 目录结构

```
lin-framework/
├── packages/
│   ├── server/             # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts     # 应用入口
│   │   │   ├── app.module.ts
│   │   │   ├── config/     # 配置模块（ConfigService）
│   │   │   ├── common/     # 全局基础设施（filters/guards/interceptors/pipes）
│   │   │   ├── modules/    # 业务模块（auth/user/role/permission/menu...）
│   │   │   ├── shared/     # 共享服务（database/redis/queue/logger/cache）
│   │   │   ├── plugins/    # 插件系统（v1.5）
│   │   │   └── seeds/      # 种子数据
│   │   └── test/           # 单元/集成/E2E 测试
│   ├── web/                # Vue3 前端
│   │   ├── src/
│   │   │   ├── api/        # API 请求层
│   │   │   ├── components/ # 公共组件（common/ + business/）
│   │   │   ├── composables/# 组合函数
│   │   │   ├── layouts/    # 布局组件
│   │   │   ├── router/     # 路由 + 守卫
│   │   │   ├── stores/     # Pinia Store
│   │   │   ├── directives/ # v-permission
│   │   │   └── views/      # 页面
│   │   └── ...
│   ├── shared/             # 前后端共享类型/常量/枚举
│   └── sdk/                # 对外 SDK（v3.0）
├── docker/                 # Docker 编排 + Nginx + MongoDB init
├── docs/                   # 项目文档
├── scripts/                # 构建部署脚本
├── AGENTS.md               # AI 编程规范
├── ARCHITECTURE.md         # 架构设计文档
├── DATABASE.md             # 数据库设计文档
├── ROADMAP.md              # 开发路线图
└── README.md               # 本文件
```

## 快速启动

### 环境要求

- Node.js ≥ 20 LTS
- pnpm ≥ 9.0
- Docker & Docker Compose（推荐）
- MongoDB ≥ 7.0
- Redis ≥ 7.0

### 启动步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-org/lin-framework.git
cd lin-framework

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env

# 4. 启动基础设施（Docker）
docker compose up -d mongo redis

# 5. 启动开发服务器
pnpm dev

# 6. 初始化种子数据
pnpm seed
```

### 访问地址

| 服务                | 地址                                |
| ------------------- | ----------------------------------- |
| 前端页面            | http://localhost:5173               |
| API 文档（Swagger） | http://localhost:3000/api/v1/docs   |
| Health Check        | http://localhost:3000/api/v1/health |

### 可用脚本

```bash
pnpm dev          # 同时启动前后端
pnpm build        # 构建所有包
pnpm test         # 运行所有测试
pnpm lint         # ESLint 检查
pnpm format       # Prettier 格式化
pnpm seed         # 初始化种子数据
```

## 开发规范

本项目遵循严格的企业级开发规范，详见：

| 文档                                 | 说明                                          |
| ------------------------------------ | --------------------------------------------- |
| [AGENTS.md](./AGENTS.md)             | AI 编程规范、编码规范、NestJS/Vue3/数据库规范 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 四层架构设计、模块组织、请求流程              |
| [DATABASE.md](./DATABASE.md)         | 数据库 Schema 设计、索引策略                  |
| [ROADMAP.md](./ROADMAP.md)           | 版本规划与开发路线图                          |

### 核心规范

**编码** — 2 空格缩进，必须分号，单引号优先，所有函数 TSDoc 注释。禁止 any、console.log、throw Error、魔法字符串。

**分层** — Controller 只处理请求和响应，Service 负责业务逻辑，Repository 负责数据库操作。禁止跨层调用，禁止 Service 直接操作 Model。

**配置** — 所有配置必须来自 ConfigService，禁止 process.env 直接访问，禁止硬编码。

**Commit** — 遵循 Conventional Commits：`feat(auth): implement OAuth2 login`。

## Roadmap

| 版本 | 阶段       | 时间  | 核心交付                                       |
| ---- | ---------- | ----- | ---------------------------------------------- |
| v0.1 | 架构验证   | 2 周  | Monorepo 脚手架 + Docker + CI/CD               |
| v0.5 | 核心可用   | 8 周  | Auth + RBAC + 前后端 CRUD 页面                 |
| v1.0 | 企业级可用 | 20 周 | 日志 + 文件 + 通知 + 系统监控                  |
| v1.5 | 插件化     | 36 周 | 插件系统 + CRUD Generator + BullMQ + WebSocket |
| v2.0 | 平台化     | 56 周 | 多租户 + 工作流引擎 + 开放平台                 |
| v3.0 | 生态       | 80 周 | AI 模块 + 支付 + 内网穿透 + SDK + MCP          |

详细版本规划请参阅 [ROADMAP.md](./ROADMAP.md)。

## 未来规划

**插件系统** — 基于 NestJS Dynamic Module，支持路由/Schema/Service/Guard 动态扩展。

**CRUD Generator** — CLI 工具从 Schema 定义一键生成完整 CRUD 模块（后端 API + 前端页面）。

**多租户** — 数据库级隔离，中间件自动解析租户上下文，租户级别配置/权限/主题。

**AI 模块** — AI Gateway（OpenAI/Claude/本地模型），Agent 框架（工具调用 + RAG），知识库。

**工作流引擎** — 基于 BullMQ 的工作流编排，可视化流程设计器，审批流/任务流/自动化流。

**消息中心** — 站内信/邮件/短信/推送多通道，WebSocket 实时推送，模板管理。

**内网穿透** — 基于 WebSocket 的隧道实现，HTTP/TCP/UDP 代理，客户端 SDK。

**开放平台** — API 网关，应用管理，密钥管理，接口文档自动生成，调用统计。

**SDK 与 MCP** — TypeScript SDK 发布到 npm，MCP Server 允许 AI 工具直接操作框架资源。

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交变更：`git commit -m 'feat(scope): add some feature'`
4. 推送到分支：`git push origin feat/your-feature`
5. 提交 Pull Request

**开发须知**：所有代码必须通过 ESLint 检查，所有新功能必须包含单元测试，遵循 Conventional Commits 规范。

## License

MIT © LIN Framework Team
