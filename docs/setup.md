# Setup — локальная разработка Superset форка

Гид по установке и работе с форком на новой машине, включая корп-сетевые
особенности и интеграцию с AI/Cube/StarRocks.

## Quick Start (одна команда)

```bash
# Linux/Mac/WSL:
git clone https://github.com/light050687/superset.git
cd superset
bash scripts/bootstrap.sh
```

```cmd
REM Windows:
git clone https://github.com/light050687/superset.git
cd superset
scripts\bootstrap.cmd
```

После 5-15 минут (билд образов + npm install + npm run build):

```
URL:    http://localhost:8088
Логин:  admin
Пароль: admin
```

## Что нужно установить заранее

| Инструмент | Минимум | Где взять |
|---|---|---|
| **Docker Desktop** | 4.20+, WSL2 backend (Win) | https://www.docker.com/products/docker-desktop/ |
| **Git** | 2.30+ | https://git-scm.com/ |
| **(опц.) pre-commit** | для активации hooks | `pip install pre-commit` |
| **(опц.) Node 20** | если хотите билдить локально без Docker | https://nodejs.org/ |
| **Память Docker** | ≥ 8 ГБ | Settings → Resources |
| **Диск** | ~15 ГБ свободно | — |

## Структура проекта

```
superset/                          ← git репо (этот форк)
├── docker-compose.yml             ← 7 сервисов (superset + worker + nginx + db + redis + node + websocket)
├── Dockerfile                     ← multi-stage: superset-node-ci → python-base → dev/lean
├── docker/
│   ├── .env                       ← коммит, default переменные
│   ├── .env-local                 ← gitignored, machine-specific override
│   ├── .env-local.example         ← шаблон для .env-local
│   └── pythonpath_dev/superset_config.py
├── superset/                      ← Python модуль Superset
├── superset-frontend/             ← React + TypeScript + ECharts
│   └── src/features/ai/           ← AI-чат (наша основная разработка)
├── superset-websocket/            ← Node.js (real-time SQL Lab progress)
├── my-plugins/                    ← кастомные viz-плагины (10 шт)
├── scripts/
│   ├── bootstrap.sh / .cmd        ← быстрый старт нового компа
│   └── ...
└── docs/
    ├── setup.md                   ← этот файл
    └── devops-tasks/              ← задачи для DevOps (CORS, Cube ingress, CA)
```

## Корпоративная сеть

Если ваша сеть с MITM-прокси (Bluecoat/Zscaler/Forcepoint и т.п.) —
`registry.npmjs.org` и `pypi.org` отвечают через подменённый TLS-серт.

### Получение корп-CA

**Linux/Mac:**
```bash
# Извлечь из браузера:
echo | openssl s_client -showcerts -connect registry.npmjs.org:443 \
  -servername registry.npmjs.org 2>/dev/null \
  | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' \
  > corp-chain.pem

# Корп-CA — обычно последний или предпоследний серт в цепочке.
# Его выделить и сохранить как corp-ca.pem.

# Конвертировать в base64:
base64 -w0 corp-ca.pem
```

**Windows PowerShell:**
```powershell
# Из Windows trust store:
$root = Get-ChildItem -Path Cert:\LocalMachine\Root |
        Where-Object { $_.Subject -match "Samberi|Корп" }

$root | Export-Certificate -FilePath corp-ca.cer -Type CERT

# Конвертация в base64:
[Convert]::ToBase64String([IO.File]::ReadAllBytes('corp-ca.cer'))
```

### Применение в Docker

```bash
# В docker/.env-local:
CORP_CA_CERT_B64=<base64-строка-из-предыдущего-шага>

# Затем:
docker compose build --no-cache superset superset-websocket
```

Dockerfile подложит CA в `/usr/local/share/ca-certificates/corp.crt`,
запустит `update-ca-certificates`, npm/pip/uv будут доверять цепочке.

### Без корп-CA (fallback)

Если CA недоступен, `bootstrap.sh` автоматически падает на
`strict-ssl=false` для npm и `--trusted-host` для pip. **Это отключает
TLS-проверку**: подходит для dev, **не для prod**.

## Домашняя сеть

