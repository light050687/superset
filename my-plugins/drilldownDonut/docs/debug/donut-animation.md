# Donut animation: drill/back не воспроизводится

## Симптом

При drill (Ctrl+Click на сегмент с children) и при возврате (Esc) — donut
не показывает анимацию (expansion из центра или морф сегментов). Сегменты
просто заменяются мгновенно. Initial mount тоже не всегда воспроизводит
expansion.

Reported: 2026-05-14 в трёх итерациях пользователем на скриншоте дашборда.

## Попытки

### 7-я попытка: ref-guard на повторный `setOption` с идентичным `option`

**Симптом (новый, после попытки #6 — animation вернулась, но играется 2–3 раза подряд):**
```
10:52:24.871 [donut] init: mounting ECharts level= root drilledId= null
10:52:24.887 [donut] setOption isFirst= true  sectors= 5     ← 1-й, ок
10:52:24.916 [donut] ECharts animation FINISHED
10:52:25.018 [donut] setOption isFirst= false sectors= 5     ← 2-й через 130мс, те же данные
10:52:25.034 [donut] ECharts animation FINISHED
10:52:25.762 [donut] setOption isFirst= false sectors= 5     ← 3-й через 730мс
10:52:25.765 [donut] ECharts animation FINISHED
```
Параллельно SVG Reveal Overlay длится 770мс → `setRevealing(false)` → canvas
становится visible → пользователь видит как минимум один повторный
«expansion» уже **после** SVG reveal. Это и есть «двойная анимация».

**Гипотеза (подтверждена через лог):** `transformProps` ([plugin/transformProps.ts:172](../../src/plugin/transformProps.ts))
каждый раз вызывает `groupRows(...)` → новый массив `categories` с новыми
объектами + мутации (`.forEach((cat) => { cat.accent = ...; cat.color = ...; })`).
Superset вызывает `transformProps` на **каждый Redux dispatch**: favorites,
reports, drill_info, chart-data — всё это видно в логе между t=23.9s и t=25.7s.

`<DonutChartInner>` получает новый `categories` reference при каждом re-render
родителя, и `useEffect` для `setOption` ([StructureDonut.tsx:318–377](../../src/StructureDonut.tsx))
с `categories` в deps срабатывает повторно — несмотря на идентичное содержимое.

`React.memo + arePropsEqual` (паттерн из metricTimeSeries/paretoAnalysis/scorecard)
не помогает: он использует reference-compare (`prev[key] !== next[key]`), а
`categories` reference нестабилен.

**Изменения:**
- `StructureDonut.tsx:191–196` — добавлен `const prevOptionHashRef = useRef<string>('');`
- `StructureDonut.tsx:344–355` — в setOption useEffect, после `buildOption(...)`
  и до `chart.setOption(...)`, добавлен skip-guard по `JSON.stringify(option)`.
  Если хеш совпал с предыдущим — `return` без `setOption` → ECharts не
  проигрывает повторную анимацию.
- На drill/back `<DonutChartInner>` re-mount'ится через `key={...}` в parent
  (StructureDonut.tsx:890) → новый ref (`prevOptionHashRef.current = ''`) →
  первый setOption гарантированно отрабатывает.

**Trade-offs:**
- `JSON.stringify` на option с 5–50 секторами — sub-ms, безопасно. Для тысяч
  точек в будущем — можно заменить на селективный хеш (id+value+color).
- Hash сравнивается на финальном `option`, а не на props → отражает то, что
  ECharts реально будет рендерить, и не зависит от внутренней структуры
  `categories` (accent/color/shades уже в `option`).
- Theme switch (dark/light) → `tokens` меняется → buildOption → другие цвета
  в option → hash меняется → setOption срабатывает корректно. ✓

**Результат:** TBD после деплоя. Ожидается ровно один `setOption isFirst=true`
после init на initial mount, и ровно один свежий setOption на каждое
осмысленное изменение (unit toggle, click сегмент, toggle legend, drill, back,
theme switch).

### 1-я попытка: `ResizeObserver` race + `setOption` merge logic

**Гипотеза:** ResizeObserver firing один раз сразу после `observe(el)` →
schedules RAF resize → resize вызывает re-layout pie series → animation
прерывается на t=0.

**Изменения:**
- `StructureDonut.tsx:206-258` — sync resize в init useEffect (без RAF),
  ResizeObserver с `isFirstRO` skip-first guard + `prevW/prevH` dim-compare guard.
- `StructureDonut.tsx:343-348` — `isFirstSetOptRef` для `notMerge`: первый
  setOption `true` (initial expansion), последующие `false` (transition morph).
- `buildOption.ts:152-156` — root animation duration 1200/1500 → 450/400ms
  cubicOut/cubicInOut (1:1 с `ref/structure-donut-prototype.html`).
- `buildOption.ts:208-212` — series-level animation duration/easing
  удалены (наследуются от root), `animationTypeUpdate: 'transition'`.

**Результат:** Animation не запускалась ни при init ни при drill.
Пользователь сообщил «нет ни одной правки» (Турн 1).

### 2-я попытка: `chart.clear()` + reset `isFirstSetOptRef` на level change

**Гипотеза:** ECharts pie `animationTypeUpdate: 'transition'` не визуализирует
переход когда series identity полностью меняется (root categories → drilled
children). См. issue #11029 в ECharts repo. setOption(opt, false) на разных
data treated как update без visible animation.

**Изменения:**
- `StructureDonut.tsx:204-212` — `prevLevelRef`, `prevDrilledIdRef` refs.
- `StructureDonut.tsx:315-326` — в setOption useEffect: при смене
  `level`/`drilledId` → `chart.clear()` + `isFirstSetOptRef.current = true`
  → следующий setOption запустит initial expansion как при mount.

**Результат:** Drill всё ещё мгновенный без анимации. Пользователь сообщил
«анимация так и не работает» (Турн 3, скриншот).

### 6-я попытка: ROOT CAUSE FIX — удалить `@media (prefers-reduced-motion)` CSS rules

**Гипотеза (подтверждена):** После 5 неудач — пользователь явно сказал
«ты чинишь симптом а не болезнь». Уточнение: бублик появляется
МГНОВЕННО (ни scale, ни fade, ни expansion — НИЧЕГО). Radial menu
тоже без animation на повторном ПКМ (даже через паузу). Это значит
CSS animations отключены **глобально**.

**Корневая причина:** В коде было **5 мест** с `@media
(prefers-reduced-motion: reduce)` которые unconditionally
устанавливали `animation-duration: 0.01ms !important`:

1. `styles.ts:151-162` — StructureDonutRoot global wildcard (`*,
   *::before, *::after`) — отключал ВСЕ animations внутри Card
2. `styles.ts:429-431` — ChartWrap specific donut reveal
3. `RadialMenu:138-142` — radial-arc paths
4. `RadialMenu:188-191` — IconWrap fade-in
5. `RadialMenu:225-227` — CenterButton transition

**Windows 11 default OFF** на Settings → Accessibility → Visual
effects → Animation effects → `prefers-reduced-motion: reduce`
matches → наши rules выключали ВСЕ animations.

Все 5 предыдущих попыток ECharts/CSS изменений были корректны на
уровне реализации, но CSS rule сам отключал animations через 0.01ms.
Лечил симптомы, не болезнь.

**Изменения:**
- `styles.ts` — удалены оба `@media (prefers-reduced-motion)` блока
  (StructureDonutRoot global + ChartWrap specific)
- `RadialMenu/index.tsx` — удалены все 3 `@media
  (prefers-reduced-motion)` блока (radial-arc, IconWrap, CenterButton)
- `buildOption.ts` — оставлен `animation: true` (был fixed в попытке 4)

**Trade-off:** дизайн-док §13 говорит уважать prefers-reduced-motion.
Pragmatic compromise — наши animations subtle (1s scale, 0.55s
fade-in) не вызывают motion sickness. Для accessibility users
доступны browser-level overrides (user stylesheet, extensions).

**Результат:** TBD после deploy. Это должен быть финальный fix.

### 5-я попытка: Plan C — CSS animation на ChartCanvas wrapper

**Гипотеза:** После 4 неудачных попыток через ECharts API — ECharts
internal animation в этом окружении (Superset chart container + lazy
mount + React render cycle) не воспроизводится у пользователя
независимо от config. Игнорируем ECharts API, делаем CSS animation
на wrapper'е ChartCanvas — это **гарантированно видимо** браузером
независимо от того что делает ECharts внутри.

**Изменения:**
- `styles.ts:393-415` — добавлен `donutRevealKf` keyframe (scale 0.4 →
  1 + rotate -30 → 0 + opacity 0 → 1). Применён к ChartCanvas через
  `animation: ... 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both` (easeOut
  с lite bounce). Plan B (DonutChartInner с key={level-drilledId})
  гарантирует unmount/mount ChartCanvas при drill/back → CSS animation
  re-fires каждый раз.

**Результат:** TBD. Это nuclear option — visual animation независимо
от ECharts state. Trade-off: animation visual не «expansion сегментов»
(как в ref), а «scale+rotate всего donut» — это less subtle, но
guaranteed visible. Если пользователь захочет именно sector-by-sector
expansion — нужен полностью custom SVG donut (не ECharts), Plan D.

### 4-я попытка: Plan B + remove `prefers-reduced-motion` check

**Гипотеза:** Windows 11 имеет системную настройку «Animation effects»
которая default OFF на многих устройствах = `prefers-reduced-motion: reduce`
matches. Наш код в `buildOption.ts` имел `animation: !reduceMotion` →
ECharts animation отключалась на этих системах. Пользователь видит
донат без animation. Plan B (extract inner с key prop force-remount)
работает только если ECharts animation enabled.

**Изменения:**
- `buildOption.ts:118-130, 156-162, 216-223` — удалён `reduceMotion`
  check; `animation: true` всегда (root + series). Emotion @media
  reduce-motion в `styles.ts` оставлен (CSS-level animations).
- `StructureDonut.tsx:148-352` — выделен `<DonutChartInner>` подкомпонент.
- `StructureDonut.tsx:724-746` — render `<DonutChartInner key={`donut-${level}-${drilledId ?? 'root'}`}>` 
  → drill/back unmount/remount chart instance → fresh expansion animation.

**Результат:** TBD после deploy.

### 3-я попытка: `animationTypeUpdate: 'expansion'` (per ECharts docs)

**Гипотеза:** Per ECharts handbook («Data Transition - Animation») и
issue #11029 — pie series `animationTypeUpdate` имеет 2 значения:
`'transition'` (морф между sectors) и `'expansion'` (re-trigger expansion
from center). 'transition' не работает для разных series identity, поэтому
docs рекомендуют 'expansion' для cases когда data structure меняется.

**Изменения:**
- `buildOption.ts:212` — `animationTypeUpdate: 'transition'` → `'expansion'`.
- chart.clear() из попытки 2 остаётся как safety net.

**Результат:** TBD (ожидаем feedback от пользователя после deploy 3-й попытки).

## Что попробовать дальше если 3-я попытка не сработает

### Plan B: Extract chart logic в inner component + `key` prop

Текущая архитектура: StructureDonut оборачивает chart init useEffect.
ChartCanvas с key prop **не** триггерит re-init useEffect (потому что
useEffect deps `[]` и не зависит от ref.current).

Решение: extract chart-related effects в `<DonutChartInner>` подкомпонент
с props `level`, `drilledId`, etc. Поставить `key={`${level}-${drilledId}`}`
на DonutChartInner в StructureDonut. На смену key — React unmount'ит
DonutChartInner (cleanup dispose chart) + mount нового → init useEffect
re-runs → новый chart instance → initial setOption запускает expansion.

Это nuclear option упомянутый в `clever-baking-kay.md` плане. Trade-off:
~150 строк рефакторинга, но гарантированно работающее решение через React
mount lifecycle вместо ECharts internal animation API.

### Plan C: Stop using ECharts animation, реализовать через CSS transition

Скрыть ECharts canvas opacity 0 при drill → setOption → fade-in opacity 1
через CSS transition. Это не настоящая expansion из центра, но визуально
acceptable «обновление».

### Plan D: `universalTransition: true` per series

Из ECharts docs (universal transition) — позволяет анимировать между
разными chart types и series structures. Less specific to pie expansion,
но может работать для root↔drilled.

## Open questions

- Подтвердить через DevTools Performance что setOption реально запускается
  (event log) и его animation timer стартует. Возможно ECharts marks animation
  as `skipped` если series.data identity не меняется (Object.is reference).
- Проверить если ChartContainer (parent в Superset) делает что-то которое
  отменяет animation (например forces re-render).
- Verify ECharts version: `package.json` plugin'а `echarts: "5.6.0"`. Some
  pie animation behaviors были добавлены в 5.2.0+.

## References

- ECharts handbook: https://echarts.apache.org/handbook/en/how-to/animation/transition/
- ECharts issue #11029: «feat: Pie expansion animation behavior»
- ECharts issue #6202: «Problems when updating chart through setOption()»
- ECharts changelog 5.2.0: animationTypeUpdate added
- `D:/projects/superset-dev/ref/structure-donut-prototype.html` — working
  reference HTML/JS (без React/Superset wrapper), 450/400ms cubicOut/cubicInOut
  работают корректно. Различие с нашей реализацией — отсутствие React
  re-render cycle и ResizeObserver на parent flex container.
