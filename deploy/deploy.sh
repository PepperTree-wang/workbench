#!/usr/bin/env bash
# 本地执行：构建前端并同步代码到服务器，然后重启后端。
# 用法：SERVER=root@1.2.3.4 ./deploy/deploy.sh
set -euo pipefail

: "${SERVER:?请设置 SERVER，例如 SERVER=root@1.2.3.4}"
REMOTE_DIR=${REMOTE_DIR:-/opt/personal-site}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "==> 构建前端"
(cd "$ROOT/frontend" && npm ci && npm run build)

echo "==> 同步文件到 $SERVER:$REMOTE_DIR"
ssh "$SERVER" "mkdir -p $REMOTE_DIR/backend $REMOTE_DIR/frontend"
rsync -az --delete \
  --exclude '.venv' --exclude 'data' --exclude '.env' --exclude '__pycache__' --exclude '.pytest_cache' \
  "$ROOT/backend/" "$SERVER:$REMOTE_DIR/backend/"
rsync -az --delete "$ROOT/frontend/dist/" "$SERVER:$REMOTE_DIR/frontend/dist/"
rsync -az "$ROOT/deploy/" "$SERVER:$REMOTE_DIR/deploy/"

echo "==> 安装依赖并重启"
ssh "$SERVER" bash -s <<REMOTE
set -euo pipefail
cd $REMOTE_DIR/backend
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
mkdir -p data && chown -R \${RUN_USER:-www-data}: data
if systemctl list-unit-files personal-site.service >/dev/null 2>&1 && [ -f /etc/systemd/system/personal-site.service ]; then
  systemctl restart personal-site
  systemctl --no-pager --lines=3 status personal-site
else
  echo "!! 尚未安装 systemd 服务，请按 README「首次部署」完成配置"
fi
REMOTE

echo "==> 完成"