Никаких корп-настроек не нужно — `bootstrap.sh` работает out-of-the-box.
`docker/.env-local` можно вообще не создавать или оставить пустым:
дефолты в `docker/.env` (commit'нуто) подхватятся.

## AI-чат (ai-analytics)

Frontend AI-чата ходит на Go-сервис `ai-analytics:8080`.

### Подключение

В `docker/.env-local`:
```
AI_BACKEND_URL=http://dataru-saod-llm02-vm.samberi.com:8080
```

### Mock-режим

Если `AI_BACKEND_URL` не задан или backend недоступен — frontend
падает в mock-режим: возвращает заглушку «маржа категории Мясо…».
Это позволяет работать с UI без живого AI-сервиса.

### Контракт

Frontend ожидает один из форматов от `POST /api/v1/analyze`:

```json
// Каноничный:
{ "answer": { "title": "...", "text": "...", "kpi": [...], ... },
  "session_id": "...", "meta": { "model": "haiku-4.5", ... } }

// Реальный (LLM-pipeline):
{ "message": "<markdown>", "intent": "query_data",
  "cubeQuery": { "dimensions": [...], "measures": [...], ... },
  "rawData": [ {...}, ... ],
  "session_id": "...", "meta": {...} }

// Legacy:
{ "text": "..." }
```

Адаптер в `superset-frontend/src/features/ai/api.ts` нормализует все
варианты в каноничный + извлекает KPI из markdown по regex.

## Cube.dev / StarRocks

### Cube SQL API

Cube.dev предоставляет PostgreSQL-совместимый SQL API. Подключается
в Superset как обычный Postgres через **внешний endpoint** (DevOps
настроил выход наружу через k8s-ingress / NodePort):

```
postgresql+psycopg2://pguser:****@<cube-host>:<port>/gold
```

Конкретные `<cube-host>:<port>` и креды (`CUBEJS_SQL_USER`,
`CUBEJS_SQL_PASSWORD`) — у DevOps team. Подключение делается через
Superset → Settings → Database Connections → + Database → PostgreSQL.

### StarRocks

MySQL-совместимый протокол на порту 9030:

```
mysql+pymysql://root:****@<starrocks-fe-host>:9030/<schema>
```

Уточните у DevOps host и creds. Драйвер `pymysql` уже в Superset image.

## Обновление (git pull)

```bash
git pull origin <ваша-ветка>

# Обновились dependencies / docker-compose.yml / Dockerfile?
docker compose build superset superset-node superset-websocket

# Обновились frontend исходники?
docker compose run --rm \
  -e AI_BACKEND_URL=http://dataru-saod-llm02-vm.samberi.com:8080 \
  superset-node bash -c "cd /app/superset-frontend && npm run build"

docker compose restart superset nginx
```

Или просто заново:
```bash
bash scripts/bootstrap.sh
```

## Troubleshooting

### `webpack 5.x compiled with X errors` на TS

ForkTsCheckerWebpackPlugin теперь opt-in:
- По умолчанию: TS-проверка отключена, билд зелёный.
- Полная проверка: `STRICT_TS_CHECK=1 npm run build` или `npm run type`.

Это компромисс пока в кодовой базе остаётся TS-debt в Dashboard/SideRail.

### `Module not found: Can't resolve 'superset-plugin-chart-*'`

Плагины `my-plugins/<name>` в node_modules как symlinks. После
`npm install` пересоздать:

```bash
docker compose run --rm superset-node bash -c \
  "cd /app/superset-frontend && rm -rf node_modules/superset-plugin-chart-* && \
   npm install --legacy-peer-deps --force"
```

### `SELF_SIGNED_CERT_IN_CHAIN` при `npm ci`

Корп-MITM-прокси. См. секцию «Корпоративная сеть» выше — подложите
CA через `CORP_CA_CERT_B64` или используйте fallback (strict-ssl=false).

### `Failed to fetch language pack: 404` на ru

Должно работать out-of-the-box после `git pull` — русский messages.json
закоммичен. Если нет, проверьте `superset/translations/ru/LC_MESSAGES/`
и пересоздайте через:

```bash
docker compose exec superset bash -c "cd /app && pybabel compile -d superset/translations"
```

### Шрифты `manrope-*.woff2` 404

Должны быть в `superset/static/assets/fonts/` — закоммичены в репо
(18 файлов, ~400 КБ). Если webpack их стёр при билде:

```bash
git restore superset/static/assets/fonts/
docker compose restart nginx
```

### CORS error «wildcard with credentials»

Backend ai-analytics возвращает `Access-Control-Allow-Origin: *`,
поэтому фронт убрал `credentials: 'include'`. Это **правильно** для
текущего состояния backend'а.

См. `docs/devops-tasks/ai-analytics-cors.md` для долгосрочного фикса.

### Контейнер `superset_app` `unhealthy`

При первом старте `superset-init` устанавливает Python-зависимости —
3-5 минут. Если статус `unhealthy` уже >10 минут:

```bash
docker compose logs superset-init
docker compose logs superset
```

Частые причины:
- `SELF_SIGNED_CERT_IN_CHAIN` при `pybabel compile` или загрузке examples
  → отключите `SUPERSET_LOAD_EXAMPLES=no` в `docker/.env-local`
- `connection refused` к postgres → перезапустите db: `docker compose restart db`

## Полезные команды

```bash
# Статус всех сервисов
docker compose ps

# Логи в реальном времени
docker compose logs -f superset

# Войти в контейнер superset
docker compose exec superset bash

# Только перезапуск Flask (без переустановки pip)
docker compose kill -s HUP superset

# Полный рестарт (с переустановкой uv editable)
docker compose restart superset

# Удалить всё (включая volumes — db, redis)
docker compose down -v
```

## Связанные документы

- `docs/devops-tasks/ai-analytics-cors.md` — CORS whitelist для AI backend
- `CLAUDE.md` (корень) — правила разработки + дизайн-система DS 2.0
- `superset/CLAUDE.md` — Apache Superset upstream contracts
