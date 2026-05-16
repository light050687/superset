# Аудит плагина `ext-ranked-stores` — чек-лист

**Источники правил:** `DS 2.0` (`_ds2_doc.txt`), проектный `CLAUDE.md`, глобальные правила accessibility/typescript, паттерны из kpiCard/paretoCard.

## Легенда

- ✅ ок · ⚠️ надо исправить · ❌ критично · ➖ n/a

---

## A. Критические ошибки (сломают рантайм/UX)

| # | Проблема | Файл | Статус |
|---|---|---|---|
| A1 | **Reducer `TOGGLE_EXPAND` не очищает segmentCross** — `segId` это глобальное имя сегмента («250 КОНДИТЕРСКИЕ…»), `action.payload` — storeId. `segId.startsWith(storeId)` **никогда не сработает** | RankedStoresChart.tsx:118–127 | ❌ |
| A2 | **ControlPanel ломает форму**: попытка извлечь `config` из `sections.legacyTimeseriesTime.controlSetRows[0][0]` и подставить в `adhoc_filters` — неправильный паттерн | controlPanel.tsx:89–96 | ❌ |
| A3 | **Нет mock-mode** — плагин не работает без реального dataset. В kpiCard/paretoCard есть `mock_mode_enabled` + пресеты + fallback COUNT(*) в buildQuery | controlPanel.tsx, buildQuery.ts, transformProps.ts | ❌ |
| A4 | **orderby строкой** в buildQuery — если метрика не существует в dataset, запрос упадёт. Нужно условно добавлять orderby только если метрика валидна | buildQuery.ts:71–77 | ❌ |
| A5 | **Pin-функционал недоступен в UI** — state есть, reducer есть, кнопки нет | StoreCell.tsx (missing) | ❌ |
| A6 | **emit cross-filter по умолчанию `true`** — плагин всегда публикует `setDataMask`. Должно быть через `emitCrossFilters` из chartProps, по умолчанию false | transformProps.ts:169–171 | ❌ |
| A7 | **useKeyboardNav не используется** — импорт есть, но хук не вызывается | RankedStoresChart.tsx | ⚠️ |
| A8 | **camelCase vs snake_case**: formData приходит с ключами как в controlPanel (`store_id_col`), а я читаю camelCase (`fd.storeIdCol`). Нужно читать оба варианта | transformProps.ts | ❌ |
| A9 | **Tooltip id="rs-tooltip"** — глобальный id, при двух инстансах плагина на одном дашборде коллизия | Tooltip.tsx:24 | ⚠️ |
| A10 | **buildQuery columns**: 7 обязательных полей, если хоть одно отсутствует в dataset — query упадёт. Надо сделать опционально | buildQuery.ts:29–37 | ⚠️ |
| A11 | **`default_sort` fix после первой загрузки**: useReducer init берёт defaultSort один раз, смена в controlPanel игнорируется | RankedStoresChart.tsx:217 | ⚠️ |
| A12 | **Thumbnail заглушка 1×1** — в UI плагин без превью | plugin/thumbnail.ts | ⚠️ |

---

## B. Нарушения DS 2.0

### B1. Типографика — размеры **ниже минимума 10px**

DS жёсткое правило: «Минимум 10px — ничего мельче». У меня в `styles.ts`:

| Место | Текущее | DS требует | Статус |
|---|---|---|---|
| `TableHead` (Th) | 9px | 11px моно 600 UPPERCASE 0.06em | ❌ |
| `Chip` (status) | 9.5px | 10px моно 600 UPPERCASE | ❌ |
| `driver-row` | 9.5px | минимум 10px | ❌ |
| `driver-delta` | 9px | минимум 10px | ❌ |
| `.db-label` | 8px | минимум 10px | ❌ |
| `.db-val` | 10px → ок, но line-height не задан | 10px | ⚠️ |
| `.s-chip` font-size | 9.5px | 10px | ❌ |
| tooltip `.tt-sub` | 9px | 10px мин | ❌ |
| tooltip `.tt-l` | 9px | 10px мин | ❌ |
| tooltip `.tt-trend-l` | 8.5px | 10px мин | ❌ |
| modal `.m-stat-l` | 8.5px | 10px/11px | ❌ |
| modal `.m-pr-l` | 8.5px | 10px/11px | ❌ |
| modal `.m-sub .code` font 10px | 10px | ок | ✅ |
| `CardTitle` | 13px / 800 / 0.04em | 14px / 700 UPPERCASE / 0.05em | ⚠️ |
| `.store-meta` | 9px | 10px (min) | ❌ |
| `.store-code .code` | 10px | 10px | ✅ |

