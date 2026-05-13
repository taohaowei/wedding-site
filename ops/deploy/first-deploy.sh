#!/usr/bin/env bash
# =====================================================================
# 首次部署脚本(本地运行)
# 用法:
#   bash first-deploy.sh <ecs_host> [<ssh_user>]
# 前置:
#   1. 已 ssh root@<host> bash setup-server.sh(服务器装好基础环境)
#   2. 已 cp .env.example .env 并填好 ADMIN_PASSWORD / EMAIL / SESSION_SECRET
#   3. 域名 mynight.top / www.mynight.top 已解析到本台 ECS 公网 IP
#   4. ECS 安全组放行 22 / 80 / 443
#
# 行为:
#   1. 校验 .env(必填项不能为空)
#   2. scp Nginx mynight.conf 到服务器并 install(此时还没有 SSL,
#      第一次 install 会因 ssl_certificate 路径不存在而 nginx -t 失败 —
#      所以本脚本会先临时把 https server 段注释掉,等证书下来后再开)
#   3. 用 certbot 申请 SSL(setup-ssl.sh)
#   4. 重新 install Nginx 配置(此时 SSL 路径已存在)
#   5. 同步 PM2 ecosystem.config.cjs 到 /etc/wedding/(把 ADMIN_PASSWORD
#      / SESSION_SECRET 替换为本地 .env 里的值,绝不上传明文模板)
#   6. 调用 deploy.sh 完成 frontend / backend 的首次同步与启动
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------- 加载 .env ----------
if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  echo "[!] 找不到 .env,请先执行:cp .env.example .env 并填值" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; source "$SCRIPT_DIR/.env"; set +a

HOST="${1:-}"
SSH_USER="${2:-${DEFAULT_SSH_USER:-root}}"

if [[ -z "$HOST" ]]; then
  echo "用法:bash first-deploy.sh <ecs_host> [<ssh_user>]" >&2
  exit 1
fi

# ---------- 必填变量校验 ----------
require() {
  local name="$1" val="${!1:-}"
  if [[ -z "$val" || "$val" == *change-me* || "$val" == *CHANGE_ME* ]]; then
    echo "[!] .env 中 $name 没填(或还是占位)" >&2
    exit 1
  fi
}
require ADMIN_PASSWORD
require SESSION_SECRET
require EMAIL
require DOMAIN_PRIMARY
require DOMAIN_ALIAS

REMOTE="${SSH_USER}@${HOST}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=20)

step() { printf '\n\033[1;36m[first-deploy]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ok]\033[0m         %s\n' "$*"; }

