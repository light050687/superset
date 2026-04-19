# План исправлений Floating Dock — pixel-parity с мокапом

**Статус:** ✅ **Все этапы завершены** (A → B14).

**Источник правды:** `.design-downloads/floating-dock/project/analytics-floating-dock.html`

---

## Итоговые ветки (все запушены)

| Этап | Ветка | Суть |
|------|-------|------|
| A | `feature/EXT-floating-dock-fix-A-skeleton` | 44×44 btn, 3 sep, glass dock, убран logo «М» и AI-btn |
| B1 | (проверка, без отдельной ветки) | Home — SVG+active-by-default |
| B2 | `feature/EXT-floating-dock-fix-B2-catalog` | is-catalog drawer 1200×640 + click-outside fix |
| B3 | `feature/EXT-floating-dock-fix-B3-tools` | Tools grid tiles (SQL/Данные/Автоматизация) |
| B4 | `feature/EXT-floating-dock-fix-B4-create` | Create grid tiles (Визуализация/Документы/Данные) |
| B5 | `feature/EXT-floating-dock-fix-B5-history` | AiHistorySheet bottom sheet 1200×640 |
| B6 | `feature/EXT-floating-dock-fix-B6-pill` | CentralPill compact 280×44 + expanded 560×84 |
| B7 | `feature/EXT-floating-dock-fix-B7-context` | 4 дефолтных контекста (Общий/Потери/Продажи/Маржа) |
| B8 | `feature/EXT-floating-dock-fix-B8-settings` | AiSettingsPopover (tools + params) |
| B9 | `feature/EXT-floating-dock-fix-B9-calendar` | Calendar dropdown verified (glass, size, pos) |
| B10 | `feature/EXT-floating-dock-fix-B10-theme` | Theme toggle sun+moon + data-theme sync |
| B11 | `feature/EXT-floating-dock-fix-B11-avatar` | Avatar 34×34 gradient verified |
| B12 | `feature/EXT-floating-dock-fix-B12-ai-overlay` | AI overlay — убран нижний input, pill = вход |
| B13 | `feature/EXT-floating-dock-fix-B13-ambient` | Ambient blur orbs (sky + violet) |
| B14 | финальный — final verification |

## Финальные измерения (JS-интроспекция)

```
dockHeight: 60 (мокап 58 + 2 border)
dockWidth: 720
bottomY: 18 (от нижнего края viewport)
pillWidth: 282 compact (мокап 280)
pillHeight: 46 compact (44+2 border)
separators: 3 (после Create, после pill, перед Avatar)
buttonLabels: [Главная, Каталог, Инструменты, Создать,
               История чатов, <pill tools>, Календарь, Тема, Профиль]
hasLogoM: false ✓ (убран)
hasAiBtn: false ✓ (убран, роль — CentralPill)
hasAiHistory: true ✓ (добавлен)
ambient orbs: sky (top-left) + violet (bottom-right) ✓
```

**Методология каждого этапа:**
1. Прочитать нужный фрагмент мокапа (CSS + HTML + JS-поведение)
2. Сравнить с текущим кодом в [superset-frontend/src/views/components/Shell/](superset/superset-frontend/src/views/components/Shell/)
3. Составить diff-список расхождений
4. Исправить код
5. `npm run build-dev` → `docker compose restart nginx` → проверка в браузере скриншотом/JS-интроспекцией

---

## Уже найденные расхождения (ключевые)

