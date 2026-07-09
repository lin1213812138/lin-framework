#!/usr/bin/env bash
# ============================================================
# LIN Framework — 生产环境一键部署脚本
# 用法：
#   bash scripts/deploy.sh                        # 交互式部署
#   bash scripts/deploy.sh -d example.com         # 指定域名
#   bash scripts/deploy.sh -d example.com -y      # 全自动（不暂停确认）
# ============================================================
set -euo pipefail

# ── 颜色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── 参数解析 ──
DOMAIN=""
AUTO_YES=false

while getopts "d:y" opt; do
  case $opt in
    d) DOMAIN="$OPTARG" ;;
    y) AUTO_YES=true ;;
    *) echo "Usage: $0 [-d domain] [-y]"; exit 1 ;;
  esac
done

# ── 检查 root ──
if [ "$EUID" -ne 0 ]; then
  log_err "请以 root 用户运行（sudo bash scripts/deploy.sh）"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=============================================="
echo "   LIN Framework 生产环境部署"
echo "=============================================="

# ──────────────────────────────────────────────
# 1. 安装 Docker + Docker Compose
# ──────────────────────────────────────────────
install_docker() {
  log_info "检查 Docker 安装状态..."

  if command -v docker &>/dev/null; then
    log_ok "Docker 已安装 ($(docker --version))"
  else
    log_info "正在安装 Docker..."
    if [ -f /etc/debian_version ]; then
      # Ubuntu / Debian
      apt update
      apt install -y ca-certificates curl
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
      chmod a+r /etc/apt/keyrings/docker.asc
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      apt update
      apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [ -f /etc/redhat-release ]; then
      # CentOS / RHEL / Rocky
      yum install -y yum-utils
      yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
      log_err "不支持的 Linux 发行版，请手动安装 Docker"
      log_info "参考: https://docs.docker.com/engine/install/"
      exit 1
    fi
    systemctl enable docker
    systemctl start docker
    log_ok "Docker 安装完成"
  fi

  # 验证 docker compose
  if docker compose version &>/dev/null; then
    log_ok "Docker Compose 已安装 ($(docker compose version))"
  else
    log_err "Docker Compose 插件未安装"
    exit 1
  fi
}

# ──────────────────────────────────────────────
# 2. 生成安全密码
# ──────────────────────────────────────────────
random_password() {
  openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 24
}

random_jwt_secret() {
  openssl rand -base64 32
}

setup_env() {
  local env_file="$PROJECT_DIR/.env.production"

  if [ -f "$env_file" ]; then
    log_info ".env.production 已存在，跳过生成"
    log_warn "如需重新生成，请删除 $env_file 后重试"
    return
  fi

  log_info "正在生成 .env.production..."

  local MONGO_ROOT_PASS=$(random_password)
  local MONGO_APP_PASS=$(random_password)
  local REDIS_PASS=$(random_password)
  local JWT_SECRET=$(random_jwt_secret)

  cat > "$env_file" << EOF
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASS}
MONGO_APP_USER=lin_app
MONGO_APP_PASSWORD=${MONGO_APP_PASS}

# Redis
REDIS_PASSWORD=${REDIS_PASS}

# JWT
JWT_SECRET=${JWT_SECRET}

# Log
LOG_LEVEL=warn
EOF

  chmod 600 "$env_file"
  log_ok ".env.production 已生成"

  # 复制到 .env（docker compose 默认读取 .env）
  cp "$env_file" "$PROJECT_DIR/.env"
  log_ok ".env 已同步"

  # 打印凭据（仅首次）
  echo ""
  echo "  ┌──────────────────────────────────────────────┐"
  echo "  │        🔑 请妥善保存以下凭据                 │"
  echo "  ├──────────────────────────────────────────────┤"
  printf "  │  MONGO_ROOT_PASSWORD = %-24s │\n" "$MONGO_ROOT_PASS"
  printf "  │  MONGO_APP_PASSWORD  = %-24s │\n" "$MONGO_APP_PASS"
  printf "  │  REDIS_PASSWORD      = %-24s │\n" "$REDIS_PASS"
  printf "  │  JWT_SECRET          = %-24s │\n" "$JWT_SECRET"
  echo "  └──────────────────────────────────────────────┘"
  echo ""
}

