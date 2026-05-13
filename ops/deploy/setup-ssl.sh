#!/usr/bin/env bash
# =====================================================================
# Let's Encrypt 证书申请脚本(在服务器上跑)
#
# 前置条件:
#   1. 域名 mynight.top / www.mynight.top 已解析到本机公网 IP
#   2. ECS 安全组 + 防火墙已放行 80/443
#   3. Nginx 已经装好,并且 mynight.conf 已经 install(http server 段
#      监听 80 是必需的,certbot 走 http-01 挑战)
#
# 用法:
#   sudo EMAIL=you@example.com bash setup-ssl.sh
#   或者直接运行:sudo bash setup-ssl.sh   (会交互式问邮箱)
#
# 行为:
#   1. 用 certbot --nginx 自动申请证书并改写 Nginx 配置
#   2. 校验 systemd timer:certbot.timer 应该已经启用(用于自动续期)
#   3. 跑一次 certbot renew --dry-run 确认续期可用
# =====================================================================
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "[!] 请用 sudo / root 运行" >&2
  exit 1
fi

DOMAIN_PRIMARY="${DOMAIN_PRIMARY:-www.mynight.top}"
DOMAIN_ALIAS="${DOMAIN_ALIAS:-mynight.top}"
EMAIL="${EMAIL:-}"

if [[ -z "$EMAIL" ]]; then
  read -rp "请输入用于 Let's Encrypt 续期通知的邮箱: " EMAIL
fi

if [[ -z "$EMAIL" ]]; then
  echo "[!] EMAIL 不能为空" >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "[!] certbot 未安装,请先跑 setup-server.sh" >&2
  exit 1
fi

echo "[1/3] 申请证书 → $DOMAIN_PRIMARY, $DOMAIN_ALIAS"
certbot --nginx \
  -d "$DOMAIN_PRIMARY" \
  -d "$DOMAIN_ALIAS" \
  --agree-tos \
  --non-interactive \
  --redirect \
  --email "$EMAIL"

echo "[2/3] 检查自动续期 systemd timer"
if systemctl list-timers --all | grep -q certbot; then
  echo "    certbot.timer 已启用(每天自动检查续期)"
else
  echo "    [warn] 未发现 certbot.timer,尝试启用 snap 版备选..." >&2
  systemctl enable --now certbot.timer || true
fi

echo "[3/3] 模拟续期(dry-run)"
certbot renew --dry-run

cat <<EOF

========================================================================
 SSL 证书申请完成
 证书路径:/etc/letsencrypt/live/${DOMAIN_PRIMARY}/{fullchain,privkey}.pem
 自动续期:certbot.timer (systemctl list-timers | grep certbot)
========================================================================
EOF