# ---------- 1. 拷贝 Nginx 配置(先做无 https 版的临时配置) ----------
step "1/6 拷贝 Nginx 配置到服务器(临时关闭 https,先让 80 可访问以便 certbot 挑战)"
TMP_CONF="$(mktemp)"
trap 'rm -f "$TMP_CONF"' EXIT
# 把 443 server { ... } 段注释掉,留 80 段给 certbot
awk '
  BEGIN { in443=0; depth=0 }
  /^[[:space:]]*server[[:space:]]*\{/ {
    if (prev ~ /443/) { in443=1; depth=1; print "# [first-deploy temp] " $0; next }
  }
  {
    if (in443) {
      depth += gsub(/\{/, "{")
      depth -= gsub(/\}/, "}")
      print "# [first-deploy temp] " $0
      if (depth <= 0) { in443=0 }
      next
    }
    print
    prev = $0
  }
' "$OPS_DIR/nginx/mynight.conf" > "$TMP_CONF"

# 上传 nginx 目录(install.sh 也带过去)
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p /tmp/wedding-ops/nginx"
scp "${SSH_OPTS[@]}" "$TMP_CONF"               "${REMOTE}:/tmp/wedding-ops/nginx/mynight.conf"
scp "${SSH_OPTS[@]}" "$OPS_DIR/nginx/install.sh" "${REMOTE}:/tmp/wedding-ops/nginx/install.sh"

ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  cd /tmp/wedding-ops/nginx
  chmod +x install.sh
  sudo bash install.sh
'
ok "Nginx 临时配置已生效(只 listen 80)"

# ---------- 2. 申请 SSL ----------
step "2/6 申请 Let's Encrypt 证书"
scp "${SSH_OPTS[@]}" "$OPS_DIR/deploy/setup-ssl.sh" "${REMOTE}:/tmp/wedding-ops/setup-ssl.sh"
ssh "${SSH_OPTS[@]}" "$REMOTE" "
  set -euo pipefail
  chmod +x /tmp/wedding-ops/setup-ssl.sh
  sudo EMAIL='${EMAIL}' \
       DOMAIN_PRIMARY='${DOMAIN_PRIMARY}' \
       DOMAIN_ALIAS='${DOMAIN_ALIAS}' \
       bash /tmp/wedding-ops/setup-ssl.sh
"
ok "SSL 证书已申请并续期已配置"

# ---------- 3. 上传完整 Nginx 配置(含 443) ----------
step "3/6 上传完整 Nginx 配置(启用 443)"
scp "${SSH_OPTS[@]}" "$OPS_DIR/nginx/mynight.conf" "${REMOTE}:/tmp/wedding-ops/nginx/mynight.conf"
ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  cd /tmp/wedding-ops/nginx
  sudo bash install.sh
'
ok "Nginx 全量配置生效(80 + 443)"

# ---------- 4. 上传 PM2 ecosystem(注入真实密码) ----------
step "4/6 上传 PM2 ecosystem.config.cjs(密码从 .env 注入)"
TMP_ECO="$(mktemp)"
# 用 sed 替换占位符 — 用 ` ` 作为分隔符以避开 / 等字符
ESC_ADMIN="$(printf '%s' "$ADMIN_PASSWORD" | sed -e 's/[\/&|`"$\\]/\\&/g')"
ESC_SECRET="$(printf '%s' "$SESSION_SECRET" | sed -e 's/[\/&|`"$\\]/\\&/g')"
sed \
  -e "s|CHANGE_ME_BEFORE_DEPLOY|${ESC_ADMIN}|" \
  -e "s|CHANGE_ME_TO_RANDOM_32CHARS_OR_MORE|${ESC_SECRET}|" \
  "$OPS_DIR/pm2/ecosystem.config.cjs" > "$TMP_ECO"

scp "${SSH_OPTS[@]}" "$TMP_ECO" "${REMOTE}:/tmp/wedding-ops/ecosystem.config.cjs"
rm -f "$TMP_ECO"

ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  sudo install -m 0640 /tmp/wedding-ops/ecosystem.config.cjs /etc/wedding/ecosystem.config.cjs
  sudo chown root:root /etc/wedding/ecosystem.config.cjs
  rm -f /tmp/wedding-ops/ecosystem.config.cjs
'
ok "/etc/wedding/ecosystem.config.cjs 已写入(含真实 ADMIN_PASSWORD)"

# ---------- 5. 触发常规 deploy(同步前/后端 + 起 PM2) ----------
step "5/6 调用 deploy.sh 完成首次代码同步与 PM2 启动"
bash "$SCRIPT_DIR/deploy.sh" "$HOST" "$SSH_USER"
ok "代码已部署"

# ---------- 6. 健康检查 ----------
step "6/6 健康检查"
ssh "${SSH_OPTS[@]}" "$REMOTE" '
  set -euo pipefail
  echo "  -> curl http://127.0.0.1:3001/api/health"
  curl -sf http://127.0.0.1:3001/api/health || { echo "[!] 后端 health 失败"; exit 30; }
  echo
'
ok "首次部署全部完成"

cat <<EOF

========================================================================
 婚礼请柬上线成功
 主页面: https://${DOMAIN_PRIMARY}
 后台:   https://${DOMAIN_PRIMARY}/admin   (密码 = .env 里的 ADMIN_PASSWORD)
 API:    https://${DOMAIN_PRIMARY}/api/health
========================================================================
EOF
