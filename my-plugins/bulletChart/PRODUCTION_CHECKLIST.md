# Bullet Chart Plugin — Production Checklist

## 1. Код и сборка

- [ ] `npm run build` → 0 errors (peer-dep warnings допустимы)
- [ ] Тесты проходят — `npx jest` (пока не написаны)
- [x] Нет `console.log`/`console.warn` — только `console.error` в ErrorBoundary (structured JSON)
- [x] Нет TODO/FIXME/HACK в коде
- [x] Нет hardcoded URLs и секретов
- [x] Нет `as any` без обоснования (`as unknown as X` для Superset props — отмечено)
- [x] Нет empty catch — `fetchDetailRows` пробрасывает ошибку в UI

## 2. Шесть обязательных DataState (DS 2.0)

- [x] **Loading** — `Skeleton` pulse animation
- [x] **Error** — красная иконка + сообщение + role="alert"
- [x] **Empty** — «Нет данных» + подсказка про настройку метрики
- [ ] **Partial** — пока не реализовано (ждёт multi-query сценариев)
- [ ] **Stale** — пока не реализовано (refresh-bar)
- [x] **Populated** — полноценный рендер

## 3. React надёжность

- [x] **ErrorBoundary** — `BulletErrorBoundary` class component, structured лог
- [x] **React.memo** — `BulletBar`, `Sparkline`, `BulletRow`
- [x] **Cleanup в useEffect** — `fetchDetailRows` cancel flag, keydown listener removed, click-outside в `SortMenu`
- [x] **No memory leaks** — все подписки отменяются
- [x] **Key props** — уникальные `key` в списках (`row.id`, `${name}-${i}`)

## 4. Superset интеграция

- [x] **buildQuery.ts** — валидный SQL, snake_case, дедупликация метрик, 1 или 2 queries
- [x] **transformProps.ts** — camelCase + snake_case нормализация, guards для `queriesData?.[0]?.data`
- [x] **controlPanel.tsx** — 6 секций, все русские labels через `t()`, `visibility` для условных контролов
- [x] **validators: []** — в mock-mode метрики не обязательны
- [x] **renderTrigger** — для визуальных настроек (direction, decimals, sort, filter)
- [x] **peerDependencies** — @superset-ui/core, @superset-ui/chart-controls, @emotion/react, @emotion/styled, react, react-dom
- [x] **file: protocol** — `"superset-plugin-chart-bullet": "file:../my-plugins/bulletChart"` в superset-frontend
- [x] **adhoc_filters → filters** — передаются в `DetailQueryParams`
- [x] **time_range → timeRange** — передаётся в детализацию
- [x] **Тёмная тема** — `isDarkMode` через luminance (W3C) + swap CSS variables в `<Root>`
- [x] **Thumbnail** — placeholder взят из kpiCard (TODO: нарисовать свой)

## 5. Детализация (DetailModal)

- [x] **Серверная агрегация** — `/api/v1/chart/data` с `columns: [detailGroupby]`
- [ ] **Пагинация** — не реализована (MVP: все строки на экране, max row_limit 500)
- [ ] **Сортировка столбцов** — не реализована (сортировка по rate встроена)
- [ ] **Поиск/фильтр** — не реализовано
- [x] **Mock drill-down** — использует `row.storesList` из пресета
- [x] **Escape** — закрывает модаль
- [x] **Focus на close-кнопке** при открытии
- [ ] **Focus trap** — простая фокусировка close-кнопки; полный trap — техдолг
- [x] **Click outside** — клик по overlay закрывает
- [x] **Rank ordering** — `01, 02, …`
- [x] **Mini bullet** — bar + target на общем storeScale
- [ ] **Stale-while-revalidate** — не реализовано

## 6. Accessibility (WCAG 2.2 AA)

- [x] **role="region"** на Card + aria-label = headerText
- [x] **role="list"** + `role="listitem"` на BulletRow
- [x] **role="dialog" aria-modal="true"** на модали
- [x] **role="tooltip"** на Tooltip
- [x] **role="alert"** на error state
- [x] **aria-busy** при loading
- [x] **aria-label** на BulletRow, кнопках, SortMenu trigger, close-кнопке
- [x] **aria-pressed** на FilterPill
- [x] **aria-expanded** на SortMenu dropdown
- [x] **tabIndex=0** на BulletRow для Tab-навигации
- [x] **Enter/Space** → клик по строке; Ctrl+Enter → drill-down
- [x] **Escape** → закрывает модаль и SortMenu
- [x] **Focus visible** — outline 2px var(--c-sky) на всех interactive
- [x] **Контраст** — `--ink` на `--s` ≥ 12.6:1 (light), `--g500` на `--s` ≥ 5.4:1

## 7. Стилизация (DS 2.0)

- [x] **Только Emotion** — styled, никаких .css файлов
- [x] **Шрифты** — Manrope (--f) текст, JetBrains Mono (--m) числа
- [x] **Grid** — 8px units (padding 8/12/14/18/22/24/28)
- [x] **Радиусы** — карточка 14px, модаль 16px, контролы 7-10px
- [x] **tabular-nums** — `font-variant-numeric: tabular-nums` на Root
- [x] **Формат РФ** — `Intl.NumberFormat('ru-RU')`, запятая-десятичные, пробел-тысячи
- [x] **Валюта** — символ ПОСЛЕ числа
- [x] **Минус** — `\u2212` (−) вместо дефиса в дельтах
- [x] **g400 не для текста** — только для декоративных dots/separators
- [x] **Keyframes через <style>** — KEYFRAMES_CSS инжектится
- [x] **Easing через TS-константы** — const EASE, не var()

## 8. Mock / Design mode

- [x] **8 пресетов** — formats (default), categories, single_row, many_rows, long_names, negative, empty, custom
- [x] **storesList для mock drill-down** — магазины из ref:553-612
- [x] **Бейдж «Режим проектирования»** в подзаголовке
- [x] **buildQuery fallback** — COUNT(*) dummy при mock без метрик
- [x] **Выключение** — ранний `if (mockModeEnabled) return preset` в transformProps

## 9. Производительность

- [x] **row_limit 50** по умолчанию на главный запрос
- [x] **row_limit 500** на detail
- [x] **React.memo** на hot компонентах (Row, Bar, Sparkline)
- [x] **useCallback** на обработчиках row (избежать ре-мемо)
- [x] **useMemo** на sortedRows, visibleRows, storeScale, initialStores, totalStores

## 10. Документация

- [x] **PROBLEMS.md** — уроки и решения
- [x] **PRODUCTION_CHECKLIST.md** — этот файл
- [ ] **README.md** — пока нет (техдолг)

---

## Известные техдолги (не блокеры MVP)

1. Partial / Stale dataStates — добавить при появлении многозапросных сценариев.
2. Пагинация и серверная сортировка в DetailModal.
3. Focus trap в DetailModal (использовать `react-focus-lock` или собственную ловушку).
4. Unit-тесты (`test/` директория).
5. Stale-while-revalidate для drill-down.
6. Дизайнерский thumbnail.png (сейчас копия kpiCard).
7. README.md с кратким описанием, скринами и примером integration.
