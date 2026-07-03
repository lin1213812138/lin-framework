# Deployment

> **设计依据**: AGENTS.md §13 项目目录规范（docker/, scripts/, .github/workflows/）、ARCHITECTURE.md 基础设施层
>
> 本文档定义 LIN Framework 的部署架构、环境配置、CI/CD 流程及运维规范。

---

## 1. 部署架构

```
                        ┌─────────────┐
                        │   Nginx     │  ← 反向代理 / SSL 终结
                        │  (HTTPS)    │
                        └──────┬──────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
          ┌───────┴───────┐         ┌───────┴───────┐
          │  NestJS App   │         │  NestJS App   │  ← 水平扩展，无状态
          │  (Server)     │         │  (Server)     │
          └───────┬───────┘         └───────┬───────┘
                  │                         │
                  └────────────┬────────────┘
                               │
                    ┌──────────┴──────────┐
                    │      Redis          │  ← Session / Cache / Queue
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │     MongoDB         │  ← 主数据库
                    │   (Replica Set)     │
                    └─────────────────────┘

          ┌─────────────────────────────────┐
          │         Vue3 App (SPA)          │  ← Nginx 托管静态文件
          │    ┌───────────────────────┐    │
          │    │  CDN / Object Storage │    │  ← 静态资源
          │    └───────────────────────┘    │
          └─────────────────────────────────┘
```

### 1.1 组件说明

| 组件     | 技术栈         | 部署方式            | 水平扩展          |
| -------- | -------------- | ------------------- | ----------------- |
| 后端 API | NestJS         | Docker 容器 / PM2   | ✅ 无状态，多实例 |
| 前端 SPA | Vue3 + Vite    | Nginx / CDN         | ✅ 静态文件       |
| 数据库   | MongoDB        | Replica Set / Atlas | ✅ 分片           |
| 缓存     | Redis          | Sentinel / Cluster  | ✅ 集群           |
| 反向代理 | Nginx          | Docker 容器         | ✅ 负载均衡       |
| CI/CD    | GitHub Actions | —                   | —                 |

### 1.2 网络拓扑

```
生产环境:
  Internet → Nginx (443) → NestJS (3000) → MongoDB (27017)
                                        → Redis (6379)

开发环境:
  localhost → NestJS (3000) → MongoDB (27017)
                            → Redis (6379)
```

---

## 2. 环境管理

### 2.1 环境划分

| 环境         | 用途     | 域名                        | 数据库       | 日志级别 |
| ------------ | -------- | --------------------------- | ------------ | -------- |
| `local`      | 本地开发 | `localhost`                 | 本地         | DEBUG    |
| `dev`        | 开发联调 | `dev.lin-framework.com`     | 共享 Dev     | DEBUG    |
| `staging`    | 预发布   | `staging.lin-framework.com` | 隔离 Staging | INFO     |
| `production` | 生产     | `lin-framework.com`         | 生产集群     | WARN     |

### 2.2 环境变量

```bash
# .env.example
# ── 应用 ──
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# ── MongoDB ──
MONGODB_URI=mongodb://localhost:27017/lin-framework
MONGODB_USER=lin
MONGODB_PASSWORD=

# ── Redis ──
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ── JWT ──
JWT_SECRET=your-jwt-secret
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d

# ── 文件存储 ──
STORAGE_DRIVER=local          # local | s3 | oss
STORAGE_PATH=./uploads
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# ── 日志 ──
LOG_LEVEL=debug
LOG_OUTPUT=console            # console | file | elasticsearch

# ── 验证码 ──
CAPTCHA_EXPIRES=300           # 5 minutes

# ── Rate Limit ──
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 2.3 环境校验

```typescript
// config/config.schema.ts
// 使用 Joi 或 Zod 校验所有环境变量
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(32),
  STORAGE_DRIVER: Joi.string().valid('local', 's3', 'oss').default('local'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
});
```

---

## 3. Docker 部署

### 3.1 Docker Compose（开发环境）

```yaml
# docker/docker-compose.dev.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db
      - ./mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  server:
    build:
      context: ../packages/server
      dockerfile: Dockerfile
      target: dev
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ../packages/server/src:/app/src:ro
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@mongodb:27017/lin-framework
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
      - redis

  web:
    build:
      context: ../packages/web
      dockerfile: Dockerfile
      target: dev
    restart: unless-stopped
    ports:
      - '5173:5173'
    volumes:
      - ../packages/web/src:/app/src:ro
    depends_on:
      - server

