# Audit Checklist — Ranked Bars Plugin

Источники правил: `ref/ranked-bars-prototype.html`, `CLAUDE.md` (global + project), `.claude/rules/accessibility.md`, `.claude/rules/typescript.md`.

## A. Соответствие прототипу (визуал и поведение)

### A1. Структура карточки
- [ ] A1.1 Page-title + page-sub (crumb выше карточки) — в прототипе есть, в плагине НЕ надо (плагин == одна карточка)
- [ ] A1.2 Header: title (13px/800/uppercase) + sub (10px/mono/g500)
- [ ] A1.3 Sub содержит: prefix · период · total_label
- [ ] A1.4 Controls: sort-dropdown (32×30, icon only) + unit toggle (₽/%)
- [ ] A1.5 Row-grid точно `36px minmax(180px,220px) minmax(140px,1fr) 70px 92px 80px 56px`
- [ ] A1.6 Footer: hint (с <kbd>) + more-button
- [ ] A1.7 Разделители между rows — 1px solid g200 opacity .7 (last: none)

### A2. Строка рейтинга (RankRow)
- [ ] A2.1 Icon 32×32 rounded 9px, bg = `color-mix(cat-color 18%)`, svg 16×16 stroke 1.5 цвета cat-color
- [ ] A2.2 Rank-badge: 14×14 circle, абсолютно top:-3 right:-4, font-size 8px mono 700
- [ ] A2.3 Name-l: 12.5px/600 ellipsis, name-s: 9.5px/500 mono g500 ellipsis
- [ ] A2.4 Bar-track: 100% × 8px g100 rounded 5px
- [ ] A2.5 Bar-prev: dashed border cat-color, 14px height, opacity 0.45
- [ ] A2.6 Bar-fill: 8px cat-color rounded 5px + 2×12px end-cap
- [ ] A2.7 Sparkline 64×18 path + circle на last
- [ ] A2.8 Value: 12px mono 700, `u` = 10px g500
- [ ] A2.9 Delta: 10.5px mono 600, up/dn/wn колор, стрелка SVG 8×8
- [ ] A2.10 Share: 11.5px mono 700 g700

### A3. Взаимодействие
- [ ] A3.1 Клик = cross-filter (toggle ID в activeFilters)
- [ ] A3.2 Ctrl/Cmd+клик = drill modal
- [ ] A3.3 Hover = tooltip с 5 полями + key-hints в футере
- [ ] A3.4 Active-row: фон g100 + left-border 3px cat-color
- [ ] A3.5 Has-filter: не-выбранные затемняются до opacity .45

### A4. Модалка drill-детализации
- [ ] A4.1 Max-width 760px, rounded 16px
- [ ] A4.2 Head: 44×44 icon + title 16px + sub 10px + close-btn 30×30
- [ ] A4.3 Summary grid 4 × 1fr, gap 10px
- [ ] A4.4 StatBox: label 9px uppercase, value 18px 800, delta 9.5px mono
- [ ] A4.5 Trend section: SVG 700×90 gradient area + line 2px + 12 circles
- [ ] A4.6 Top stores list (5 шт): rank 2-digit + name + mini-bar + val
- [ ] A4.7 Top SKUs list (5 шт)
- [ ] A4.8 Параллельная загрузка 3 query через Promise.all
- [ ] A4.9 Mock-data в isMockMode
- [ ] A4.10 Close on Esc / click backdrop / X button

### A5. Модалка all-items
- [ ] A5.1 Max-width 980px (`modal-wide`)
- [ ] A5.2 Head с иконкой списка (c-sky)
- [ ] A5.3 Toolbar: search-input (с иконкой лупы слева) + sort-pills (3)
- [ ] A5.4 Search фильтрует по name + sub (lowercase)
- [ ] A5.5 Auto-focus в поиск через 200ms после open
- [ ] A5.6 Empty state для 0 результатов
- [ ] A5.7 Footer: "Показано N из M · Сумма: X · Y% от итога"
- [ ] A5.8 Sort-pill "По дельте" disabled если нет metric_prev
- [ ] A5.9 Ctrl+клик в модалке открывает drill поверх (z-index 1100 > 1050)

### A6. Темы
- [ ] A6.1 Все цвета DS 2.0 (bg/s/ink/g50-g700/up/dn/wn/c-sky/c-violet/c-tangerine/c-fuchsia/c-amber)
- [ ] A6.2 Light/dark переключаются через `data-theme` на корне
- [ ] A6.3 Модалки/tooltip (portal) получают свой data-theme + CSS vars

