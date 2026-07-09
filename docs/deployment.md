# 生产环境部署指南

> 本文档基于 LIN Framework 当前实际配置编写，涵盖从零开始部署到 HTTPS 上线的完整流程。

---

## 1. 架构概览

```
用户 → 域名 (80/443)
        ↓
   Nginx (lin-nginx)
     ├── /api/* → server:6100 (NestJS)
     ├── /docs  → server:6100 (Swagger)
     └── /*     → web:80 (Nginx 托管前端静态文件)
                      ↓
              server:6100 (NestJS 后端)
                 ├── mongodb:20010
                 └── redis:20020
```

### 端口总览

| 服务    | 容器内端口 | 宿主机端口 | 说明     |
| ------- | ---------- | ---------- | -------- |
| MongoDB | 20010      | 20010      | 数据库   |
| Redis   | 20020      | 20020      | 缓存     |
| NestJS  | 6100       | 6100       | 后端 API |
| Nginx   | 80 / 443   | 80 / 443   | 反向代理 |

---

## 2. 前置条件

- 一台 Linux 服务器（Ubuntu 22.04+ / CentOS 7+）
- 已解析到服务器的域名（如 `admin.example.com`）
- 服务器开放端口：`80`、`443`

### 2.1 安装 Docker 和 Docker Compose

#### Ubuntu / Debian

```bash
# 卸载旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt update
sudo apt install -y ca-certificates curl

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 添加 Docker APT 源
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

# 安装 Docker 和 Docker Compose 插件
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 并设置为开机自启
sudo systemctl enable docker
sudo systemctl start docker

# 将当前用户加入 docker 组（免 sudo 执行 docker）
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

> 执行 `usermod` 后**需要重新登录**才能免 sudo 运行 docker。如果不想重新登录，用 `newgrp docker` 临时切换。

#### CentOS / RHEL / Rocky

```bash
# 卸载旧版本
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装 yum-utils
sudo yum install -y yum-utils

# 添加 Docker 源
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker 和 Docker Compose 插件
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 并设置为开机自启
sudo systemctl enable docker
sudo systemctl start docker

# 将当前用户加入 docker 组
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

#### 验证 Docker 可正常使用

```bash
# 确认 docker 命令可用
docker --version
# 输出示例：Docker version 27.x.x, build xxxxxxx

# 确认 docker compose 插件可用
docker compose version
# 输出示例：Docker Compose version v2.x.x

# 测试容器运行
docker run --rm hello-world
```

---

## 3. 部署步骤

### 3.1 拉取代码

```bash
git clone <your-repo-url> /opt/lin-framework
cd /opt/lin-framework
```

### 3.2 配置环境变量

```bash
cp .env .env.production
```

编辑 `.env.production`，**必须修改以下值**：

```bash
# ── MongoDB ──
# 生产环境务必修改密码
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=<生成随机密码>
MONGO_APP_USER=lin_app
MONGO_APP_PASSWORD=<生成随机密码>

# ── Redis ──
REDIS_PASSWORD=<生成随机密码>

# ── JWT（重中之重）──
# 使用 openssl rand -base64 32 生成
JWT_SECRET=<至少32位随机字符串>

# ── 日志 ──
LOG_LEVEL=warn
```

> 密码生成示例：`openssl rand -base64 24`

### 3.3 配置 Nginx 域名和 SSL

编辑 `docker/nginx/nginx.conf`：

**第一步** — 将 `server_name localhost` 改为你的域名

```nginx
server {
    listen 80;
    server_name admin.example.com;  # ← 改为你的域名
    # ...
}
```

**第二步** — 申请 SSL 证书

```bash
# 先启动 nginx（仅 HTTP），用于 Let's Encrypt 验证
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d nginx

# 安装 certbot 并申请证书
sudo apt install certbot -y
sudo certbot certonly --webroot \
  -w /usr/share/nginx/html \
  -d admin.example.com

# 证书路径：/etc/letsencrypt/live/admin.example.com/
```

**第三步** — 更新 Nginx 配置，启用 HTTPS

将 `docker/nginx/nginx.conf` 替换为以下完整配置（替换 `admin.example.com` 为你的域名）：

```nginx
events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;
  error_log  /var/log/nginx/error.log warn;

  sendfile        on;
  keepalive_timeout 65;
  client_max_body_size 50m;

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             text/xml application/xml application/xml+rss text/javascript;

  # 后端 API upstream
  upstream backend {
    server server:6100;
  }

  # 前端 upstream
  upstream frontend {
    server web:80;
  }

  # ── HTTP → HTTPS 重定向 ──
  server {
    listen 80;
    server_name admin.example.com;
    return 301 https://$host$request_uri;
  }

  # ── HTTPS ──
  server {
    listen 443 ssl http2;
    server_name admin.example.com;

    # SSL 证书（certbot 默认路径）
    ssl_certificate     /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 安全头
    add_header X-Frame-Options 'SAMEORIGIN' always;
    add_header X-Content-Type-Options 'nosniff' always;
    add_header X-XSS-Protection '1; mode=block' always;

    # Health check
    location /health {
      access_log off;
      return 200 'OK';
      add_header Content-Type text/plain;
    }

    # API
    location /api/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
      proxy_connect_timeout 60s;
      proxy_send_timeout 60s;
      proxy_read_timeout 60s;
    }

    # Swagger
    location /docs {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

    # 前端 SPA
    location / {
      proxy_pass http://frontend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_intercept_errors on;
      recursive_error_pages on;
      error_page 404 =200 /index.html;
    }
  }
}
```

