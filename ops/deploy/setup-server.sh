#!/usr/bin/env bash
# =====================================================================
# 服务器一次性初始化脚本(Ubuntu 22.04 / Debian 12)
# 用法:
#   ssh root@<your-ecs-ip>
#   curl -O https://your-host/setup-server.sh   # 或 scp 上来
#   sudo bash setup-server.sh
#
# 行为:
#   1. apt update / 安装基础工具(curl, gnupg, ca-certificates 等)
#   2. 安装 Node.js 20 LTS(NodeSource 源)
#   3. 安装 Nginx + certbot + python3-certbot-nginx
#   4. 全局安装 PM2,并配置 systemd 自启
#   5. 创建系统用户 wedding(nologin)
#   6. 创建运行所需目录:
#        /var/www/wedding/{frontend/dist,backend}
#        /var/lib/wedding              (SQLite 数据)
#        /var/log/pm2                  (PM2 日志)
#        /etc/wedding                  (PM2 ecosystem 等配置)
#   7. 配置 ufw(可选,默认不动 — 阿里云用安全组就够了)
#
# 可重入:每步都先检测 command -v / 目录是否存在,跳过已完成的部分。
# =====================================================================
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "[!] 请用 sudo / root 运行" >&2
  exit 1
fi

# 让交互式提示走默认值,避免 apt 弹出
export DEBIAN_FRONTEND=noninteractive

WEDDING_USER="wedding"
WWW_DIR="/var/www/wedding"
DATA_DIR="/var/lib/wedding"
LOG_DIR="/var/log/pm2"
CFG_DIR="/etc/wedding"

step() { printf '\n\033[1;36m[step]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ok]\033[0m   %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }

# ---------- 1. 基础包 ----------
step "1/7 apt update + 基础工具"
apt-get update -y
apt-get install -y --no-install-recommends \
  curl wget gnupg ca-certificates lsb-release \
  build-essential git rsync ufw cron sqlite3 unzip
ok "基础工具已就绪"

# ---------- 2. Node.js 20 ----------
step "2/7 Node.js 20"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
ok "node $(node -v)  /  npm $(npm -v)"

# ---------- 3. Nginx + certbot ----------
step "3/7 Nginx + certbot"
command -v nginx   >/dev/null 2>&1 || apt-get install -y nginx
command -v certbot >/dev/null 2>&1 || apt-get install -y certbot python3-certbot-nginx
systemctl enable nginx >/dev/null 2>&1 || true
systemctl start  nginx >/dev/null 2>&1 || true
ok "nginx $(nginx -v 2>&1 | awk -F/ '{print $2}')  /  certbot $(certbot --version 2>&1 | awk '{print $2}')"

# ---------- 4. PM2 ----------
step "4/7 PM2(全局)"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
ok "pm2 $(pm2 -v)"

# pm2 startup:让 PM2 进程开机自启;以 root 跑(后端只监听 127.0.0.1)
if ! systemctl list-unit-files | grep -q '^pm2-root\.service'; then
  step "    配置 pm2 systemd 自启"
  pm2 startup systemd -u root --hp /root | tail -n 1 | bash || warn "pm2 startup 输出请人工确认"
fi
ok "PM2 systemd unit 已注册(pm2-root.service)"

# ---------- 5. 系统用户(可选;当前后端用 root 跑也可) ----------
step "5/7 系统用户 ${WEDDING_USER}(nologin)"
if ! id "$WEDDING_USER" >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$WEDDING_USER"
  ok "已创建用户 $WEDDING_USER"
else
  ok "用户 $WEDDING_USER 已存在"
fi

# ---------- 6. 目录 ----------
step "6/7 运行所需目录"
mkdir -p "$WWW_DIR/frontend/dist" \
         "$WWW_DIR/backend"      \
         "$DATA_DIR"              \
         "$LOG_DIR"               \
         "$CFG_DIR"

# 数据目录权限收紧,只允许 root 读写(PM2 也以 root 跑)
chmod 0750 "$DATA_DIR"
chown root:root "$DATA_DIR"

chown -R root:root "$WWW_DIR" "$LOG_DIR" "$CFG_DIR"
ok "目录就绪:"
printf "        %s\n" \
  "$WWW_DIR/frontend/dist  (Nginx root)" \
  "$WWW_DIR/backend         (Hono build 输出)" \
  "$DATA_DIR                (SQLite wedding.db)" \
  "$LOG_DIR                 (PM2 日志)" \
  "$CFG_DIR                 (ecosystem.config.cjs)"

# ---------- 7. 防火墙提示 ----------
step "7/7 防火墙提示"
warn "本脚本不主动改 ufw。阿里云请在 ECS 安全组放行 22 / 80 / 443。"
warn "若想本机也开 ufw,自行执行:ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable"

cat <<EOF

========================================================================
 服务器初始化完成
------------------------------------------------------------------------
 下一步:
   1. 在本地机器上,用 first-deploy.sh 完成首次部署:
        cd ops/deploy
        cp .env.example .env       # 填 ADMIN_PASSWORD / EMAIL 等
        bash first-deploy.sh <ecs-host> [<ssh_user>]
   2. SSL 证书申请(在服务器上,首次部署 Nginx 配置之后再跑):
        bash setup-ssl.sh
========================================================================
EOF
