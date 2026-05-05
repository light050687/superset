# Audit: ext-heatmap-pivot vs DS 2.0

Дата: 2026-04-15
Источники: `Superset_Design_System_v2_0_RU.docx`, `_ds2_doc.txt`, `DS2_COMPLIANCE_CHECKLIST.md`, проектный `CLAUDE.md`, `~/.claude/rules/*.md`.

## Итог: 16 / 16 (100%) ✅

| # | Категория | Что | Статус |
|---|---|---|---|
| 1 | 🔴 Типографика | Title 12px → **14px** / 700 / UPPERCASE / 0.05em (DS §02 «Заголовок секции») | ✅ |
| 2 | 🔴 Типографика | Breadcrumb 9px → **11px моно / 400 / --g600** (DS §02 «Подзаголовок/мета», §10) | ✅ |
| 3 | 🔴 Типографика | Заголовок столбца pivot: пропорц. 11/700 → **11px моно / 600 / UPPERCASE / 0.06em** (DS §02 «Заголовок столбца») | ✅ |
| 4 | 🔴 A11y | Цвет nd-ячейки `--g400` (2.6:1, fail WCAG) → **`--g600`** (5.9:1, pass) (DS §10) | ✅ |
| 5 | 🔴 A11y | `--g500` в footer/breadcrumb/HintBar/UnitButton/Chip (запрет для <14px) → **`--g600`** (DS §10) | ✅ |
| 6 | 🔴 Touch | Кнопки `min-height: 30px` → **32 desktop / 44 tablet / 48 mobile** (DS §02 «Адаптивная типографика») | ✅ |
| 7 | 🔴 Состояния | Skeleton shimmer opacity `0.12-0.22` за 1.4s → **`--g100` 0.4-0.7 за 0.8s** + `aria-busy="true"` (DS §08) | ✅ |
| 8 | 🔴 A11y / WCAG 1.4.1 | Цвет = единственный индикатор → **+иконка-символ в углу** (✓ ok / △ wn / ▲ dn) (DS §07) | ✅ |
| 9 | 🟡 Tooltip | Offset `12px` → **`8px`** от курсора (DS §08) | ✅ |
| 10 | 🟡 Локализация | Проценты default `decimals=2` → **`decimals=1`** (DS §11) | ✅ |
| 11 | 🟡 Локализация | Дельта `+14,8%` → **`+14,8% ↑`** со стрелкой (DS §11) | ✅ |
| 12 | 🟡 A11y | `prefers-reduced-motion`: отключение анимаций (DS §08, WCAG 2.3.3) | ✅ |
| 13 | 🟡 Печать | `@media print`: фоны → белый, скрыть кнопки/тултипы, `page-break-inside: avoid` (DS §14) | ✅ |
| 14 | 🟢 Корректность | `rowAxisLabel` / `colAxisLabel` динамические в mock-fallback | ✅ |
| 15 | 🟢 DS §06 | Card padding `16px 20px 14px` → `16px 20px` (равномерно space-4 × space-6) | ✅ |
| 16 | 🟢 DS §02 | Cell font-size: 12px desktop + **13px tablet/mobile** (responsive). Сознательное отклонение от рекомендации 13-14px ради компактности — задокументировано в комментарии. | ✅ |

## Верификация

- ✅ TypeScript: чисто (только ожидаемые `Cannot find module @superset-ui/core` — резолвится в webpack)
- ✅ Jest: **22 / 22** (добавлено 2 новых теста для `formatRussianPercent` default + `formatRussianDeltaPercent` со стрелкой)
- ✅ Storybook build: 7 stories собрались без ошибок

## Не в скоупе v1 (зафиксировано в memory)

- Виртуализация `react-window` (DS §14: 15-20 видимых строк) — добавить в v2 при росте таблицы выше ~30 строк
- Серверные Σ-итоги — клиентский reduce работает только для SUM-метрик
- Tab-switcher осей в шапке (Дивизион/Регион/...) — заменено на фильтры дашборда по решению пользователя
- Шрифты Manrope/JetBrains Mono — глобальная проблема Superset (`@fontsource/*` не установлены), не плагина
- `prefers-contrast: more` — не реализовано в Superset глобально, не в плагине

## Изменённые файлы

| Файл | Кол-во правок |
|---|---|
| `src/styles.ts` | 13 (типографика, цвета, touch, skeleton, иконки, print, padding, cell) |
| `src/HeatmapPivot.tsx` | 5 (StatusIcon, aria-busy, aria-label на ячейках, tooltip offset) |
| `src/utils/formatRussian.ts` | 2 (default decimals=1, дельта со стрелкой) |
| `src/plugin/transformProps.ts` | 2 (mock overrides для labels) |
| `src/plugin/controlPanel.tsx` | 1 (обновлено описание decimals) |
| `test/formatRussian.test.ts` | 2 (новые тесты) |
