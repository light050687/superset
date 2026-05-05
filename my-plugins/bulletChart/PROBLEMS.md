# Bullet Chart Plugin — Проблемы и решения

## Контекст

Разработка визуал-плагина `superset-plugin-chart-bullet` для Apache Superset 6.0 —
bullet chart в стиле Stephen Few. Требование — воспроизвести поведение
HTML-прототипа `ref/bullet-formats-prototype.html` (5 форматов магазинов,
3 качественные зоны, sparkline, tooltip, drill-down модаль).

---

## Проблема 1: Неправильное построение качественных зон

### Симптом
Первая реализация `BulletBar` принимала пропсы `thresholds: [min, low, high, max]`
и `direction`, пытаясь универсально рисовать зоны. Результат визуально не
совпадал с прототипом — зоны были смещены относительно target.

### Реальная причина
В прототипе (ref:793-796) зоны строятся **от target (plan)**, а не от отдельно
заданных порогов:
```
band1 (фон, приемлемо) = 100% scaleMax
band2 (хорошо)         = plan / scaleMax
band3 (отлично)        = 0.8 × plan / scaleMax
```

### Решение
`BulletBar.tsx` переписан — принимает `value`, `target`, `scaleMax`, `direction`.
Пропс `thresholds` и утилита `utils/thresholds.ts` удалены. В контрол-панели
секция «Пороги» заменена на `status_tolerance_pct` (размер зоны «около плана»).

### Урок
Не выдумывать API. Если прототип использует конкретную формулу — повторять её
дословно, даже если кажется «частным случаем». Обобщения добавлять потом,
когда появится второй клиент.

---

## Проблема 2: Неверная формула статуса

### Симптом
Все строки в mock-режиме «formats» получали статус `good` или `bad`
без промежуточного `warn`, потому что я использовал абсолютный допуск
`Math.abs(delta) ≤ 0.01` вместо пропорционального.

### Реальная причина
Прототип (ref:635-641) использует:
```js
ratio = rate / plan
ratio <= 0.95 → up  (good)
ratio >= 1.05 → dn  (bad)
между         → wn  (warn)
```
То есть относительный допуск 5% от plan.

### Решение
`utils/aggregation.ts → computeStatus(rate, plan, direction, tolerancePct)`:
```ts
const ratio = rate / plan;
const tol = tolerancePct / 100;
```
Пользователь может настроить tolerance в controlPanel (по умолчанию 5%).

### Урок
Когда бизнес-логика числовая — брать **формулы дословно** из прототипа, а не
«переписывать на свой вкус».

---

## Проблема 3: Двойной суффикс в BulletRow

### Симптом
Значение на карточке отображалось как `2,36 % %` — суффикс `%` появлялся дважды.

### Реальная причина
`formatters.value()` уже возвращал строку с суффиксом (`2,36 %`), а `BulletRow`
дополнительно рендерил `<span className="u">{valueSuffix}</span>`, проверяя
через `.includes(valueSuffix)`. При значениях с миллионами (`млн %`) проверка
ломалась.

### Решение
Убрал `<span className="u">` из `BulletRow`. Суффикс теперь только один,
внутри `formatters.value()`. Пропсы `valueSuffix`/`valueUnitLabel` удалены
из `BulletRow` и `Tooltip` — они нигде не использовались напрямую, логика
уже запечена в formatters.

### Урок
Не передавать одну и ту же информацию двумя путями. Или formatter решает
всё, или компонент — но не оба.

---

## Проблема 4: Cross-filter одиночный вместо множественного

### Симптом
Клик по строке сбрасывал предыдущий выбор. В прототипе (ref:621, 891-895)
можно кликать по нескольким строкам, накапливая выбор.

### Решение
`activeCategoryId: string | null` → `activeCategoryIds: Set<string>`.
Toggle через `new Set(prev)` с add/delete.

### Урок
Внимательнее читать исходную JS-логику прототипа — там видна форма данных
(`activeFilters = new Set()`), которая диктует state shape.

---

## Проблема 5: DetailModal генерировал мусорные имена