- **Logo «М»** — в финальном мокапе **УБРАН** (дублировал иконку дома). У меня отображается.
- **Кнопка «История чатов»** — **отсутствует** у меня. В мокапе это `rail-btn.ra-history` ПЕРЕД CentralPill.
- **Отдельная кнопка AI (rail-ai)** — у меня есть, **в мокапе НЕТ**. Её функцию выполняет клик по CentralPill.
- **3 разделителя** (`rail-sep`) в мокапе: после Create, после CentralPill, перед Avatar. У меня 1.
- **Размер rail-btn**: мокап 44×44 с radius 14px; у меня 38×38 с radius 10.
- **Hover transform**: мокап `translateY(-6px) scale(1.18)`; у меня `-4/1.1`.
- **Active-state** rail-btn: мокап даёт `linear-gradient` bg + inset box-shadow + `::after` dot с `0 0 8px` glow. У меня только простой dot без glow.
- **Badge** на catalog: мокап 8×8 с двойным box-shadow; у меня 6×6 без glow.
- **Theme button** — в мокапе внутри кнопки две SVG (sun + moon), переключаемые через `.light` класс. У меня одна универсальная.
- **CentralPill structure**: мокап = 2 ряда `.ra-row-top` / `.ra-row-bot`, компактная — только row-top; у меня только row-top показывает send-button + chip.
- **CentralPill focused**: `height:84px; min-width:560px; margin-top:-40px; border-radius:20px` + 2 ряда. У меня 420×100, другие размеры.
- **Context Popover**: 4 контекста (Общий, Потери Q1, Продажи, Маржа P&L) + separator + «Закрыть». У меня только Общий.
- **Avatar**: 34×34 с gradient violet→fuchsia + border 2px. У меня 32×32 без border.
- **rail (сам dock)**: `background:color-mix(bg1 38%, transparent)`, `backdrop-filter: blur(22px) saturate(160%)`, `border-radius:18px`. У меня 20px radius, blur 16.

---

## Этап A. Skeleton dock — общая структура

Сверить **только раму** dock'а (без drawer'ов/popover'ов). Выравнивание, размеры, расстояния, glass-стиль.

**Checklist:**
- [ ] Удалить `RailLogo` «М» — он не в финальном мокапе
- [ ] `rail-btn`: 44×44, `border-radius:14px`, `transform-origin: center bottom`
- [ ] `rail-btn:hover`: `translateY(-6px) scale(1.18)` + бг из `color-mix(bg3 80%, transparent)`
- [ ] `rail-btn.active`: `linear-gradient(135deg, sky-dim, violet/10)` + `inset 0 0 0 1px sky/35`
- [ ] `rail-btn.active::after`: 4×4 dot c `box-shadow: 0 0 8px sky`
- [ ] `rail-sep`: 1×26 `var(--g200)` opacity 0.6, `margin:0 4px`
- [ ] `rail` (nav сам): `background color-mix(bg1 38%, transparent)`, `backdrop blur(22) saturate(160)`, `border-radius:18px`, двойной box-shadow (inset highlight + drop)
- [ ] Для `.light` — отдельный override (чтобы glass корректно работал в обеих темах)
- [ ] 3 разделителя в правильных местах: после rb-create, после railAsk, перед rb-settings
- [ ] Порядок кнопок: Home · Catalog · Tools · Create · *[sep]* · **History** · **CentralPill** · *[sep]* · Calendar · Theme · *[sep]* · Avatar

**Файлы:** [Rail.tsx](superset/superset-frontend/src/views/components/Shell/Rail.tsx), [ds2Tokens.ts](superset/superset-frontend/src/theme/ds2Tokens.ts)

**Проверка:** скриншот localhost:8088 — dock высотой 60px, 11 элементов в правильном порядке, без логотипа, glass на месте, разделители видны.

---

## Этап B1. Иконка «Главная» (🏠 `rb-home`)

- SVG иконка: `<path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z"/>` (16×16 viewBox) — у меня совпадает
- **По умолчанию active** при заходе на welcome (`.active` класс от router)
- Клик → `/superset/welcome/`
- Hover → магнификация и background

**Файлы:** [RailIcons.tsx](superset/superset-frontend/src/views/components/Shell/RailIcons.tsx), [Rail.tsx](superset/superset-frontend/src/views/components/Shell/Rail.tsx)

**Проверка:** при открытии `/welcome/` кнопка Home имеет active-gradient + glow-dot под ней.

---

## Этап B2. Иконка «Каталог» (📂 `rb-catalog`) + drawer

### Иконка
- SVG: `<path d="M2 2h5l2 2h5v10H2V2z"/>`
- `r-badge` (8×8 оранжевый с двойным box-shadow) если `catalogBadgeColor` задан

