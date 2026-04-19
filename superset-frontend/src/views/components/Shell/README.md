# Shell v2 — Samberi Analytics (Floating Dock)

Shell Apache Superset 6.0, основанный на DS 2.0 и мокапе
`analytics-floating-dock.html`. С миграции на Floating Dock (ветка
`feature/EXT-shell-v2-floating-*`) заменяет классический top-bar Menu на
горизонтальный плавающий dock внизу экрана + морфирующую AI-капсулу
(CentralPill) + bottom sheet drawers + centered AI overlay.

## Архитектура

```
┌───────────────────────────────────────────────────────────┐
│ <App>                                                     │
│  └ <Router>                                               │
│     └ <RootContextProviders>  (DndProvider, Theme, Store) │
│        └ <Shell>                                          │
│           ├ <ShellMain>          padding-bottom:88px      │
│           │   └ <Switch> <Route>…  ← весь контент Superset│
│           ├ <Rail / FloatingDock>  fixed bottom 18px,glass│
│           │   └ <CentralPill>    morphing 280×44↔420×100  │
│           ├ <MobileNav>          <768px: 4-tab bottom bar │
│           ├ <Drawer>             bottom sheet (fixed 76px)│
│           │   └ CatalogDrawer|ToolsDrawer|CreateDrawer    │
│           ├ <SettingsDropdown>   portal, position above   │
│           ├ <CalendarDropdown>   portal, position above   │
│           ├ <ContextPopover>     portal, над CentralPill  │
│           ├ <ModelPopover>       portal, над CentralPill  │
│           ├ <CommandPalette>     portal, Ctrl+K           │
│           └ <AiFullView>         centered 820×640 + scrim │
└───────────────────────────────────────────────────────────┘
```

Shell автоматически скрывается:
- при `URL_PARAMS.uiConfig` с битом hideNav (embedded SDK)
- при `URL_PARAMS.standalone >= HideNav` (iframe, public dashboard links, reports)
- `@media print` — dock/drawer/overlay не печатаются

## Файлы

| Файл | Роль |
|---|---|
| `Shell.tsx` | Оркестратор: state, Dock+MobileNav+Drawer+overlays |
| `Rail.tsx` | FloatingDock: horizontal bottom glass dock с magnification |
| `RailIcons.tsx` | Inline SVG-иконки DS 2.0 |
| `MobileNav.tsx` | Bottom tab bar для <768px (4 иконки) |
| `CentralPill.tsx` | Морфирующая капсула поиск+AI (compact/expanded) |
| `CentralPillTypes.ts` | Типы AiContext/AiModel, DEFAULT_*, AI_MODELS |
| `ContextPopover.tsx` | Popover выбора контекста AI |
| `ModelPopover.tsx` | Popover выбора модели LLM (Haiku/Sonnet/Opus) |
| `Drawer.tsx` | Bottom sheet контейнер (fixed над dock) |
| `CreateDrawer.tsx` | Drawer «Создать» — 7 пунктов навигации |
| `ToolsDrawer.tsx` | Drawer «Инструменты» — SQL Lab, Saved Queries и т.д. |
| `SettingsDropdown.tsx` | Dropdown профиля с menu_data, theme, lang |
| `CalendarDropdown.tsx` | Календарь с подсвечиванием «сегодня» |
| `CommandPalette.tsx` | Ctrl+K с поиском и «Спросить ИИ» |
| `ShellContext.tsx` | React context для drawer-состояния |
| `useMediaQuery.ts` | Хук подписки на CSS media query |
| `types.ts` | Типы `DrawerKind`, `RailButtonDescriptor` |
| `index.ts` | Exports barrel |

Контент drawer'ов и оверлеев живёт отдельно:
- Catalog drawer: `src/features/catalog/`
- Home bento: `src/features/home/bento/`
- AI-чат: `src/features/ai/` (AiFullView — centered 820×640, AiSidebar
  inline в Panel, на mobile скрывается)

## Floating Dock — геометрия (из DS 2.0, `src/theme/ds2Tokens.ts`)

