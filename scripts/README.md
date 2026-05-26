# Deploy / Update Superset BI стенд

Кросс-платформенные Python-скрипты для развёртывания нашего форка Apache Superset с кастомными viz-плагинами. Два режима:

| Скрипт                                 | Когда использовать                                                |
| -------------------------------------- | ----------------------------------------------------------------- |
| `python scripts/deploy.py setup`       | Первый запуск на чистой машине / новом сервере                    |
| `python scripts/deploy.py update`      | Подтянуть свежий код + пересобрать на работающем стенде           |
| `python scripts/delta.py`              | Быстрый цикл «правка плагина → :8088» (~3 сек, без docker restart) |

## Что развёртывается

- **5 контейнеров:** `superset_app` (gunicorn), `superset_init` (one-shot init), `superset_worker` (celery), `superset_worker_beat` (celery beat), `superset_db` (postgres), `superset_cache` (redis)
- **Web UI:** http://localhost:8088 (admin / admin по умолчанию — поменять в проде)
- **Demo-датасеты НЕ грузятся** (флаг `--with-examples` если нужны)

---

## Prerequisites (на хосте должны стоять)

| Software        | Версия       | Зачем                                  |
| --------------- | ------------ | -------------------------------------- |
| Python          | 3.6+         | сам deploy.py / delta.py               |
| Docker + Compose v2 | latest   | контейнеры                             |
| Git             | latest       | clone / pull                           |
| Node.js         | **20.x**     | npm install / npm build плагинов и фронта |
| zstd            | latest       | webpack uses simple-zstd для bundle compression |

Скрипт сам проверит prerequisites и даст команду установки если чего-то нет.

---

## Linux / Ubuntu — установка с нуля

### 1. Поставить prerequisites

```bash
# Docker (если ещё нет)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # без relogin

# Node 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Остальное
sudo apt install -y git zstd python3 python3-pip
```

Проверка:

```bash
docker --version && docker compose version
node --version    # должно быть v20.x
zstd --version
git --version
python3 --version
```

### 2. Клон + setup

```bash
git clone https://github.com/light050687/superset.git
cd superset
python3 scripts/deploy.py setup --wait-ready
```

Опции:

- `--with-examples` — загрузить demo-датасеты (World Bank, BART и т.п., ~10 MB с CDN). По умолчанию НЕ грузим — на корп-сети медленно/падает, в проде не нужно.
- `--wait-ready` — ждать `superset_app:healthy` (timeout 5 мин) перед завершением.

### 3. Корп-сеть (MITM proxy с подменой TLS-сертификата)

Если организация использует Zscaler / BlueCoat / другой MITM-прокси, нужен корп-CA для npm/git/Node.

```bash
# 1) Получить корп-CA (один из вариантов):
# Linux обычно уже имеет его в /etc/ssl/certs/ca-certificates.crt — отдельно
# вытаскивать не нужно. Если нет — спроси у админа PEM-файл корп-CA.

# 2) Передать в setup:
python3 scripts/deploy.py setup --corp-ca /path/to/corp-ca.pem --wait-ready
```

Альтернатива (НЕБЕЗОПАСНО, dev only):

```bash
python3 scripts/deploy.py setup --corp-tls-off --wait-ready
# strict-ssl=false для npm + http.sslVerify=false для git
# Используй только если нет другого варианта; убери `npm config delete strict-ssl`
# и `git config --global --unset http.sslVerify` после deploy.
```

### 4. Открой UI

http://localhost:8088 → admin / admin → **смени пароль сразу**.

---

## Windows 11 / Windows Server — установка с нуля

### 1. Поставить prerequisites

| Что | Откуда |
| --- | --- |
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Node 20.x      | https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi |
| Git            | https://git-scm.com/download/win |
| Python 3.6+    | https://www.python.org/downloads/ (поставь галочку «Add to PATH») |
| zstd           | https://github.com/facebook/zstd/releases/latest (zstd-vX.Y.Z-win64.zip) |

После установки zstd:

```powershell
# Распакуй в %USERPROFILE%\Tools\zstd\
# Добавь в PATH (User):
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
[Environment]::SetEnvironmentVariable('Path', "$p;$env:USERPROFILE\Tools\zstd", 'User')
# Перезапусти терминал
```

Проверка (PowerShell):

```powershell
docker --version; docker compose version
node --version    # должно быть v20.x
zstd --version
git --version
python --version
```

### 2. Клон + setup

```powershell
git clone https://github.com/light050687/superset.git
cd superset
python scripts\deploy.py setup --wait-ready
```