# ──────────────────────────────────────────────
# 3. 配置域名
# ──────────────────────────────────────────────
setup_domain() {
  if [ -z "$DOMAIN" ]; then
    if [ "$AUTO_YES" = true ]; then
      DOMAIN="localhost"
      log_warn "未指定域名，使用 localhost（后续可手动修改）"
    else
      read -rp "请输入域名（如 admin.example.com）: " DOMAIN
      if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
        log_warn "未输入域名，使用 localhost"
      fi
    fi
  fi
  log_ok "域名: $DOMAIN"
}

# ──────────────────────────────────────────────
# 4. 配置 Nginx
# ──────────────────────────────────────────────
setup_nginx() {
  local nginx_conf="$PROJECT_DIR/docker/nginx/nginx.conf"

  log_info "正在配置 Nginx..."

  # 备份原配置
  if [ -f "$nginx_conf" ] && ! grep -q "server_name $DOMAIN;" "$nginx_conf" 2>/dev/null; then
    cp "$nginx_conf" "${nginx_conf}.bak.$(date +%Y%m%d%H%M%S)"
    log_info "原配置已备份"
  fi

  # 是否已包含 SSL 配置（通过检查证书路径判断）
  if grep -q "/etc/letsencrypt/live" "$nginx_conf" 2>/dev/null; then
    log_info "Nginx 已配置 SSL，跳过"
    return
  fi

  if [ "$DOMAIN" == "localhost" ]; then
    # 无域名 → 纯 HTTP
    log_info "使用 HTTP 配置"
    cat > "$nginx_conf" << 'NGINX_HTTP'
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

  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             text/xml application/xml application/xml+rss text/javascript;

  upstream backend {
    server server:6100;
  }

  upstream frontend {
    server web:80;
  }

  server {
    listen 80;
    server_name NGINX_DOMAIN_PLACEHOLDER;

    location /health {
      access_log off;
      return 200 'OK';
      add_header Content-Type text/plain;
    }

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

    location /docs {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

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
NGINX_HTTP
    sed -i "s/NGINX_DOMAIN_PLACEHOLDER/$DOMAIN/" "$nginx_conf"
  else
    # 有域名 → HTTPS
    log_info "使用 HTTPS 配置（先启动 HTTP 用于 Let's Encrypt 验证）"

    # 先写 HTTP 版用于证书申请
    cat > "$nginx_conf" << 'NGINX_HTTP'
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

  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             text/xml application/xml application/xml+rss text/javascript;

  upstream backend {
    server server:6100;
  }

  upstream frontend {
    server web:80;
  }

  server {
    listen 80;
    server_name NGINX_DOMAIN_PLACEHOLDER;

    location /health {
      access_log off;
      return 200 'OK';
      add_header Content-Type text/plain;
    }

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

    location /docs {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

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
NGINX_HTTP
    sed -i "s/NGINX_DOMAIN_PLACEHOLDER/$DOMAIN/" "$nginx_conf"
  fi

  log_ok "Nginx 配置完成"
}

# ──────────────────────────────────────────────
# 5. 申请 SSL 证书
# ──────────────────────────────────────────────
setup_ssl() {
  if [ "$DOMAIN" == "localhost" ]; then
    return
  fi

  # 检查是否已有证书
  local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
  if [ -f "$cert_path" ]; then
    log_ok "SSL 证书已存在: $cert_path"
    return
  fi

  log_info "正在申请 Let's Encrypt SSL 证书..."

  # 确保 nginx 正在运行（HTTP 模式）
  docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d nginx 2>/dev/null || true

  # 检查 DNS 解析
  local resolved_ip
  resolved_ip=$(dig +short "$DOMAIN" 2>/dev/null || host "$DOMAIN" 2>/dev/null | awk '{print $NF}' || echo "")
  local server_ip
  server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s ip.sb 2>/dev/null || echo "")

  if [ -n "$resolved_ip" ] && [ -n "$server_ip" ] && [ "$resolved_ip" != "$server_ip" ]; then
    log_warn "域名 $DOMAIN 解析到 $resolved_ip，但本机 IP 是 $server_ip"
    log_warn "请确保域名已解析到此服务器，否则证书申请会失败"
    if [ "$AUTO_YES" = false ]; then
      read -rp "按 Enter 继续申请证书，或 Ctrl+C 取消..."
    fi
  fi

  # 安装 certbot 并申请证书
  if ! command -v certbot &>/dev/null; then
    apt install -y certbot 2>/dev/null || yum install -y certbot 2>/dev/null || true
  fi

  if command -v certbot &>/dev/null; then
    certbot certonly --webroot \
      -w /usr/share/nginx/html \
      -d "$DOMAIN" \
      --non-interactive \
      --agree-tos \
      --email "admin@$DOMAIN" \
      2>/dev/null || {
      log_warn "自动申请证书失败"
      log_info "你可以稍后手动运行: certbot certonly --webroot -w /usr/share/nginx/html -d $DOMAIN"
      log_info "或使用 acme.sh: curl https://get.acme.sh | sh && ~/.acme.sh/acme.sh --issue -d $DOMAIN --webroot /usr/share/nginx/html"
    }
  else
    log_warn "certbot 未安装，跳过 SSL 证书申请"
    log_info "请稍后手动配置 SSL"
  fi

  # 如果证书已存在，升级 Nginx 配置为 HTTPS
  if [ -f "$cert_path" ]; then
    log_ok "SSL 证书已获取，升级 Nginx 配置为 HTTPS..."
    setup_nginx_https
  fi
}

# ──────────────────────────────────────────────
# 5b. 写入 HTTPS Nginx 配置
# ──────────────────────────────────────────────
setup_nginx_https() {
  local nginx_conf="$PROJECT_DIR/docker/nginx/nginx.conf"

  cat > "$nginx_conf" << 'NGINX_HTTPS'
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

  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             text/xml application/xml application/xml+rss text/javascript;

  upstream backend {
    server server:6100;
  }

  upstream frontend {
    server web:80;
  }

  # HTTP → HTTPS 重定向
  server {
    listen 80;
    server_name NGINX_DOMAIN_PLACEHOLDER;
    return 301 https://$host$request_uri;
  }

  # HTTPS
  server {
    listen 443 ssl http2;
    server_name NGINX_DOMAIN_PLACEHOLDER;

    ssl_certificate     /etc/letsencrypt/live/NGINX_DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/NGINX_DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header X-Frame-Options 'SAMEORIGIN' always;
    add_header X-Content-Type-Options 'nosniff' always;
    add_header X-XSS-Protection '1; mode=block' always;

    location /health {
      access_log off;
      return 200 'OK';
      add_header Content-Type text/plain;
    }

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

    location /docs {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

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
NGINX_HTTPS

  sed -i "s/NGINX_DOMAIN_PLACEHOLDER/$DOMAIN/g" "$nginx_conf"
  log_ok "HTTPS Nginx 配置已写入"
}

# ──────────────────────────────────────────────
# 6. 确保 Nginx 容器能访问证书
# ──────────────────────────────────────────────
patch_compose_volumes() {
  local compose_file="$PROJECT_DIR/docker/compose/docker-compose.prod.yml"

  if grep -q "/etc/letsencrypt" "$compose_file" 2>/dev/null; then
    return # 已添加
  fi

  if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    return # 没有证书，不需要挂载
  fi

  log_info "正在更新 docker-compose.prod.yml 添加证书挂载..."

  # 在 nginx volumes 中插入证书挂载
  sed -i '/volumes:/,/depends_on:/{
    /- ..\/nginx\/nginx.conf/a\      - /etc/letsencrypt:/etc/letsencrypt:ro
  }' "$compose_file"

  log_ok "证书挂载已添加"
}

# ──────────────────────────────────────────────
# 7. 构建并启动服务
# ──────────────────────────────────────────────
start_services() {
  log_info "正在构建并启动服务..."
  echo ""

  docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d --build

  log_ok "服务已启动"
  echo ""
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo ""
}

# ──────────────────────────────────────────────
# 8. 初始化超级管理员
# ──────────────────────────────────────────────
seed_admin() {
  log_info "正在初始化超级管理员..."

  # 等待 server 容器就绪
  log_info "等待 server 容器就绪..."
  local retries=0
  local max_retries=30
  until docker logs lin-server 2>&1 | grep -q "Nest application successfully started"; do
    retries=$((retries + 1))
    if [ $retries -ge $max_retries ]; then
      log_warn "server 容器未在预期时间内就绪，跳过管理员初始化"
      log_info "你可以稍后手动运行: docker exec lin-server node /tmp/init-admin.cjs"
      return
    fi
    sleep 2
  done
  log_ok "server 容器已就绪"

  # 复制并运行初始化脚本
  local seed_script="$PROJECT_DIR/scripts/init-admin.cjs"
  if [ ! -f "$seed_script" ]; then
    log_err "初始化脚本不存在: $seed_script"
    return
  fi

  docker cp "$seed_script" lin-server:/tmp/init-admin.cjs
  docker exec lin-server node /tmp/init-admin.cjs

  log_ok "管理员初始化完成"
}

# ──────────────────────────────────────────────
# 9. 验证部署
# ──────────────────────────────────────────────
verify_deployment() {
  log_info "正在验证部署..."

  # 等待服务就绪
  sleep 5

  local base_url
  if [ "$DOMAIN" == "localhost" ]; then
    base_url="http://localhost"
  else
    base_url="https://$DOMAIN"
  fi

  local failed=0

  # 检查容器状态
  local running
  running=$(docker ps --filter "name=lin-" --filter "status=running" --format "{{.Names}}" | wc -l)
  if [ "$running" -ge 4 ]; then
    log_ok "容器运行中 ($running/5)"
  else
    log_warn "只有 $running/5 个容器在运行"
    docker ps --filter "name=lin-" --format "table {{.Names}}\t{{.Status}}"
  fi

  # Health check
  if curl -sf "$base_url/health" > /dev/null 2>&1; then
    log_ok "Health check 通过 ($base_url/health)"
  else
    log_warn "Health check 失败"
    failed=1
  fi

  # API
  if curl -sf "$base_url/api/v1" > /dev/null 2>&1 || curl -sf "$base_url/api/" > /dev/null 2>&1; then
    log_ok "API 可访问"
  else
    log_warn "API 返回异常（可能是需要认证，但不影响部署）"
  fi

  # 检查后端日志
  if docker logs lin-server --tail 5 2>&1 | grep -q "Nest application successfully started"; then
    log_ok "NestJS 启动成功"
  else
    log_warn "NestJS 日志中未找到启动成功标记，请检查: docker logs lin-server"
  fi

  echo ""
  if [ $failed -eq 0 ]; then
    log_ok "✅ 部署验证通过"
  else
    log_warn "⚠️  部署验证有警告，请检查上述输出"
  fi
}

# ──────────────────────────────────────────────
# 主流程
# ──────────────────────────────────────────────
main() {
  echo ""
  install_docker
  echo ""

  setup_env
  echo ""

  setup_domain
  echo ""

  setup_nginx
  echo ""

  # 显示配置概览并确认
  echo "  ┌──────────────────────────────────────────────┐"
  printf "  │  域名: %-41s │\n" "${DOMAIN}"
  printf "  │  项目目录: %-35s │\n" "${PROJECT_DIR}"
  echo "  │  SSL: $([ "$DOMAIN" != "localhost" ] && echo "是 (Let's Encrypt)          │" || echo "否 (HTTP)                    │")"
  echo "  └──────────────────────────────────────────────┘"
  echo ""

  if [ "$AUTO_YES" = false ]; then
    read -rp "按 Enter 开始部署，或 Ctrl+C 取消..."
    echo ""
  fi

  start_services
  echo ""

  if [ "$DOMAIN" != "localhost" ]; then
    setup_ssl
    echo ""
    patch_compose_volumes
    echo ""

    # 如果有证书则重启 Nginx 加载 HTTPS 配置
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
      log_info "重新加载 Nginx（HTTPS 配置）..."
      docker compose -f docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d nginx
      echo ""
    fi
  fi

  seed_admin
  echo ""

  verify_deployment
  echo ""

  # 最终提示
  echo "=============================================="
  log_ok "部署完成！"
  echo ""
  echo "  访问地址:"
  if [ "$DOMAIN" == "localhost" ]; then
    echo "    前端:    http://localhost"
    echo "    API:     http://localhost/api/v1"
    echo "    Swagger: http://localhost/docs"
  else
    echo "    前端:    https://$DOMAIN"
    echo "    API:     https://$DOMAIN/api/v1"
    echo "    Swagger: https://$DOMAIN/docs"
  fi
  echo ""
  echo "  管理员账号:"
  echo "    账号:    LINFLY"
  echo "    密码:    lx19980409"
  echo ""
  echo "  常用命令:"
  echo "    查看日志:  docker logs lin-server -f"
  echo "    停止服务:  docker compose down"
  echo "    更新代码:  git pull && docker compose up -d --build"
  echo ""
  echo "  📄 详细文档: docs/deployment.md"
  echo "=============================================="
}

main