```
--dock-height: 58px         // высота floating pill
--dock-bottom: 18px         // отступ от края viewport
--dock-drawer-bottom: 76px  // drawer над dock'ом
--dock-ai-bottom: 92px      // AI overlay над dock'ом
--dock-dropdown-bottom: 84px// dropdowns над dock'ом
--dock-ai-width: 820px      // ширина AI overlay
--dock-ai-height: 640px     // высота AI overlay
--dock-content-pad: 88px    // padding-bottom ShellMain
--dock-mobile-height: 64px  // высота MobileNav (bottom tab bar)

--pill-compact-w: 280px     // CentralPill (компактный)
--pill-compact-h: 44px
--pill-expanded-w: 420px    // CentralPill (при focus)
--pill-expanded-h: 100px

--magnify-scale: 1.1        // hover scale активной иконки
--magnify-neighbor: 1.05    // соседних (через :has())
--magnify-lift: 4px         // translateY при hover
```

## Liquid Glass material

Dock, drawer, AI overlay, dropdowns используют общий Liquid Glass через
CSS-переменные (светлая/тёмная тема переключаются реактивно через
`[data-theme="dark"]`):

```css
--glass-bg:          rgba(255, 255, 255, 0.85);  /* light */
                     rgba( 23,  26,  30, 0.85);  /* dark */
--glass-filter:      blur(16px) saturate(180%);
--glass-border:      rgba(0, 0, 0, 0.06);        /* light */
--glass-shadow:      0 12px 32px rgba(0, 0, 0, 0.15);
--glass-shadow-elev: 0 20px 60px rgba(0, 0, 0, 0.25);  /* AI overlay */
--glass-scrim:       rgba(0, 0, 0, 0.4);
```

## Z-index иерархия

```
content / ShellMain    auto
Drawer (bottom sheet)  95
AI Scrim               99
AI Panel               100
FloatingDock / MobileNav  101
CommandPalette overlay 105
Dropdowns (popovers)   110
```

Dock выше scrim AI — это специально: пользователь может переключиться
в другой режим без предварительного закрытия overlay-а.

## CentralPill: морфирующая капсула

```
compact (default):              expanded (on focus):
 ┌──────────────────────┐        ┌────────────────────────┐
 │[chip] input     [⌘K] │        │[chip] input        [↑] │
 └──────────────────────┘        │[+] [Haiku 4.5▾] [🎤][⚙]│
                                 └────────────────────────┘
```

- **compact** 280×44: chip контекста, input, `⌘K` hint (когда пусто).
  При наборе текста вместо `⌘K` появляется стрелка `↑` (submit).
- **expanded** 420×100: добавляется tools-row — attach `+`, model picker,
  voice, settings gear.
- **Enter / ↑** → `onSubmit(query, {contextId, modelId})` → Shell открывает
  AI overlay с предзаполненным запросом.
- **Escape** → очищает input и снимает focus.

Контексты (AiContext[]) приходят из `Shell.aiContexts` пропа — по умолчанию
только «Общий». Родительский роут (например дашборд) может передать
расширенный список: «Общий» + «Текущий дашборд» + «Все подключённые чарты».

Модели (AiModelId): `haiku-4.5` (default, быстрая), `sonnet-4.6` (баланс),
`opus-4.7` (максимальное качество). Значение прокидывается в ai-analytics
backend как поле `model` в `POST /api/v1/analyze`.

## Интеграция

```tsx
// src/views/App.tsx
<RootContextProviders>
  <Shell
    user={bootstrapData.user}
    menu={bootstrapData.common.menu_data}
    isFrontendRoute={isFrontendRoute}
    aiContexts={ctxFromBootstrapOrRoute}
  >
    <Switch>
      {routes.map(({ path, Component }) => (
        <Route path={path} key={path}>
          <Component user={bootstrapData.user} />
        </Route>
      ))}
    </Switch>
  </Shell>
  <ToastContainer />
</RootContextProviders>
```

## Подключение ai-analytics LLM

В `superset_config.py`:

```python
AI_BACKEND_URL = "http://ai-analytics:8080"
```