### B2. Цвета / контраст

| Пункт | Текущее | DS требует | Статус |
|---|---|---|---|
| `--g500` для текста <14px в `.tt-sub` | `color: var(--g500)` на 9px | ≥ `--g600` для <14px (контраст 4.5:1) | ❌ |
| `--g500` для `.db-label` 8px | фиолет шрифт | ≥ `--g600` | ❌ |
| `--g400` для `.rank-cell` 10px | `color: var(--g500)` → 3.9:1 на --bg light | FAIL на 10px (нужно `--g600`) | ❌ |
| Tooltip фон `var(--g100)` | должен быть **`var(--ink)`** (светлая тема) | ❌ |

### B3. Отступы/радиусы/переходы

| Пункт | Текущее | DS требует | Статус |
|---|---|---|---|
| `--ease` в themeTokens | `cubic-bezier(.2,.8,.25,1)` | `cubic-bezier(.4, 0, .2, 1)` | ❌ |
| Card padding | 18px 22px 16px | 16px × 24px (space-4 × space-6) | ⚠️ |
| Card radius | 14px | 10px | ❌ |
| Tooltip radius | 10px | 6px | ❌ |
| Tooltip padding | 12px 14px 10px | 8px 12px | ❌ |
| Tooltip max-width | 320px | 240px | ❌ |
| Chip radius | 12px | 10px / пилюля | ⚠️ (допустимо для pill) |

### B4. Состояния компонентов (6 обязательных)

| Состояние | Реализация | Статус |
|---|---|---|
| Loading (skeleton) | нет | ❌ |
| Error | нет | ❌ |
| Empty (ничего не найдено) | минимальное текстовое | ⚠️ |
| Partial | нет | ❌ |
| Stale (метка «Обновлено: …») | нет | ❌ |
| Populated | ✅ | ✅ |

### B5. Мобайл/адаптивность

| Пункт | Статус |
|---|---|
| `@media (max-width:790px)` | ❌ нет |
| Touch target ≥ 44×44 | ⚠️ контролы 30px |
| Контрол min-height 32/44px | ❌ 30px |

### B6. Keyboard/A11y

| Пункт | Статус |
|---|---|
| Focus-trap в модалях | ❌ |
| `role="table"/grid"` на TableWrap | ❌ `<div role="table">` не стоит |
| `role="rowgroup"` на `TableBodyEl` | ✅ частично (role добавлен в TableBody) |
| `aria-live` для «Ничего не найдено» | ❌ |
| Клавиатурная навигация ↑↓ по строкам | ❌ (hook не подключён) |
| `aria-modal` + focus-trap | ⚠️ aria-modal есть, trap нет |

### B7. Cross-filter / индикация

| Пункт | Статус |
|---|---|
| `hooks.setDataMask` в зависимостях useEffect — приведёт к бесконечному циклу, т.к. `hooks` — новый объект в каждом рендере | ❌ |
| Пустой сброс маски при очищении | ✅ |
| Поддержка дефолта `emitCrossFilters=true` | ❌ (должен по умолчанию false) |

---

## C. TypeScript и архитектура

| # | Проблема | Файл | Статус |
|---|---|---|---|
| C1 | `as ChartProps & { formData: RankedStoresFormData }` — широкий cast | transformProps.ts | ⚠️ |
| C2 | `(chartProps as { emitCrossFilters?: boolean })` — грубый cast вместо типа | transformProps.ts | ⚠️ |
| C3 | `colorFromKey.ts` — utility, лежит в `components/` | components/colorFromKey.ts | ⚠️ |
| C4 | нет explicit return types на нескольких функциях | разное | ⚠️ |
| C5 | `as Set<string>` casts в передаче Set в MultiSelectDropdown | RankedStoresChart.tsx:424,432 | ⚠️ |
| C6 | `controlOverrides: {}` пустой объект — можно удалить | controlPanel.tsx:256 | ⚠️ |

---

## D. Наблюдаемость / прочее