### Симптом
Ctrl+клик в mock-режиме открывал модаль с магазинами «Формат №101, №102…».
Прототип показывает реальные имена: «Самбери Экспресс «Центральный»».

### Реальная причина
В `mocks/presets.ts` я не переносил поле `storesList` из прототипа (ref:553-612).
`DetailModal.generateMockStores` синтезировал имена по шаблону.

### Решение
1. Добавил `storesList` в `FormatRow` как опциональный массив.
2. Перенёс все 30 mock-магазинов из прототипа в `FORMATS_PROTOTYPE`.
3. `DetailModal` в mock-режиме читает `row.storesList` напрямую.

### Урок
Если прототип имеет тестовые данные — копировать полностью, не выдумывать
собственные.

---

## Проблема 6: Нет ErrorBoundary — падение одной карточки ломает дашборд

### Симптом
При ошибке рендера (например, невалидный custom JSON в mock) бросался
необработанный throw, и весь дашборд Superset переставал работать.

### Решение
Добавлен `BulletErrorBoundary` (React class component), обёрнутый вокруг
`BulletChartInner`. При ошибке показывается локальный fallback
(`StateOverlay` с текстом ошибки), structured JSON-log с `service`,
`event`, `message`, `stack`.

### Урок
Каждый плагин визуализации должен изолировать свои ошибки. Это стандарт
для Superset-эko ( [PRODUCTION_CHECKLIST.md §3.1](./PRODUCTION_CHECKLIST.md) ).

---

## Проблема 7: Использование `g400` для текста <18px (нарушение DS 2.0)

### Симптом
В `StateOverlay` подсказка «Настройте измерение и метрику факта» рендерилась
цветом `var(--g400)` при размере 10px — нарушает правило DS 2.0 (g400 запрещён
для <18px).

### Решение
`var(--g400)` → `var(--g500)` для всех текстовых вхождений. `g400` остался
только для декоративных разделителей (`•`, `·`).

---

## Проблема 8: Использование CSS Houdini / prefers-reduced-motion (предусмотрено)

### Предусмотрено
Из урока `kpiCard/PROBLEMS.md` — не использовать:
- `@media (prefers-reduced-motion: reduce)` с `!important` (ломает анимации
  на Windows 11 с отключёнными эффектами),
- CSS Houdini `@property` (не поддерживается Emotion/Stylis),
- `@keyframes` внутри template literal `styled.X`.

### Реализация
Keyframes через строковую константу `KEYFRAMES_CSS` + `<style
dangerouslySetInnerHTML>`. Easing через TS-константы (`EASE`).
`prefers-reduced-motion` не используется.

---

## Итоговая архитектура

```
src/
├── styles.ts               — Emotion styled + KEYFRAMES_CSS (string)
├── themeTokens.ts          — DS 2.0 цвета light/dark
├── BulletChart.tsx         — корневой, ErrorBoundary, state (sort/filter/activeIds)
├── DetailModal.tsx         — модаль drill-down
├── components/
│   ├── BulletBar.tsx       — SVG: bands от plan + bar + target
│   ├── Sparkline.tsx       — SVG polyline + акцент последней точки
│   ├── Tooltip.tsx         — portal, тренд, % плохих
│   ├── SortMenu.tsx        — dropdown-иконки
│   └── BulletRow.tsx       — одна строка формата
├── plugin/
│   ├── index.ts            — ChartPlugin + thumbnail
│   ├── controlPanel.tsx    — 6 секций controls
│   ├── buildQuery.ts       — 1-2 queries (main + sparkline timeseries)
│   └── transformProps.ts   — camelCase, computeScaleMax, defaults, dark-mode
├── utils/
│   ├── aggregation.ts      — buildFormatRows, computeStatus, computeScaleMax
│   ├── format.ts           — Intl.NumberFormat('ru-RU'), formatStoresCount
│   ├── sorting.ts          — sortRows
│   ├── sparklineBuild.ts   — attachSparklines из timeseries
│   ├── detailApi.ts        — SupersetClient.post → /api/v1/chart/data
│   └── resolveMetric.ts    — label + fallback по позиции
└── mocks/presets.ts        — дефолтный = ref:546-614 + edge-cases
```