### Drawer «Каталог»
Читать мокап `.drawer` + `openDrawer('catalog')` — структура содержимого:
- Drag handle сверху (уже есть)
- Title «Каталог» + close
- 4 колонки grid: **Навигация** (Главная, Недавние) | **Избранное** | **Недавние запросы** | **Все отделы** (14 отделов)
- Item: иконка 16×16 + label + count badge

**Файлы:** [Drawer.tsx](superset/superset-frontend/src/views/components/Shell/Drawer.tsx), [CatalogDrawer](superset/superset-frontend/src/features/catalog/)

**Проверка:** клик по Catalog → bottom sheet поднимается снизу, 4-колоночный grid с группами.

---

## Этап B3. Иконка «Инструменты» (⚙ grid `rb-tools`) + drawer

### Иконка
- SVG: 4 rect 5×5 rx:1 (grid 2×2)

### Drawer «Инструменты»
По мокапу: `SQL-editor`, `Upload файлов`, `Dataset manage`, `Трансформации`, `Saved Queries`, `Query History`, `Databases`, `Alerts`, `Reports`, `CSS Templates`
- Grid 3-4 колонки (зависит от ширины)
- Каждый item: icon + label + краткое описание

**Файлы:** [ToolsDrawer.tsx](superset/superset-frontend/src/views/components/Shell/ToolsDrawer.tsx)

**Проверка:** клик по Tools → drawer со списком инструментов в grid.

---

## Этап B4. Иконка «Создать» (➕ `rb-create`) + drawer

### Иконка
- SVG: `<path d="M8 3v10M3 8h10"/>` с stroke-width:1.9 (жирнее остальных)

### Drawer «Создать»
Пункты: **Папка**, **Дашборд**, **Чарт**, **Таблица**, **Запрос** (+ Superset-native: Chart, Dataset, Connect DB, Upload CSV/Excel/Columnar)
- Каждый item ведёт на соответствующий URL/модалку
- Accent-цвета (sky для Дашборд, violet для Таблица и т.д.) по мокапу

**Файлы:** [CreateDrawer.tsx](superset/superset-frontend/src/views/components/Shell/CreateDrawer.tsx)

**Проверка:** клик по Create → drawer создания.

---

## Этап B5. Кнопка «История чатов» (новая! `rail-btn.ra-history`)

Позиция: после `rail-sep`, ПЕРЕД CentralPill.
- SVG: `<path d="M8 4v4l3 2M8 14A6 6 0 108 2a6 6 0 000 12z"/>` (часы)
- `onclick → toggleAiSide()` открывает bottom sheet с историей чатов
- В мокапе: отдельный `.ai-side` floating panel со списком чатов (группы «Сегодня» / «Вчера» / «Старше»)

**Файлы (новые):**
- `Rail.tsx` — добавить кнопку rb-history
- `RailIcons.tsx` — IconHistory
- `AiHistorySheet.tsx` (откладывали в Этап 6 плана миграции — теперь делаем здесь)

**Проверка:** клик → bottom sheet со списком чатов над доком.

---

## Этап B6. CentralPill — skeleton (structure)

Мокап:
```
.rail-ask                  compact: 44h, 280min-w, radius 999 (pill)
├── .ra-row-top            44h: [compact-chip][input][send/kbd]
└── .ra-row-bot            40h (display:none если не focused)

.rail-ask.focused          height 84 (row-top + row-bot)
                           min-width 560, margin-top:-40, radius 20
                           border-color sky-55%
                           box-shadow sky-10 ring + glass drop
```

**Checklist:**
- [ ] 2 строки в структуре (top всегда, bot только при `.focused`)
- [ ] Compact: chip слева (sky-dot + «Общий»), input, kbd `⌘K` справа
- [ ] Focused: top = expanded chip + input + send; bot = attach `+` · model picker · voice · gear
- [ ] Focused: height 84, min-width 560, radius 20, margin-top -40 (pill «выталкивается» наверх)
- [ ] `has-text` класс — если input заполнен, mic-icon превращается в send-arrow (круглая sky кнопка)
- [ ] Hover (not focused): border-color g300, bg bg2-85