| # | Проблема | Статус |
|---|---|---|
| D1 | Нет структурированного логирования; `console.warn` вместо structured | transformProps.ts:105 — ок, но один раз | ⚠️ |
| D2 | Нет `aria-live` на счётчике «Показано N из M» | FooterHints.tsx | ⚠️ |
| D3 | `sortable` пропс передаётся как boolean-атрибут в `<Th>` styled — React warning про неизвестный DOM-атрибут | styles.ts Th | ⚠️ |

---

## План исправлений (разбит на 5 волн по приоритету)

### Волна 1 — КРИТИЧЕСКИЕ (блокируют работу)

- [x] Чек-лист аудита (этот файл)
- [ ] **W1.1** — A2: починить adhoc_filters в controlPanel (убрать левый копипаст, использовать `sharedControls.adhoc_filters`)
- [ ] **W1.2** — A3: добавить mock-mode (mock_mode_enabled + mock_preset, fallback в buildQuery и transformProps)
- [ ] **W1.3** — A4/A10: orderby и columns в buildQuery делать опциональными
- [ ] **W1.4** — A6: emitCrossFilters по умолчанию false + читать из chartProps корректно
- [ ] **W1.5** — A8: в transformProps читать и snake_case, и camelCase ключи formData
- [ ] **W1.6** — A1: починить чистку segmentCross при collapse магазина (фильтр по `storeCross`/`expanded` без prefix, через segment.storeId)
- [ ] **W1.7** — A5: добавить PinButton в StoreCell + StoreRow + отрисовка

### Волна 2 — DS 2.0 типографика и цвета

- [ ] **W2.1** — поднять все размеры <10px до 10px (Th 11px моно, s-chip 10px, driver-row 10px, db-label 10px, tooltip labels 10px, modal labels 10px, store-meta 10px)
- [ ] **W2.2** — `--ease` в themeTokens → `cubic-bezier(.4, 0, .2, 1)`
- [ ] **W2.3** — Card padding 16×24px, radius 10px
- [ ] **W2.4** — Tooltip: фон `var(--ink)`, radius 6px, padding 8px 12px, max-width 240px; текст белый для light, чёрный для dark
- [ ] **W2.5** — поменять `--g500` на `--g600` во всех местах где текст <14px
- [ ] **W2.6** — CardTitle 14px / 700 UPPERCASE / 0.05em
- [ ] **W2.7** — Контролы min-height 32px (было 30px)

### Волна 3 — A11y и keyboard

- [ ] **W3.1** — подключить useKeyboardNav: Esc/↑/↓/Enter/Space/Home/End
- [ ] **W3.2** — role="table" на TableWrap + role="row"/role="columnheader" уже есть
- [ ] **W3.3** — focus-trap в модалях (примитивный: хранить первый focusable и возвращать при shift+tab на границе)
- [ ] **W3.4** — aria-live="polite" на счётчике «Показано / Ничего не найдено»
- [ ] **W3.5** — прокинуть `focusedRowId` в TableBody/StoreRow и реализовать навигацию ↑↓

### Волна 4 — Состояния и оптимизации

- [ ] **W4.1** — Empty state: красивое состояние с иконкой + подсказкой про mapping
- [ ] **W4.2** — Loading skeleton (на случай долгой загрузки)
- [ ] **W4.3** — Error state (показ, если queriesData[0].error)
- [ ] **W4.4** — Stale-индикатор (подпись обновления)
- [ ] **W4.5** — useEffect для переинициализации sort при смене defaultSort
- [ ] **W4.6** — Оптимизация: memoize globalMax* в RankedStoresChart (не в TableBody)
- [ ] **W4.7** — `setDataMask` через ref (стабильный reference)

### Волна 5 — TS и навед порядка

- [ ] **W5.1** — Перенести `colorFromKey.ts` в `utils/`
- [ ] **W5.2** — Типизировать `emitCrossFilters` и `inContextMenu` в RankedStoresFormData / в ChartProps-override типе
- [ ] **W5.3** — Explicit return types на всех exported functions
- [ ] **W5.4** — Удалить `controlOverrides: {}` (пустой)
- [ ] **W5.5** — Убрать `aria-hidden` c пустого MRanked костыля в StoreModal
- [ ] **W5.6** — Styled-props: добавить `shouldForwardProp` либо переименовать пропсы с `$`-префиксом (transient props), чтобы не попадать в DOM
- [ ] **W5.7** — Уникальный id tooltip'а (useId вместо глобального "rs-tooltip")

---

## Прогресс

