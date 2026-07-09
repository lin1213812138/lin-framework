# ============================================================
# LIN Framework — Server Dockerfile
# 构建策略：pnpm monorepo + multi-stage
# ============================================================

# ── Development Stage ────────────────────────────────────────
FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制 .npmrc 确保 pnpm 配置可用
COPY .npmrc ./

# 安装依赖（利用 Docker 层缓存）
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
# --store-dir 强制容器内创建 store，避免 Windows 路径泄漏到 symlink
RUN pnpm install --frozen-lockfile --store-dir=/tmp/pnpm-store

# 复制源码
COPY . .

EXPOSE 6100

# 直接通过 pnpm store 路径运行 nest，绕过 Windows 路径 symlink 泄漏
CMD ["sh", "-c", "cd /app/apps/server && node /app/node_modules/.pnpm/@nestjs+cli@*/node_modules/@nestjs/cli/bin/nest.js start --watch"]

# ── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter server run build

# ── Production Stage ─────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN corepack enable && corepack prepare pnpm@latest --activate \
  && pnpm install --frozen-lockfile --prod

COPY --from=build /app/apps/server/dist ./apps/server/dist

USER node

EXPOSE 6100

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/server/dist/main.js"]