### 3. Корп-сеть с MITM (типичный случай для Windows-машин в офисе)

Windows автоматически добавляет корп-CA в trust store (`Cert:\LocalMachine\Root`). Скрипт умеет его оттуда экстрактить:

```powershell
python scripts\deploy.py setup --ca-from-windows-store --wait-ready
```

Что произойдёт:

1. PowerShell-helper пройдётся по `Cert:\LocalMachine\Root` и `Cert:\CurrentUser\Root`
2. Отфильтрует well-known CA (DigiCert, VeriSign и т.п.)
3. Соберёт оставшиеся (корп-CA + intermediate proxy) в `%USERPROFILE%\corp-ca-bundle.pem`
4. Подключит в `git config http.sslCAInfo`, `npm config cafile`, `NODE_EXTRA_CA_CERTS`
5. Передаст base64 в Docker через `CORP_CA_CERT_B64` build arg → Dockerfile подкладывает CA в node + python trust store внутри контейнера

Если автоэкстракт не сработал (пустой bundle, всё well-known), есть фолбэк — вручную:

```powershell
$pem = ''
@('Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root') | ForEach-Object {
  Get-ChildItem $_ | Where-Object {
    $_.Issuer -eq $_.Subject -and
    $_.Subject -notmatch "DigiCert|VeriSign|GlobalSign|Microsoft|GoDaddy|Sectigo|Amazon|Comodo|ISRG"
  } | ForEach-Object {
    $pem += "-----BEGIN CERTIFICATE-----`n"
    $pem += [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks)
    $pem += "`n-----END CERTIFICATE-----`n"
  }
}
$pem | Out-File -Encoding ascii -NoNewline corp-ca.pem

python scripts\deploy.py setup --corp-ca corp-ca.pem --wait-ready
```

Размер CA-bundle важен: Win32 ARG_MAX ≈ 32 KB, а полный экспорт trust store ~477 KB **не влезет в env var**. Скрипт делает size guard на `CORP_CA_CERT_B64` (limit 30 000 chars base64) — если больше, упадёт с подсказкой использовать `--ca-from-windows-store` (он фильтрует только корп-CA, обычно 3–10 KB).

### 4. Открой UI

http://localhost:8088 → admin / admin → смени пароль.

---

## Update — обновление работающего стенда

После того как код обновился в `custom/main`:

```bash
# Linux / Mac
cd superset
python3 scripts/deploy.py update --wait-ready