> **注意**：Nginx 容器通过 volume 挂载 `nginx.conf`，修改后需要重启容器生效。SSL 证书需要让 Nginx 容器能读取到宿主机的 `/etc/letsencrypt` 目录。

**第四步** — 更新 `docker-compose.prod.yml`，让 Nginx 容器能访问宿主机证书

编辑 `docker/compose/docker-compose.prod.yml`，在 `nginx` 服务的 `volumes` 中添加证书挂载：

```yaml
nginx:
  image: nginx:alpine
  container_name: lin-nginx
  restart: unless-stopped
  ports:
    - '80:80'
    - '443:443'
  volumes:
    - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro # ← 添加这行
  depends_on:
    - server
    - web
```

### 3.4 启动服务

```bash
# 首次部署需要构建镜像
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d --build

# 后续更新只需重新构建变更的服务
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d --build server web
```

### 3.5 验证部署

```bash
# 查看所有容器状态
docker ps

# 检查后端日志
docker logs lin-server --tail 20

# 测试 API
curl https://admin.example.com/api/v1/users
# 应返回 JSON 响应（可能要求认证，但说明服务运行正常）

# 测试前端
curl -I https://admin.example.com/
# 应返回 200

# Swagger 文档
curl https://admin.example.com/docs
# 应返回 Swagger UI 页面
```

---

## 4. SSL 证书自动续签

Let's Encrypt 证书有效期 90 天，需要自动续签。

### 4.1 方案一：宿主机 cron

```bash
# 编辑 crontab
sudo crontab -e

# 添加以下行（每天凌晨检查续签）
0 3 * * * certbot renew --quiet && docker exec lin-nginx nginx -s reload
```

### 4.2 方案二：使用 acme.sh（推荐）

```bash
# 安装 acme.sh
curl https://get.acme.sh | sh

# 申请证书
~/.acme.sh/acme.sh --issue -d admin.example.com --webroot /usr/share/nginx/html

# 安装证书到 Nginx 挂载目录
~/.acme.sh/acme.sh --install-cert -d admin.example.com \
  --key-file /etc/letsencrypt/live/admin.example.com/privkey.pem \
  --fullchain-file /etc/letsencrypt/live/admin.example.com/fullchain.pem \
  --reloadcmd "docker exec lin-nginx nginx -s reload"
```

acme.sh 会自动创建 cron 任务，无需额外配置。

---

## 5. 日常运维

### 5.1 查看日志

```bash
# 后端
docker logs lin-server -f

# Nginx
docker logs lin-nginx -f

# 前端（生产环境是 Nginx，日志在 Nginx 中）
```

### 5.2 更新代码

```bash
cd /opt/lin-framework
git pull

# 重新构建并重启
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d --build
```

### 5.3 数据库备份

```bash
# 手动备份
docker exec lin-mongodb mongodump \
  --port 20010 \
  -u $MONGO_ROOT_USER -p $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db lin_framework \
  --gzip \
  --archive=/backup/lin_framework_$(date +%Y%m%d).gz

# 从容器复制到宿主机
docker cp lin-mongodb:/backup/lin_framework_$(date +%Y%m%d).gz /opt/backups/
```

### 5.4 停止/重启

```bash
# 停止所有服务（保留数据卷）
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml down

# 完全清理（会删除数据）
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml down -v
```

---

## 6. 回滚

```bash
# 回滚到上一个镜像版本
# 重新构建时利用了 Docker 缓存，如需指定版本：

# 1. 回滚 server
docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d server

# 2. 如需指定特定镜像，修改 docker-compose.prod.yml 中的 build 为 image
#    或使用 git revert 回退代码后重新构建
```

---

## 7. 部署检查清单

### 部署前

- [ ] `.env.production` 已配置，`JWT_SECRET` 已改为随机字符串
- [ ] MongoDB/Redis 密码已改为随机字符串
- [ ] Nginx `server_name` 已改为域名
- [ ] SSL 证书已申请并挂载
- [ ] 服务器 80/443 端口已开放
- [ ] DNS 已解析到服务器 IP

### 部署后

- [ ] `curl https://<域名>/health` 返回 `OK`
- [ ] `curl https://<域名>/api/v1/...` 正常响应
- [ ] `curl -I https://<域名>/` 返回 200
- [ ] 浏览器打开 HTTPS 地址无证书警告
- [ ] `docker logs lin-server` 无错误日志