volumes:
  mongodb_data:
  redis_data:
```

### 3.2 Docker Compose（生产环境）

```yaml
# docker/docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal

  server:
    build:
      context: ../packages/server
      dockerfile: Dockerfile
      target: prod
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      LOG_LEVEL: warn
    depends_on:
      - mongodb
      - redis
    networks:
      - internal
      - web

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - web_dist:/usr/share/nginx/html:ro
    depends_on:
      - server
    networks:
      - web

  web:
    build:
      context: ../packages/web
      dockerfile: Dockerfile
      target: prod
    volumes:
      - web_dist:/app/dist

volumes:
  mongodb_data:
  redis_data:
  web_dist:

networks:
  internal:
  web:
```

### 3.3 Dockerfile

```dockerfile
# packages/server/Dockerfile

# ── Dev Stage ──
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# ── Build Stage ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Prod Stage ──
FROM node:20-alpine AS prod

WORKDIR /app

RUN apk add --no-cache tini

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
```

```dockerfile
# packages/web/Dockerfile

# ── Dev Stage ──
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
EXPOSE 5173
CMD ["pnpm", "run", "dev"]

# ── Build Stage ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Prod Stage ──
FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Nginx 配置

```nginx
# docker/nginx/nginx.conf

upstream server_cluster {
    least_conn;
    server server:3000 max_fails=3 fail_timeout=30s;
    # 多实例：server server2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name lin-framework.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lin-framework.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # ── 前端 SPA ──
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control 'no-store, no-cache';
    }

    # ── 静态资源缓存 ──
    location /assets/ {
        expires 1y;
        add_header Cache-Control 'public, immutable';
    }

    # ── API 反向代理 ──
    location /api/ {
        proxy_pass http://server_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        # 限制 Body 大小为 10MB
        client_max_body_size 10m;
    }

    # ── Rate Limit ──
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    location /api/ {
        limit_req zone=api burst=200 nodelay;
        # ...
    }

    # ── 安全头 ──
    add_header X-Frame-Options 'SAMEORIGIN' always;
    add_header X-Content-Type-Options 'nosniff' always;
    add_header X-XSS-Protection '1; mode=block' always;
    add_header Referrer-Policy 'strict-origin-when-cross-origin' always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;" always;

    # ── 日志 ──
    access_log /var/log/nginx/access.log json;
    error_log  /var/log/nginx/error.log warn;

    # ── 健康检查 ──
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## 5. CI/CD

### 5.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    services:
      mongodb:
        image: mongo:7
        ports:
          - '27017:27017'
      redis:
        image: redis:7-alpine
        ports:
          - '6379:6379'

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:cov
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: |
            packages/server/dist
            packages/web/dist
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [build]

    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ vars.DOCKER_USER }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build & Push Server Image
        uses: docker/build-push-action@v5
        with:
          context: packages/server
          push: true
          tags: |
            ${{ vars.DOCKER_USER }}/lin-server:latest
            ${{ vars.DOCKER_USER }}/lin-server:${{ github.sha }}

      - name: Build & Push Web Image
        uses: docker/build-push-action@v5
        with:
          context: packages/web
          push: true
          tags: |
            ${{ vars.DOCKER_USER }}/lin-web:latest
            ${{ vars.DOCKER_USER }}/lin-web:${{ github.sha }}

      - name: Deploy to Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/lin-framework
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
```

### 5.2 部署流程

```
Commit → CI (Lint → TypeCheck → Test → Build)
  ↓
Docker Image Push (Server + Web)
  ↓
SSH → Pull Images → docker compose up -d
  ↓
Health Check → 完成
```

---

## 6. 数据库运维

### 6.1 备份

```bash
# scripts/backup.sh
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="lin-framework_${TIMESTAMP}.gz"

mongodump \
  --uri="${MONGODB_URI}" \
  --gzip \
  --archive="${BACKUP_DIR}/${FILENAME}"

# 保留最近 30 天备份
find "${BACKUP_DIR}" -name "*.gz" -mtime +30 -delete

# 上传到 S3（可选）
# aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://lin-backups/mongodb/${FILENAME}"
```

### 6.2 恢复