**Файлы:** [CentralPill.tsx](superset/superset-frontend/src/views/components/Shell/CentralPill.tsx)

**Проверка:** фокус в pill → расширяется вверх (не вниз!) до 84h, появляется вторая строка с toolbar.

---

## Этап B7. CentralPill → Context Popover

**Мокап `#aiCtxPop`:**
```
.ai-pop open bottom:84
  .ai-pop-head «Контекст ассистента»
  .ai-pop-item active data-ctx="global"  «Общий» — Все данные компании
  .ai-pop-item data-ctx="losses"          «Потери Q1» — Дашборд потерь
  .ai-pop-item data-ctx="sales"           «Продажи» — Продажи магазинов
  .ai-pop-item data-ctx="margin"          «Маржа P&L» — Маржинальность P&L
  .ai-pop-sep
  .ai-pop-item «Закрыть»
```

**Checklist:**
- [ ] `Shell.tsx.aiContexts` заполнить 4 дефолтными контекстами (глобал + 3 дашборда)
- [ ] Цвета dot: sky / tangerine / teal / violet
- [ ] Hint-строка под label (11px g500)
- [ ] Активный имеет `ap-check` (галочка)

**Файлы:** [ContextPopover.tsx](superset/superset-frontend/src/views/components/Shell/ContextPopover.tsx), [Shell.tsx](superset/superset-frontend/src/views/components/Shell/Shell.tsx)

**Проверка:** клик по chip → popover со списком, выбор переключает dot+label в chip.

---

## Этап B8. CentralPill → Model picker + Settings Popover

**Мокап:**
- Model-pill pill: `[Haiku 4.5 ▾]` в нижнем ряду → popover 3 моделей
- Gear icon → Settings Popover (temperature slider, verbosity toggle, stream toggle)

**Checklist:**
- [ ] Model-button с модельным именем (mono font) + chevron
- [ ] `rb-model:hover` background bg1-70
- [ ] ModelPopover: три моделя с hint + active-state
- [ ] AiSettings popover: switches (stream/verbose) + slider (temperature)

**Файлы:** [ModelPopover.tsx](superset/superset-frontend/src/views/components/Shell/ModelPopover.tsx), + новый `AiSettingsPopover.tsx`

**Проверка:** клик по gear → popover с настройками; клик по model → список 3 моделей.

---

## Этап B9. Иконка «Календарь» (📅 `rb-calendar`) + dropdown

### Иконка
- SVG: rect 12×11 + path month-lines

### Dropdown
- Сетка месяца 7×6 + «Сегодня» + список событий с colored dots
- Glass стилизация, position above dock
- Esc / click-outside закрывает

**Файлы:** [CalendarDropdown.tsx](superset/superset-frontend/src/views/components/Shell/CalendarDropdown.tsx)

**Проверка:** клик по Calendar → dropdown 300-340px над кнопкой.

---

## Этап B10. Иконка «Тема» (☀/🌙 `rb-themes`)

**Мокап:** внутри кнопки **две SVG** (sun + moon), видимость переключается через `html[data-theme]`:
- `[data-theme="dark"] .th-sun { display:none }` (видна moon)
- `[data-theme="light"] .th-moon { display:none }` (видна sun)

**Checklist:**
- [ ] IconTheme → IconSun + IconMoon; в RailButton обе SVG внутри, CSS скрывает нерелевантную
- [ ] Плавный transition при смене темы (не кусок-рваный)

**Файлы:** [RailIcons.tsx](superset/superset-frontend/src/views/components/Shell/RailIcons.tsx), [Rail.tsx](superset/superset-frontend/src/views/components/Shell/Rail.tsx)

**Проверка:** в dark — moon, в light — sun. Тумблер плавный.

---

## Этап B11. Avatar + Settings dropdown

### Avatar
Мокап: 34×34 `linear-gradient(135deg, violet, fuchsia)`, border 2px `bg1 60%`, font 11px.