Или через переменную окружения при сборке:

```bash
AI_BACKEND_URL=http://ai-analytics:8080 npm run build
```

Backend ai-analytics (Go) принимает `POST /api/v1/analyze`:

```json
{
  "query": "Какая маржа по мясу?",
  "session_id": "42",
  "context": { "context_id": "dashboard_loss_q1" },
  "model": "haiku-4.5"
}
```

Если URL не задан — AiFullView работает в mock-режиме с жёлтым баннером и
локальным заглушечным ответом про маржу мяса.

## Права и permission-фильтрация

SettingsDropdown читает `bootstrap.common.menu_data.settings` — backend Superset
автоматически фильтрует пункты по правам текущего пользователя.

CatalogFolder и AiChat* API имеют собственные FAB permissions:
- `CatalogFolder.can_read/can_write` — применяется ко всем папкам
- `AiChatFolder/AiChatSession.can_read/can_write` — изолирует по `created_by_fk`

## Дизайн-токены

Все компоненты используют DS 2.0 через `src/theme/ds2.ts`:

```tsx
import { DS2_VARS, DS2_SPACE, DS2_RADIUS } from 'src/theme/ds2';

const Btn = styled.button`
  background: ${DS2_VARS.cSky};
  padding: ${DS2_SPACE.s2}px;
  border-radius: ${DS2_VARS.rPill};
  backdrop-filter: ${DS2_VARS.glassFilter};
`;
```

Ни один компонент Shell не содержит хардкода hex-цветов.

## Keyboard a11y

| Клавиша | Действие |
|---|---|
| `Ctrl+K` / `Cmd+K` | Открыть Command Palette (глобально) |
| `Escape` | Закрыть drawer / palette / dropdown / AI / очистить pill |
| `Enter` в CentralPill | Отправить запрос в AI (с контекстом и моделью) |
| `Tab` в Palette | Передать query в ИИ-аналитик |
| `↑↓ Enter` в Palette | Навигация по результатам |
| `Enter/Space` на rail-кнопке | Активация |
| `Arrow ←→` в Catalog tree | Expand/collapse папки |

## Тесты

```bash
# Shell-компоненты (Rail, Drawer, Shell embedded)
npm test -- src/views/components/Shell/Shell.test.tsx

# CentralPill (submit, popover, морфинг)
npm test -- src/views/components/Shell/CentralPill.test.tsx

# MobileNav (4 tab bar)
npm test -- src/views/components/Shell/MobileNav.test.tsx

# DS 2.0 токены (в т.ч. новые для Floating Dock)
npm test -- src/theme/tests/ds2Tokens.test.ts

# Bento-карточки
npm test -- src/features/home/bento/

# AI-модуль
npm test -- src/features/ai/

# Каталог папок
npm test -- src/features/catalog/
```

## Storybook

```bash
npm run storybook
# Shell/Rail (Default, WithBadges, NoUser)
# Shell/MobileNav (Default, WithBadges)
# Shell/Drawer (Closed, Catalog, Tools, Create)
```

## Ветки миграции (Floating Dock)

Все этапы в отдельных feature-веток для лёгкого rollback:

```
feature/EXT-shell-v2-base                  — baseline до Shell v2
feature/EXT-shell-v2-floating-foundation   — Этап 0: DS 2.0 токены (glass/dock/pill)
feature/EXT-shell-v2-floating-dock         — Этап 1: horizontal dock layout
feature/EXT-shell-v2-central-pill          — Этап 2: CentralPill + popovers
feature/EXT-shell-v2-bottom-sheet          — Этап 3: Drawer bottom sheet
feature/EXT-shell-v2-ai-overlay            — Этап 4: AI centered overlay
feature/EXT-shell-v2-mobile-nav            — Этап 5a: MobileNav <768px
feature/EXT-shell-v2-floating-polish       — Этап 5: z-index + edge cases
feature/EXT-shell-v2-tests-docs            — Этап 6: тесты + Storybook + docs
```

Откат к любой точке: `git checkout feature/EXT-shell-v2-<stage>`.
