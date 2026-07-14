#!/usr/bin/env bash
# =====================================================================
# 日常更新部署脚本(本地运行,不需 sudo)
# 用法:
#   bash deploy.sh <ecs_host> [<ssh_user>]
# 示例:
#   bash deploy.sh 47.xxx.xxx.xxx
#   bash deploy.sh www.example.com wedding-admin
#
# 行为:
#   1. 本地 build 前端(frontend/)和后端(backend/)
#   2. rsync frontend/dist  → <host>:/var/www/wedding/frontend/dist/
#   3. rsync backend/dist + package.json + lock  → <host>:/var/www/wedding/backend/
#   4. ssh:cd backend && npm ci --omit=dev
#   5. ssh:pm2 reload wedding-api(失败则用 ecosystem 拉起)
#   6. ssh:nginx -t && nginx -s reload(可选,默认跳过 — 配置没变就别 reload)
#
# 不做的事:
#   - 不动 SSL(setup-ssl.sh 管)
#   - 不动 Nginx 配置(first-deploy.sh 管,或手动 install.sh)
#   - 不动 ecosystem.config.cjs(first-deploy.sh 管)
# =====================================================================
set -euo pipefail

# ---------- 解析参数 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"   # = wedding-site/

if [[ -f "$SCRIPT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

HOST="${1:-}"
SSH_USER="${2:-${DEFAULT_SSH_USER:-root}}"

if [[ -z "$HOST" ]]; then
  echo "用法:bash deploy.sh <ecs_host> [<ssh_user>]" >&2
  exit 1
fi

REMOTE="${SSH_USER}@${HOST}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=20)
RSYNC_SSH="ssh ${SSH_OPTS[*]}"

step()  { printf '\n\033[1;36m[deploy]\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m[ok]\033[0m     %s\n' "$*"; }
fail()  { printf '\033[1;31m[fail]\033[0m   %s\n' "$*" >&2; exit 1; }

# ---------- 0. 预检 ----------
step "0/6 预检"
[[ -d "$ROOT_DIR/frontend" ]] || fail "找不到 $ROOT_DIR/frontend"
[[ -d "$ROOT_DIR/backend"  ]] || fail "找不到 $ROOT_DIR/backend"
command -v rsync >/dev/null || fail "本机没装 rsync,brew install rsync 或 apt install rsync"
ok "本地目录与工具齐全"

# ---------- 1. 本地 build 前端 ----------
step "1/6 build frontend"
( cd "$ROOT_DIR/frontend" && \
    if [[ -f package-lock.json ]]; then npm ci; else npm install; fi && \
    npm run build )
[[ -f "$ROOT_DIR/frontend/dist/index.html" ]] || fail "前端 build 没产出 index.html"
ok "frontend/dist 就绪"

# ---------- 2. 本地 build 后端 ----------
step "2/6 build backend"
( cd "$ROOT_DIR/backend" && \
    if [[ -f package-lock.json ]]; then npm ci; else npm install; fi && \
    npm run build )
[[ -f "$ROOT_DIR/backend/dist/server.js" ]] || fail "后端 build 没产出 dist/server.js(检查 backend 的 build 脚本)"
ok "backend/dist 就绪"

# ---------- 3. rsync 前端 ----------
step "3/6 同步 frontend/dist → ${REMOTE}:/var/www/wedding/frontend/dist/"
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  "$ROOT_DIR/frontend/dist/" \
  "${REMOTE}:/var/www/wedding/frontend/dist/"
ok "前端同步完成"

# ---------- 4. rsync 后端(只同步运行时必要文件) ----------
step "4/6 同步 backend → ${REMOTE}:/var/www/wedding/backend/"
# dist 目录用 --delete,确保旧 js 不残留
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  "$ROOT_DIR/backend/dist/" \
  "${REMOTE}:/var/www/wedding/backend/dist/"

# package.json / lock 单独同步,不开 --delete
rsync -avz \
  -e "$RSYNC_SSH" \
  "$ROOT_DIR/backend/package.json" \
  "${REMOTE}:/var/www/wedding/backend/package.json"

if [[ -f "$ROOT_DIR/backend/package-lock.json" ]]; then
  rsync -avz \
    -e "$RSYNC_SSH" \
    "$ROOT_DIR/backend/package-lock.json" \
    "${REMOTE}:/var/www/wedding/backend/package-lock.json"
fi

# 如果有 migrations,也同步过去
if [[ -d "$ROOT_DIR/backend/migrations" ]]; then
  rsync -avz \
    -e "$RSYNC_SSH" \
    "$ROOT_DIR/backend/migrations/" \
    "${REMOTE}:/var/www/wedding/backend/migrations/"
fi
ok "后端同步完成"

# ---------- 5. 远端 npm ci(生产依赖) ----------
step "5/6 远端安装生产依赖 npm ci --omit=dev"
ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  cd /var/www/wedding/backend
  if [[ -f package-lock.json ]]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi
'
ok "依赖安装完成"

# ---------- 6. 远端 PM2 reload ----------
step "6/6 PM2 reload(失败回退到 start ecosystem)"
ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  if pm2 describe wedding-api >/dev/null 2>&1; then
    echo "  -> reload wedding-api"
    if ! pm2 reload wedding-api --update-env; then
      echo "[!] pm2 reload 失败,以下为最近日志:" >&2
      pm2 logs wedding-api --lines 50 --nostream || true
      exit 21
    fi
  else
    if [[ ! -f /etc/wedding/ecosystem.config.cjs ]]; then
      echo "[!] /etc/wedding/ecosystem.config.cjs 不存在,请先跑 first-deploy.sh" >&2
      exit 22
    fi
    echo "  -> 首次 start ecosystem"
    pm2 start /etc/wedding/ecosystem.config.cjs --env production
    pm2 save
  fi
  pm2 status wedding-api
'
ok "PM2 已就绪"

cat <<EOF

========================================================================
 部署完成
   前端: https://www.example.com
   后台: https://www.example.com/admin
   API : https://www.example.com/api/health
 远端日志:
   ssh ${REMOTE} "pm2 logs wedding-api"
   ssh ${REMOTE} "tail -f /var/log/nginx/example.error.log"
========================================================================
EOF