### Settings dropdown
- Header: имя + email + роль
- Разделы: Профиль / Безопасность / Управление / Интеграции / Помощь
- Footer: Theme toggle (дубль), Logout (red)

**Файлы:** [SettingsDropdown.tsx](superset/superset-frontend/src/views/components/Shell/SettingsDropdown.tsx)

**Проверка:** клик по аватару → dropdown 260-320px над кнопкой.

---

## Этап B12. AI Overlay (ai-full + ai-scrim) + AiHistorySheet

**Мокап:**
```
.ai-scrim                position:fixed inset:0 background rgba(0,0,0,0.4)
.ai-full                 position:fixed bottom:92 left:50% translate(-50%)
                         width 820, height 640, max-height 70vh
  .ai-main               chat flex-column
    .ai-close            top-right
    .ai-history-btn      top-left → toggleAiSide
    .af-body             messages (empty state / chat)
    (input теперь в CentralPill, не здесь!)

.ai-side                 separate bottom sheet for chats history
                         position:fixed bottom:76 left:24 right:24
```

**Checklist:**
- [ ] **Убрать нижнюю input-строку** из AiFullView — ввод идёт через CentralPill, который парит над overlay
- [ ] AiHistorySheet — отдельный bottom sheet (над dock, под AI Panel)
- [ ] Кнопка «История» внутри ai-main top-left
- [ ] Empty state: «Привет, Денис» + suggest-cards (4 prompt'а)
- [ ] Messages: .ai-msg fade-up анимация; разные типы (user/bot/thinking/kpi-card/chart/insight/followup)
- [ ] Scrim click → close; Esc → close

**Файлы:** [AiFullView.tsx](superset/superset-frontend/src/features/ai/AiFullView.tsx), [AiSidebar.tsx → AiHistorySheet.tsx](superset/superset-frontend/src/features/ai/AiSidebar.tsx), новые

**Проверка:** клик по CentralPill (когда есть текст) → Enter → AI overlay открывается, дашборд под scrim; клик по History → sheet выезжает; Esc / scrim-click закрывает.

---

## Этап B13. Ambient background (blur orbs) + parity dark/light

**Мокап:**
```css
.app::before,.app::after  large blurred radial orbs (sky, violet, tang)
                          low opacity, fixed, создают «тёплый» фон 2026
```

**Checklist:**
- [ ] Ambient orbs в `ShellRoot::before/after` (sky top-left, violet bottom-right)
- [ ] В light — другая opacity
- [ ] Не мешают контенту (z-index -1, pointer-events none)

**Файлы:** [Shell.tsx](superset/superset-frontend/src/views/components/Shell/Shell.tsx) или CSS в [head_custom_extra.html](superset/superset/templates/head_custom_extra.html)

**Проверка:** welcome — видны два мягких цветных orb'а на фоне.

---

## Этап B14. Regression + responsive + финальная сверка

**Checklist:**
- [ ] Цветные токены: `--tang` (в мокапе) = `--c-tangerine` у нас, проверить что все CSS-ссылки корректны
- [ ] `color-mix(in oklab, …)` — совместимость с целевыми браузерами (Chrome 111+, Safari 16.2+). Убедиться что есть.
- [ ] MobileNav на mobile — Home/Catalog/AI/Profile (4 таба), вход в AI = fullscreen
- [ ] Dark mode полная parity с мокапом (light и dark CSS-переменные в head_custom_extra.html)
- [ ] Storybook обновить stories всех новых состояний (compact/focused pill, open drawer, open AI)
- [ ] Полный скриншот-сравнение welcome + dashboard view

---

## Порядок работы

Сначала **Этап A** (skeleton). Потом идём по кнопкам СЛЕВА-НАПРАВО: B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10 → B11 → B12 → B13 → B14.

После каждого этапа:
1. `npm run build-dev` в `superset-node` контейнере
2. `docker compose restart nginx` (если Flask не hot-reload)
3. JS-интроспекция в браузере + скриншот
4. Сравнение с мокапом — исправление расхождений
5. Коммит + push в отдельную ветку `feature/EXT-floating-dock-fix-<этап>`
