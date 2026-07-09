# ============================================================
# LIN Framework — Admin Web Dockerfile
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
COPY apps/admin-web/package.json ./apps/admin-web/
COPY packages/shared/package.json ./packages/shared/
# --store-dir 强制容器内创建 store，避免 Windows 路径泄漏到 symlink
RUN pnpm install --frozen-lockfile --store-dir=/tmp/pnpm-store

# 复制源码
COPY . .

EXPOSE 80

# 直接通过 pnpm store 路径运行 vite，绕过 Windows 路径 symlink 泄漏
CMD ["sh", "-c", "cd /app/apps/admin-web && node /app/node_modules/.pnpm/vite@*/node_modules/vite/bin/vite.js"]

# ── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin-web/package.json ./apps/admin-web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter admin-web run build

# ── Production Stage ─────────────────────────────────────────
FROM nginx:alpine AS production

COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]