```bash
mongorestore \
  --uri="${MONGODB_URI}" \
  --gzip \
  --archive="${BACKUP_DIR}/lin-framework_20260101_000000.gz"
```

### 6.3 索引管理

- 所有查询字段必须建立索引
- 联合索引：等值条件在前，排序在后
- 定期审查慢查询日志（`db.currentOp()` / `db.setProfilingLevel(1)`）
- TTL 索引用于自动过期（验证码、临时 Token）

---

## 7. 日志管理

### 7.1 日志聚合

```
NestJS Logger → stdout (JSON format)
  ↓
容器 stdout/stderr
  ↓
Docker Log Driver → Loki / CloudWatch
  ↓
Grafana 面板
```

### 7.2 日志格式

```json
{
  "level": "info",
  "message": "user login success",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "context": "AuthService",
  "requestId": "req_a1b2c3d4",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "duration": 42
}
```

### 7.3 日志级别

| 环境        | 级别  |
| ----------- | ----- |
| local / dev | DEBUG |
| staging     | INFO  |
| production  | WARN  |

---

## 8. 监控告警

### 8.1 健康检查端点

| 端点                | 说明                        |
| ------------------- | --------------------------- |
| `GET /health`       | 基础存活检查                |
| `GET /health/ready` | 就绪检查（数据库/缓存连接） |
| `GET /health/live`  | 存活检查                    |

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly dbHealth: DatabaseHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get('ready')
  async check() {
    const db = await this.dbHealth.isHealthy();
    const redis = await this.redisHealth.isHealthy();
    return { status: db && redis ? 'ok' : 'degraded', db, redis };
  }
}
```

### 8.2 核心监控指标

| 指标           | 采集方式                        | 告警阈值 |
| -------------- | ------------------------------- | -------- |
| API 响应时间   | Prometheus Histogram            | P99 > 1s |
| 请求错误率     | Prometheus Counter              | > 5%     |
| MongoDB 连接数 | `db.serverStatus().connections` | > 80%    |
| Redis 内存     | `INFO memory`                   | > 80%    |
| CPU 使用率     | Docker / OS                     | > 85%    |
| 内存使用率     | Docker / OS                     | > 85%    |

### 8.3 Prometheus 指标暴露

```typescript
// prometheus.module.ts 或使用 @willsoto/nestjs-prometheus
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
})
export class MonitorModule {}
```

---

## 9. 安全配置

### 9.1 网络安全

- 数据库仅监听内网（`bindIp: 127.0.0.1` 或 Docker internal network）
- Redis 设置 `requirepass`
- Nginx 仅暴露 80/443 端口
- 所有 API 经过 Nginx 反向代理

### 9.2 密钥管理

```bash
# 禁止将密钥提交到 Git
# 生产环境密钥通过 CI/CD Secrets 注入
# 或使用 Vault / AWS Secrets Manager

# .gitignore
.env
.env.local
*.key
ssl/
```

### 9.3 HTTPS

```bash
# 使用 Let's Encrypt 自动续签
# docker/nginx/ssl/ 目录挂载证书

certbot certonly --webroot \
  -w /usr/share/nginx/html \
  -d lin-framework.com
```

### 9.4 Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 100 }, // 全局：每分钟 100 次
      ],
    }),
  ],
})
export class AppModule {}

// 更细粒度的限制在 Nginx 层控制
```

---

## 10. 部署检查清单

### 10.1 预部署

- [ ] 所有环境变量已配置
- [ ] `.env.example` 与实际环境变量一致
- [ ] 数据库备份完成
- [ ] 数据库迁移/Rollback 已验证
- [ ] 索引已创建
- [ ] CI 全部通过（Lint / TypeCheck / Test / Build）

### 10.2 部署中

- [ ] 滚动更新（先启动新实例，再停止旧实例）
- [ ] 健康检查通过后再切流量
- [ ] 数据库迁移向前兼容
- [ ] 缓存预热（可选）

### 10.3 部署后

- [ ] API 冒烟测试通过
- [ ] 关键业务流程验证（登录、注册、列表查询）
- [ ] 监控告警正常
- [ ] 日志正常采集
- [ ] 回滚方案就绪

### 10.4 回滚

```bash
# 回滚到上一个版本
docker compose stop server
docker compose up -d server  # docker-compose.yml 指定上个版本 tag

# 数据库回滚（如有）
# npx nestjs-command rollup:revert
```