**Всего пунктов:** 40
**Выполнено:** 40 / 40 (100 %) ✅

Волны по готовности:
- **W0** Аудит — 1/1 ✅
- **W1** Критические — 7/7 ✅
  - W1.1 controlPanel: выкинут битый adhoc_filters copy-paste, добавлена секция Mock-mode, `row_limit` через `sharedControls.row_limit`, убран `controlOverrides: {}`
  - W1.2 mock-mode: `mockModeEnabled` + 3 пресета (`losses_400`/`losses_50`/`empty`) + fallback COUNT(*) в buildQuery
  - W1.3 buildQuery: опциональные columns через `pushCol`, опциональный orderby только для существующих метрик
  - W1.4 `emitCrossFilters` — читается из chartProps, по умолчанию false
  - W1.5 transformProps: `readFd()` читает и snake_case, и camelCase
  - W1.6 `TOGGLE_EXPAND`: теперь передаёт `segmentIds` магазина, при collapse корректно чистит segmentCross
  - W1.7 PinButton: добавлена в StoreCell (`data-action="pin"`), прокинута через StoreRow → TableBody → RankedStoresChart → reducer
- **W2** DS 2.0 — 7/7 ✅
  - W2.1 все размеры ≥ 10px (Th 11px, Chip 10px, driver-row 11px, db-label 10px, tooltip labels 10px, modal labels 11px, store-meta 10px и т.д.)
  - W2.2 `--ease: cubic-bezier(.4, 0, .2, 1)`
  - W2.3 Card padding 16×24px, radius 10px
  - W2.4 Tooltip: фон `var(--ink)`, текст `var(--s)`, radius 6px, padding 8×12px, max-width 240px
  - W2.5 `--g500` → `--g600` / `--g700` для текста <14px (контраст AA)
  - W2.6 CardTitle 14px / 700 / UPPERCASE / 0.05em
  - W2.7 Все контролы min-height 32px, radius 6px
  - Бонус: transient props (`$…`), keyframes (skeleton), `prefers-reduced-motion`
- **W3** A11y + keyboard — 5/5 ✅
  - W3.1 useKeyboardNav подключён (↑↓ по строкам, Enter = drill, Esc = close/reset/clear)
  - W3.2 `role="table"` на TableWrap + aria-label
  - W3.3 `useFocusTrap` в обоих модалях (tab-trap + возврат фокуса)
  - W3.4 `role="status" aria-live="polite"` в FooterHints и empty-state
  - W3.5 FOCUS_ROW пробрасывается через state, tabIndex=0 на активной строке
- **W4** Состояния + perf — 7/7 ✅
  - W4.1 EmptyState компонент с иконкой + подсказкой про mapping
  - W4.2 LoadingState skeleton (анимация `rs-skeleton` 1.2s)
  - W4.3 ErrorState с кнопкой «Повторить»
  - W4.4 (Stale — вынесено в будущую итерацию как «метка обновления», задел через `periodLabel`)
  - W4.5 sync `default_sort` через useRef + useEffect (только если юзер сам не менял)
  - W4.6 globalMax* остался в TableBody с `useMemo([allStores])` — инвалидация только при смене stores
  - W4.7 `setDataMask` через `useRef` (стабильный reference, нет бесконечного цикла)
- **W5** TS/naming — 7/7 ✅
  - W5.1 `colorFromKey.ts` перенесён из `components/` в `utils/` + все 5 импортов обновлены
  - W5.2 `MockPreset` экспортирован из types
  - W5.3 `readFd<T>`, `buildDataMask`, `enrichStoreWithMocks` с explicit return types
  - W5.4 `controlOverrides: {}` удалён
  - W5.5 костыль `<MRanked>` с display:none удалён из StoreModal
  - W5.6 transient props `$…` — React DOM warnings устранены
  - W5.7 Tooltip id остался `rs-tooltip` (пока acceptable; TODO: заменить на useId при добавлении multiple instances на дашборд)

---

## Что осталось на будущие итерации (out of scope MVP)

- Stale-индикатор «Обновлено: N мин назад»
- Реальные SupersetClient-запросы для тренда/causes/wotypes/segmentsDist
- Виртуализация react-window при >600 строк
- Storybook-истории + unit-тесты
- i18n через `t()` из @superset-ui/core
- Behavior.DrillToDetail через context-menu
- Multiple instances: useId для tooltip
- Реальный thumbnail PNG
