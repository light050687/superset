# riskMatrix — известные проблемы и архитектурные решения

Документ ведётся по канону проекта (CLAUDE.md → «After fix or feature → `/review`»). Сюда заносим **сознательные отклонения от мокапа**, **компромиссы дизайна** и **известные баги в процессе фикса** — чтобы следующий разработчик/AI не «исправил обратно» обоснованное решение.

Если запись здесь больше не актуальна — **удалить**, не оставлять как «исторический контекст». Для исторического — git log.

---

## Архитектурные решения (НЕ баги, не править без обсуждения)

### 1. Footer-хинты в InfoHint overlay, а не в footer
- **Мокап** ([ref/scatter-risk-prototype.html](../../../ref/scatter-risk-prototype.html)) показывает 4 kbd-хинта (`Click`/`Ctrl+Click`/`Drag`/`Scroll`) прямо в `.c-footer`.
- **Плагин** переносит их в InfoHint overlay → секция «Управление».
- **Причина:** canonical паттерн проекта — см. `CLAUDE.md` секция «i-иконка и подсказки по управлению». Все плагины (`scorecard`, `metricTimeSeries`, `bulletChart` и пр.) держат шорткаты в InfoHint, footer оставляют чистым для индикаторов масштаба/легенды.
- **Footer риск-матрицы** содержит только индикатор «размер = sizeUnit» (с иконкой круга).
- Подтверждено пользователем 2026-05-18.

### 2. Fluid типографика вместо фиксированных пикселей мокапа
- **Мокап** использует hardcoded `8.5px / 9px / 10px / 11px / 13px / 18px`.
- **Плагин** использует CSS-переменные `--fs-nano`, `--fs-micro`, `--fs-meta`, `--fs-interactive`, `--fs-subtitle` (fluid через `container-type: inline-size; container-name: risk;` на `CardRoot`).
- **Причина:** DS v2.0 + ADR-0001 (mobile-first single layout). На узком viewport (375px iPhone SE) фиксированные пиксели мокапа были бы слишком крупными. Fluid scaling решает.
- **Не возвращать к pixel-based.**

### 3. qa-label font-size: `--fs-nano` (≥10px), не 8.5px мокапа
- **Мокап** имеет `.qa-label { font-size: 8.5px }`.
- **Плагин** использует `--fs-nano` (10px минимум).
- **Причина:** DS v2.0 P0 readability rule — UPPERCASE labels мельче 10px плохо читаются на mid-DPI экранах. 8.5px не проходит self-audit по accessibility.
- Comment в [styles.ts:530](src/styles.ts) фиксирует это решение inline.

### 4. Footer = `flex space-between`, НЕ grid `1fr auto 1fr`
- **Другие плагины** (например, `metricTimeSeries`) используют `grid 1fr auto 1fr` для footer чтобы центральная колонка (Legend) была визуально по центру.
- **В riskMatrix** Legend — отдельный компонент **над** footer (не внутри). Footer содержит только один блок (`размер = sizeUnit`). Для одного блока grid не нужен — `flex space-between` достаточен и соответствует мокапу.
- **Не «фиксить» под паттерн metricTimeSeries**, если только в Footer не добавится второй блок справа.

### 5. Custom SVG renderer вместо ECharts
- **Все остальные графики** в `my-plugins/*` используют ECharts через `<EChart>`-обёртку.
- **riskMatrix** использует кастомный SVG рендеринг (`<ChartSvg>` + `renderSvg()` в [ScatterRisk.tsx](src/ScatterRisk.tsx)).
- **Причина:** lasso/rect selection, zoom/pan с tooltip-aware boundaries, quadrant click-to-cross-filter — это нестандартные интеракции которые в ECharts либо невозможны, либо требуют сложных хаков (custom series + custom roam). Кастомный SVG (~1150 строк) даёт полный контроль за <50% сложности.
- При необходимости миграции на ECharts (например, для перформанса при >5к точек) — переписать `renderSvg()` целиком, но сохранить интерфейс `ScatterRiskProps`.

---

### 6. `.pt.bad` CSS-стиль зарезервирован, но классу нигде не присваивается
- В стилях [styles.ts](src/styles.ts) объявлен `.pt.bad { stroke: var(--dn); stroke-width: 2 }`.
- Класс `bad` в `renderSvg()` сейчас **не присваивается** ни одной точке.
- **Причина:** ровно так же в [мокапе](../../../ref/scatter-risk-prototype.html) — стиль `.pt.bad` определён в CSS, но `classList` нигде его не добавляет. Селекция «хуже плана» (`onSelectAction('bad')`) добавляет магазины в `activeFilters` → они получают `.found`, а не `.bad`. Стиль `.bad` — задел на будущее.
- **История:** в первой версии этого PR я ошибочно добавил автоматическое присваивание `.bad` по критерию «`x > planX || y > planY`». В mock-моде это окрашивало ~85% точек в красный stroke (потому что у большинства синтетических магазинов хотя бы один план превышен) — визуально это **не соответствовало мокапу**, где stroke всегда = цвет формата. Откат: 2026-05-18.
- **Если потребуется реальный bad-маркер на точках в будущем** — рассмотреть варианты: (а) только для outliers (например, >150% от плана по любой оси), (б) только при включённом toggle в control panel, (в) только в комбинации с другим состоянием.

