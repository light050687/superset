# my-plugins vendor bundle

Кастомные плагины (`my-plugins/scorecard`, `paretoAnalysis`, `drilldownDonut`, `bulletChart`,
`divergingBars`, `rankedBars`, `pivotHeatmap`, `riskMatrix`, `metricTimeSeries`, `leaderboard`)
исключены из git через `.gitignore`. На чистом клоне репо webpack не находит их и билд
падает с `Module not found: Error: Can't resolve 'superset-plugin-chart-*'`.

Этот tarball содержит полный source + скомпилированные `lib/`/`esm/` для всех 10 плагинов
(без `node_modules/`, `*.tsbuildinfo`, `.cache/`). Распаковывается в `superset/my-plugins/`
и подхватывается webpack через volume mount `./my-plugins:/app/my-plugins`.

## Установка на новом компе

```cmd
cd C:\path\to\superset_dev\superset

REM 1. Снести битую/пустую копию my-plugins (если есть)
rmdir /S /Q my-plugins

REM 2. Распаковать архив (создаст my-plugins/ в superset/)
tar -xzf .vendor\my-plugins-bundle.tar.gz
```

`tar` идёт встроенно в Windows 10 build 17063+ и Windows 11 — отдельной установки не надо.

После распаковки убедиться, что в каждой папке плагина есть `package.json`:

```cmd
docker compose run --rm superset-node ls /app/my-plugins/scorecard
```

Должно показать `package.json src lib esm tsconfig.json …`.

## Дальнейшая сборка

```cmd
docker compose run --rm -e NPM_CONFIG_STRICT_SSL=false -e PUPPETEER_SKIP_DOWNLOAD=true superset-node bash -c "cd /app/superset-frontend && rm -rf node_modules/superset-plugin-chart-* && npm install --legacy-peer-deps --force"

docker compose run --rm -e AI_BACKEND_URL=http://dataru-saod-llm02-vm.samberi.com:8080 -e SKIP_TS_CHECK=1 superset-node bash -c "cd /app/superset-frontend && npm run build"

docker compose restart superset nginx
```

## Обновление архива (только на dev-машине, где есть полные source)

```bash
cd /path/to/superset_dev
tar --exclude='*/node_modules' \
    --exclude='*.log' \
    --exclude='*.tsbuildinfo' \
    --exclude='.cache' \
    -czf superset/.vendor/my-plugins-bundle.tar.gz \
    my-plugins/

cd superset
git add .vendor/my-plugins-bundle.tar.gz
git commit -m "chore(vendor): refresh my-plugins-bundle"
git push
```
