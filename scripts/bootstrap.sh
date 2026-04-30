#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# bootstrap.sh — поднимает локальный Superset стек на чистом клоне.
#
# Использование:
#   bash scripts/bootstrap.sh
#
# Что делает:
#   1. Проверяет, что Docker Desktop запущен
#   2. Создаёт docker/.env-local из .env-local.example (если нет)
#   3. docker compose up -d
#   4. Ждёт superset_app (healthy) до 10 минут
#   5. Билдит фронтенд внутри superset-node контейнера
#   6. Печатает финальный URL и логин
#
# Для Windows эквивалентный скрипт: scripts/bootstrap.cmd
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'  # no color

log()  { echo -e "${GREEN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*" >&2; }

# 1. Docker Desktop running?
log "Проверяю Docker Desktop..."
if ! docker version >/dev/null 2>&1; then
  err "Docker Desktop не запущен. Запустите Docker Desktop и повторите."
  exit 1
fi
log "Docker OK"

# 2. .env-local
if [ ! -f "docker/.env-local" ]; then
  if [ -f "docker/.env-local.example" ]; then
    warn "docker/.env-local не найден — копирую из .env-local.example"
    cp docker/.env-local.example docker/.env-local
    warn "Просмотрите docker/.env-local и заполните значения (AI_BACKEND_URL,"
    warn "CORP_CA_CERT_B64 если корп-сеть). Затем перезапустите bootstrap."
  fi
fi

# 3. Compose up
log "Поднимаю docker-compose стек..."
docker compose up -d

# 4. Ждём healthy
log "Ожидаю superset_app (healthy)... (timeout 10 минут)"
DEADLINE=$(($(date +%s) + 600))
while true; do
  STATUS=$(docker compose ps superset 2>/dev/null | grep -oE '\(healthy\)|\(unhealthy\)|\(starting\)' | head -1 || echo "")
  case "$STATUS" in
    "(healthy)")
      log "superset_app — healthy"
      break
      ;;
    "(unhealthy)")
      err "superset_app — unhealthy. Проверьте логи: docker compose logs superset"
      exit 1
      ;;
    *)
      ;;
  esac
  if [ "$(date +%s)" -gt "$DEADLINE" ]; then
    err "Timeout 10 минут. Проверьте: docker compose ps + docker compose logs superset"
    exit 1
  fi
  sleep 5
done

# 5. Build frontend
log "Билжу frontend внутри superset-node контейнера (~3-5 минут)..."

# Загружаем env из .env-local чтобы прокинуть в build
if [ -f "docker/.env-local" ]; then
  set -a
  # shellcheck disable=SC1091
  . docker/.env-local
  set +a
fi

AI_URL="${AI_BACKEND_URL:-http://dataru-saod-llm02-vm.samberi.com:8080}"

docker compose run --rm \
  -e AI_BACKEND_URL="$AI_URL" \
  -e PUPPETEER_SKIP_DOWNLOAD=true \
  -e NPM_CONFIG_STRICT_SSL=false \
  superset-node bash -c "cd /app/superset-frontend && npm run build"

log "Frontend собран"

# 6. Restart Flask + nginx чтобы подхватили новые статические файлы
log "Перезапускаю superset + nginx..."
docker compose restart superset nginx >/dev/null

# 7. Финальный echo
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Готово!${NC}"
echo ""
echo "  URL:    http://localhost:8088"
echo "  Логин:  admin"
echo "  Пароль: admin"
echo ""
echo "  Документация: docs/setup.md"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