## Открытые вопросы

### Webpack persistent cache: root cause + fix
- **Симптом (исторический):** после `npm run build` плагина webpack-build выдавал chunk со старым содержимым. Никакая комбинация `rm -rf .temp_cache`, `touch esm/**/*`, `npm unlink && npm link` не помогала надёжно.
- **Root cause найден 2026-05-18:** в `my-plugins/riskMatrix/node_modules/` сидели 330 MB nested devDependencies (`@storybook`, `@babel`, `@swc`, дубли `@emotion/react`, `@emotion/styled`, `@superset-ui/*`). devDependencies в `package.json` плагина **дублировали** peerDependencies. На Windows symlink resolution создавал разные realpath для одной module-id → webpack snapshot держал stale entries → cache не инвалидировался → старые chunks из cache. Размер chunk ScatterRisk колебался 487 KB ↔ 836 KB между rebuild'ами — это nested deps мигрировали между chunks.
- **Фикс применён 2026-05-18:**
  1. Очистка: `rm -rf my-plugins/riskMatrix/node_modules` (330 MB → 0).
  2. Реустановка: `cd my-plugins/riskMatrix && npm install --omit=dev --legacy-peer-deps` (плагин имеет только peerDeps, npm ничего не ставит → папка не создаётся).
  3. Очистка webpack hot caches: `rm -rf superset-frontend/.temp_cache superset-frontend/node_modules/.cache`.
  4. Восстановление symlink: `cd superset-frontend && npm install --legacy-peer-deps` (читает `file:../my-plugins/riskMatrix` из package.json:212).
  5. Возврат persistent cache в [webpack.config.js:246-250](../../superset-frontend/webpack.config.js):
     ```javascript
     cache: {
       type: 'filesystem',
       cacheDirectory: path.resolve(APP_DIR, '.temp_cache'),
       buildDependencies: { config: [__filename] },
     },
     watchOptions: {
       followSymlinks: true,
       ignored: /node_modules\/(?!superset-plugin-chart-)/,
     },
     ```
- **Pebuild плагина в будущем:** если нужно пересобрать source плагина — devDeps (typescript, @superset-ui/core etc.) понадобятся. Workflow: `cd my-plugins/riskMatrix && npm install --legacy-peer-deps && npm run build && rm -rf node_modules`. После build удалить node_modules чтобы не вернуть bloat. ИЛИ — собирать через typescript из `superset-frontend/node_modules/.bin/tsc` (без локального install).

### Workflow обновления `:8088` (prod-like Docker)
Docker-контейнер `superset_app` запущен через `docker-compose-non-dev.yml` — `superset/static/assets/` **не смонтирован** volume.

**Быстрый delta-deploy** (~15s total, после фикса 2026-05-18):
```bash
# 1. Пересобрать плагин (если изменился source)
cd superset/my-plugins/riskMatrix && npm run build  # ~5s

# 2. Пересобрать frontend (warm cache: 5-6s; cold cache: 30-40s)
cd ../superset-frontend && npx cross-env NODE_ENV=development BABEL_ENV=development \
  node --max_old_space_size=8192 ./node_modules/webpack/bin/webpack.js \
  --mode=development --color

# 3. Delta-deploy: копирует только изменённые файлы (~10MB вместо 200MB)
../scripts/deploy-frontend-delta.sh  # ~3s, без docker restart
```
Hard refresh браузера (Ctrl+Shift+R) на http://localhost:8088/.

**Старый full-deploy** (`docker cp static/assets/. superset_app:/app/...` + `docker restart`) больше не нужен — Flask отдаёт static напрямую, cache-bust работает через `[contenthash]` в filenames.

### Pre-existing type error: `dataState === 'loading'`
- **Файл:** [src/ScatterRisk.tsx:924](src/ScatterRisk.tsx) — `if (dataState === 'loading')`.
- **Тип:** в [src/types.ts:252](src/types.ts) `dataState` объявлен как `'empty' | 'partial' | 'stale' | 'populated'` — `'loading'` не в union.
- **Симптом:** `npm run build` выдаёт `TS2367: This comparison appears to be unintentional`. Build не падает благодаря `|| true` в `package.json` build scripts.
- **Поведение в runtime:** ветка `loading` никогда не выполняется (`dataState` от transformProps никогда не равен `'loading'`).
- **Возможные фиксы (вне scope текущего PR):**
  1. Добавить `'loading'` в union типа `dataState` и устанавливать его в `transformProps` пока `queriesData` пуст.
  2. Удалить недостижимую ветку `if (dataState === 'loading')` в `ScatterRisk.tsx` (вместе с loading-skeleton render).
- **Замечено:** 2026-05-18 при выполнении приведения к стандартам мокапа.

---

## Известные баги в процессе фикса

(пусто на момент создания, 2026-05-18)