# Windows
cd superset
python scripts\deploy.py update --wait-ready
```

Что делает:

1. `git fetch + pull custom/main` (с auto-stash локальных правок если есть)
2. Пересборка плагинов (`my-plugins/*`)
3. Пересборка frontend (`superset-frontend`)
4. `docker compose down + up -d --build`
5. (опц.) ждать `superset_app:healthy`

Опция `--no-build` — пропустить npm rebuild (если меняется только Python / конфиг):

```bash
python3 scripts/deploy.py update --no-build --wait-ready
```

---

## Delta deploy — быстрый цикл «правка → :8088»

Для итерации над одним плагином без полного пересборки + docker recreate:

```bash
# 1. Сборка только нужного плагина
cd my-plugins/leaderboard
npm run build

# 2. Пересборка frontend (он подхватит обновлённый esm/ плагина)
cd ../../superset-frontend
rm -rf .temp_cache
npm run build

# 3. Delta copy в работающий контейнер (~3 сек)
cd ..
python scripts/delta.py
# или: python3 scripts/delta.py

# 4. Hard refresh в браузере: Ctrl+Shift+R
```

`delta.py` копирует только `.js / .css` файлы из `superset/static/assets/` с `mtime < 5 минут` + `manifest.json`. Без `docker restart` — Flask отдаёт статику напрямую, webpack `[contenthash]` в filename обеспечивает cache-bust.

Опции:

- `--max-age-min N` — порог mtime (default: 5)
- `--container NAME` — имя контейнера (default: `superset_app`)

---

## Troubleshooting

### `superset_app` не стартует — смотри логи

```bash
docker logs superset_init       # init этапы (load_examples, миграции)
docker logs superset_app        # gunicorn / Python ошибки
docker logs superset_worker     # celery воркер
```

### Полная пересборка с нуля (после кардинальных правок Dockerfile)

```bash
cd superset
docker compose -f docker-compose-non-dev.yml down -v   # -v = drop volumes!
docker system prune -af                                # ОСТОРОЖНО: чистит ВСЕ образы
python3 scripts/deploy.py setup --wait-ready
```

⚠ `down -v` сносит данные БД метаданных Superset (дашборды, чарты, пользователи). Делай только если нужно начать с чистой БД.

### `npm install` падает на ERESOLVE peer conflicts

Скрипт уже использует `--legacy-peer-deps`. Если запускаешь npm вручную — добавь флаг:

```bash
cd superset-frontend && npm install --legacy-peer-deps
```

### `npm ci` падает с «lockfile out of sync»

Не используй `npm ci` — используй `npm install`. Лок-файл может расходиться при синке с upstream Apache.

### Корп-CA: TLS errors в build (npm / pip / git)

```
SSL certificate problem: unable to get local issuer certificate
SELF_SIGNED_CERT_IN_CHAIN
```

→ перезапусти setup с корп-CA:

```bash
# Windows
python scripts\deploy.py setup --ca-from-windows-store --wait-ready
# Linux
python3 scripts/deploy.py setup --corp-ca /path/to/ca.pem --wait-ready
# Last resort (dev only)
python scripts/deploy.py setup --corp-tls-off --wait-ready
```

### `superset_init` падает с `KeyError: catalog_folders`

Известный upstream-баг Superset 6.0 при загрузке demo-датасетов. **Не критично** — init продолжается, examples всё равно подгружаются частично. Если запускаешь без `--with-examples` (default), баг не воспроизводится.

### Frontend изменения не видны после `delta.py`

1. **Hard refresh в браузере:** Ctrl+Shift+R (не F5 — обычный refresh не сбрасывает cache)
2. Проверь что mtime файлов свежий: `ls -la superset/static/assets/*.js | head` (Linux) / `Get-ChildItem superset\static\assets\*.js | Sort-Object LastWriteTime -Descending | Select -First 5` (PS)
3. Очисти webpack cache перед build: `rm -rf superset-frontend/.temp_cache superset-frontend/node_modules/.cache`
4. Проверь `data-no-anim` атрибут на плагине если анимация играет 2× — см. CLAUDE.md секция «Анимации»

### Windows: `python` не находит `npm.cmd`

`deploy.py` резолвит через `shutil.which()` (см. функцию `run()` в коде). Если запускаешь npm вручную — используй полный путь:

```powershell
& "$(Get-Command npm | Select -ExpandProperty Source)" install --legacy-peer-deps
```

### Windows: PowerShell ругается на `&&` в командах

PowerShell 5.1 не понимает bash-style `&&`. Используй:

```powershell
# Вместо `cmd1 && cmd2`
cmd1; if ($LASTEXITCODE -eq 0) { cmd2 }
# Или на PowerShell 7+:
cmd1 && cmd2
```

---

## Production checklist

Перед prod-деплоем:

- [ ] Смени `admin/admin` пароль в Superset UI (Settings → List Users)
- [ ] Сгенерируй `SECRET_KEY` в `docker/.env-local`:
      `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] Сгенерируй уникальные пароли БД (`POSTGRES_PASSWORD`, `SUPERSET_DB_PASSWORD`) в `docker/.env-local`
- [ ] Настрой бэкап `db_home` volume (postgres data) — расписание pg_dump
- [ ] Поставь HTTPS termination перед `:8088` (nginx / Traefik / Caddy)
- [ ] Закрой `:8088` от внешки firewall'ом, оставь только через reverse proxy
- [ ] Если корп-сеть: убери `CORP_CA_CERT_B64` из `.env-local` после build (нужен только для docker build, не runtime)
- [ ] `--corp-tls-off` — снять после deploy:
      `git config --global --unset http.sslVerify`
      `npm config delete strict-ssl`
- [ ] Healthcheck monitoring: `docker inspect superset_app --format '{{.State.Health.Status}}'`
- [ ] Логи: `docker logs --since 1h superset_app` — мониторинг ошибок (можно через journald/loki)

---

## Структура файлов

```
superset/
├── scripts/
│   ├── deploy.py          # setup / update подкоманды
│   ├── delta.py           # delta deploy в running контейнер
│   └── README.md          # этот файл
├── docker/
│   ├── .env               # default (committed) — НЕ меняй
│   └── .env-local         # local overrides (gitignored) — пиши сюда
├── docker-compose-non-dev.yml   # prod-like compose (multi-container, gunicorn)
├── Dockerfile             # multi-stage: node-ci → node-build → python-base → lean / dev / ci
├── my-plugins/            # наши кастомные viz-плагины
│   ├── leaderboard/
│   ├── metricTimeSeries/
│   └── ...                # 10 плагинов
└── superset-frontend/     # React/TS фронт Apache Superset (мы тоже патчим)
```
