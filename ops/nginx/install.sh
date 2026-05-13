#!/usr/bin/env bash
# =====================================================================
# 安装/更新 Nginx 站点配置:mynight.conf
# 用法:在服务器上执行
#   sudo bash install.sh
# 行为:
#   1. 复制 mynight.conf 到 /etc/nginx/sites-available/
#   2. 软链到 /etc/nginx/sites-enabled/
#   3. nginx -t 校验
#   4. reload(校验失败不 reload)
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_NAME="mynight.conf"
SRC="${SCRIPT_DIR}/${CONF_NAME}"
DST_AVAILABLE="/etc/nginx/sites-available/${CONF_NAME}"
DST_ENABLED="/etc/nginx/sites-enabled/${CONF_NAME}"

if [[ $EUID -ne 0 ]]; then
  echo "[!] 请用 sudo 运行(需要写 /etc/nginx/)" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "[!] 找不到源配置:$SRC" >&2
  exit 1
fi

echo "[1/4] 复制配置 → $DST_AVAILABLE"
install -m 0644 "$SRC" "$DST_AVAILABLE"

echo "[2/4] 软链 → $DST_ENABLED"
ln -sfn "$DST_AVAILABLE" "$DST_ENABLED"

# 关掉默认站点,免得抢 80/443
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  echo "    顺手禁用 /etc/nginx/sites-enabled/default"
  rm -f /etc/nginx/sites-enabled/default
fi

echo "[3/4] 校验 nginx 配置"
if ! nginx -t; then
  echo "[!] nginx -t 失败,已停止 reload。请检查配置后重试。" >&2
  exit 2
fi

echo "[4/4] reload nginx"
systemctl reload nginx

echo "[OK] mynight.conf 安装/更新完成。"