### A7. Анимации (cubic-bezier(.2,.8,.25,1))
- [ ] A7.1 Bar-fill transition width .4s ease
- [ ] A7.2 Modal fade-in .15s, pop .2s
- [ ] A7.3 Tooltip fade .12s
- [ ] A7.4 Dropdown fade .12s
- [ ] A7.5 Row hover .15s background

## B. CLAUDE.md — проектные правила

### B1. Фронтенд-стек
- [ ] B1.1 Emotion CSS-in-JS (без .css файлов, без inline style) — проверить DetailModal (есть inline `style`)
- [ ] B1.2 Ant Design v5 — ← NOT USED (у нас свой дизайн)
- [ ] B1.3 peerDependencies для @superset-ui/core, react, @emotion — **OK** в package.json
- [ ] B1.4 file: protocol в superset-frontend/package.json — **OK**
- [ ] B1.5 TypeScript strict + skipLibCheck — **OK**

### B2. Язык
- [ ] B2.1 Все пользовательские тексты на русском (labels, descriptions, errors, placeholders)
- [ ] B2.2 Комментарии бизнес-логики на русском / технические на английском — норм
- [ ] B2.3 Имена переменных/функций на английском (camelCase) — **OK**

### B3. DS 2.0 фундамент
- [ ] B3.1 Manrope (`--f`) + JetBrains Mono (`--m`)
- [ ] B3.2 Grid 8px: padding space-2/3/4/6
- [ ] B3.3 Радиусы: карточки 10px, контролы 6px (в прототипе card 14px rounded — отличается)
- [ ] B3.4 Числа tabular-nums ВСЕГДА
- [ ] B3.5 Формат РФ: пробел-тысячи, запятая-десятичные
- [ ] B3.6 Валюта ПОСЛЕ числа
- [ ] B3.7 6 состояний у каждого компонента: Loading, Error, Empty, Partial, Stale, Populated

### B4. Плагины (viz)
- [ ] B4.1 Префикс `ext-` в ключе — **OK** (`ext-ranked-bars`)
- [ ] B4.2 В transformProps: `queriesData?.[0]?.data || []`, `getMetricLabel()`, width/height на корне — проверить

## C. Правила из ~/.claude/rules

### C1. accessibility.md
- [ ] C1.1 Все интерактивные элементы доступны с клавиатуры — проверить
- [ ] C1.2 Контраст 4.5:1 (обычный), 3:1 (крупный) — проверить
- [ ] C1.3 Focus visible на каждом focusable — проверить
- [ ] C1.4 Не используй div с onClick — у нас `<div role="listitem" tabIndex={0}>` (можно обойти как button? — обычно это паттерн для карточек-списков)
- [ ] C1.5 Модальные окна: focus trap, Escape, aria-modal — **OK**
- [ ] C1.6 Кнопки иконочные имеют aria-label — проверить

### C2. typescript.md
- [ ] C2.1 strict: true — **OK**
- [ ] C2.2 Explicit return types на exported functions — проверить (не у всех)
- [ ] C2.3 No `any` без обоснования — проверить
- [ ] C2.4 const/let/no var — **OK**
- [ ] C2.5 Optional chaining + nullish coalescing — **OK**

## D. Возможные баги / edge-cases

- [ ] D1. `color-mix(in srgb, ...)` не работает в Safari < 16.2 — проверить и добавить fallback
- [ ] D2. BarPrev расчёт в pct mode сейчас даёт странную формулу — проверить
- [ ] D3. `dangerouslySetInnerHTML` для SVG иконок — безопасно (константы), но лучше рендерить JSX
- [ ] D4. transformProps: error_message через `as unknown as` — нужен proper type
- [ ] D5. Ghost bar не должен рисоваться когда `valuePrev = null` (проверить каждую строку)
- [ ] D6. Sparkline `spark[]` может содержать NaN/undefined — фильтрация
- [ ] D7. maxValue при unit='pct' использует sharePct, но maxPrevValue всегда по valuePrev — непоследовательность
- [ ] D8. Поиск в AllItems не учитывает локаль (toLowerCase работает для кириллицы, но для турецкого "I" будет баг) — для ru приемлемо
- [ ] D9. tooltip-host не очищается при анмаунте компонента в некоторых случаях?
- [ ] D10. Инлайн `<div style={{...}}>` в DetailModal (Skeleton/Empty/Error) — проект запрещает inline style

## E. Архитектурные моменты

- [ ] E1. transformProps вызывается на каждый ререндер — `mapPresetToRows` копирует LOSSES_PRESET через map (правильно, не mutate)
- [ ] E2. `computeShareAndDelta` мутирует массив — нужно пересмотреть
- [ ] E3. `activeIds` формируется из `filterState?.value`, но в mock-режиме эта связь отсутствует (cross-filter отключён) — OK
- [ ] E4. Отсутствует error boundary для ленивой загрузки компонента
