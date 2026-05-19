#!/usr/bin/env bash
# Delta-deploy frontend bundle to Docker superset_app container.
#
# Копирует только изменённые spa/embedded entry + chunks плагинов + manifest
# (~10MB вместо 200MB full static/assets). Без docker restart — Flask отдаёт
# static-файлы напрямую, cache-bust работает через [contenthash] в filename.
#
# Usage:
#   cd superset/my-plugins/riskMatrix && npm run build
#   cd ../../superset-frontend && npm run build
#   ../scripts/deploy-frontend-delta.sh
#   # Браузер: Ctrl+Shift+R на :8088

set -euo pipefail

ASSETS="D:/projects/superset-dev/superset/superset/static/assets"
CONTAINER="superset_app"
MAX_AGE_MIN="${MAX_AGE_MIN:-5}"

if [ ! -d "$ASSETS" ]; then
  echo "ERROR: assets dir not found: $ASSETS" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: container '${CONTAINER}' not running" >&2
  exit 1
fi

echo "[1/2] manifest.json"
MSYS_NO_PATHCONV=1 docker cp "$ASSETS/manifest.json" \
  "$CONTAINER:/app/superset/static/assets/manifest.json"

echo "[2/2] delta files (.js/.css mtime < ${MAX_AGE_MIN} min)"
# Копируем ВСЕ свежие .js/.css. Webpack splitChunks создаёт много
# entry/chunk файлов (vendor packages, src splits, DashboardContainer
# и т.д.), все они referenced из spa entry runtime. Фильтр по имени
# рискует пропустить нужный chunk — копируем по mtime.
count=0
while IFS= read -r -d '' f; do
  fname=$(basename "$f")
  MSYS_NO_PATHCONV=1 docker cp "$f" \
    "$CONTAINER:/app/superset/static/assets/$fname"
  echo "  + $fname"
  count=$((count + 1))
done < <(find "$ASSETS" -maxdepth 1 -type f -mmin "-${MAX_AGE_MIN}" \( \
  -name "*.js" -o -name "*.css" \
\) -print0)

echo ""
echo "Deployed $count delta files + manifest. Hard refresh (Ctrl+Shift+R) на :8088."
