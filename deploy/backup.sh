#!/usr/bin/env bash
# 服务器上执行，建议加入 crontab：
#   0 3 * * * /opt/personal-site/deploy/backup.sh
# 使用 sqlite 的在线备份，保证 WAL 模式下备份文件一致。保留最近 30 份。
set -euo pipefail
DB=/opt/personal-site/backend/data/site.db
DEST=/opt/personal-site/backups
mkdir -p "$DEST"
python3 - "$DB" "$DEST/site-$(date +%Y%m%d-%H%M%S).db" <<'PY'
import sqlite3, sys
src, dst = sqlite3.connect(sys.argv[1]), sqlite3.connect(sys.argv[2])
src.backup(dst)
dst.close(); src.close()
PY
ls -1t "$DEST"/site-*.db | tail -n +31 | xargs -r rm --
