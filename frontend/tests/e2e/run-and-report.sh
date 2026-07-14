#!/usr/bin/env bash
# 跑响应式截图测试 + 打开报告
#
# 前提:
#   1. dev server 在 http://localhost:5173 (默认),或通过 BASE_URL 覆盖
#   2. 系统已有 chromium 缓存(任意一次 npx playwright 之后都有)
#
# 用法:
#   ./run-and-report.sh                 # 用 localhost:5173,跑完自动打开
#   BASE_URL=http://x.y:8080 ./run-and-report.sh
#   ./run-and-report.sh --no-open       # 跑完不自动打开浏览器

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPEC="$SCRIPT_DIR/responsive.spec.mjs"
OUT_DIR="${OUT_DIR:-/tmp/wedding-responsive-report}"
BASE_URL="${BASE_URL:-http://localhost:5173}"

OPEN_REPORT=1
for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_REPORT=0 ;;
  esac
done

echo "[run] BASE_URL = $BASE_URL"
echo "[run] OUT_DIR  = $OUT_DIR"

# 探活
if ! curl -fsS -o /dev/null --max-time 5 "$BASE_URL"; then
  echo "[fatal] $BASE_URL 不通,请先启动 dev server: npm run dev" >&2
  exit 1
fi

# 跑脚本
BASE_URL="$BASE_URL" OUT_DIR="$OUT_DIR" node "$SPEC"

REPORT="$OUT_DIR/index.html"
if [[ -f "$REPORT" && "$OPEN_REPORT" -eq 1 ]]; then
  echo "[open] $REPORT"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$REPORT"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$REPORT"
  fi
fi
