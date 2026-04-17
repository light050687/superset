# Shell v2 — Samberi Analytics

Новый shell Apache Superset 6.0, основанный на дизайн-документе DS 2.0 и мокапе
`ref/samberi-analytics-v6.html`. Заменяет классический top-bar Menu на вертикальный
Rail (56px) + выдвижной Drawer (220px) + полноэкранные overlay-ы (AI, Command Palette).

## Архитектура

```
┌───────────────────────────────────────────────────────────┐
│ <App>                                                     │
│  └ <Router>                                               │
│     └ <RootContextProviders>  (DndProvider, Theme, Store) │
│        └ <Shell>                    ← этот модуль         │
│           ├ <Rail>                  56px, вертикальный    │
│           ├ <Drawer>                220px, contextual     │
│           │   └ CatalogDrawer | ToolsDrawer | CreateDrawer│
│           ├ <ShellMain>             flex:1                │
│           │   └ <Switch> { <Route>… }  ← все Superset-стр │
│           ├ <SettingsDropdown>      portal, dropdown      │
│           ├ <CommandPalette>        portal, Ctrl+K        │
│           └ <AiFullView>            overlay, AI-чат       │
└───────────────────────────────────────────────────────────┘
```

Shell автоматически скрывается:
- при `URL_PARAMS.uiConfig` с битом hideNav (embedded SDK)
- при `URL_PARAMS.standalone >= 1` (iframe, public dashboard links, reports)
- `@media print` — Rail/Drawer не печатаются

## Файлы

| Файл | Роль |
|---|---|
| `Shell.tsx` | Оркестратор: state, Rail+Drawer+overlays |
| `Rail.tsx` | Вертикальный rail с 9 кнопками |
| `RailIcons.tsx` | Inline SVG-иконки DS 2.0 |
| `Drawer.tsx` | Контейнер для drawer-контента |
| `CreateDrawer.tsx` | Drawer «Создать» — 7 пунктов навигации |
| `ToolsDrawer.tsx` | Drawer «Инструменты» — 7 ссылок (SQL Lab, Saved Queries…) |
| `SettingsDropdown.tsx` | Dropdown профиля с menu_data, theme toggle, lang |
| `CommandPalette.tsx` | Ctrl+K с поиском и «Спросить ИИ» |
| `ShellContext.tsx` | React context для drawer-состояния |
| `types.ts` | Типы `DrawerKind`, `RailButtonDescriptor` |
| `index.ts` | Exports barrel |

Контент drawer'ов и оверлеев живёт отдельно:
- Catalog drawer: `src/features/catalog/`
- Home bento: `src/features/home/bento/`
- AI-чат: `src/features/ai/`

## Интеграция

```tsx
// src/views/App.tsx
<RootContextProviders>
  <Shell
    user={bootstrapData.user}
    menu={bootstrapData.common.menu_data}
    isFrontendRoute={isFrontendRoute}
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

Если URL не задан — AiFullView работает в mock-режиме с жёлтым баннером и
локальным заглушечным ответом про маржу мяса.

## Права и permission-фильтрация

SettingsDropdown читает `bootstrap.common.menu_data.settings` — backend Superset
автоматически фильтрует пункты по правам текущего пользователя. Если у пользователя
нет `can_list Role`, пункт «Роли» в dropdown не появится.

CatalogFolder и AiChat* API (Этап 2) имеют собственные FAB permissions:
- `CatalogFolder.can_read/can_write` — применяется ко всем папкам
- `AiChatFolder/AiChatSession.can_read/can_write` — изолирует по `created_by_fk`

## Дизайн-токены

Все компоненты используют DS 2.0 через `src/theme/ds2.ts`:

```tsx
import { DS2_VARS, DS2_SPACE, DS2_RADIUS } from 'src/theme/ds2';

const Btn = styled.button`
  background: ${DS2_VARS.cSky};       // #3B8BD9 / #5CAAF0 (dark)
  padding: ${DS2_SPACE.s2}px;          // 8px
  border-radius: ${DS2_RADIUS.control}px; // 6px
`;
```

Ни один компонент Shell не содержит хардкода hex-цветов.

## Keyboard a11y

| Клавиша | Действие |
|---|---|
| `Ctrl+K` / `Cmd+K` | Открыть Command Palette (глобально) |
| `Escape` | Закрыть drawer / palette / dropdown / AI |
| `Tab` в Palette | Передать query в ИИ-аналитик |
| `↑↓ Enter` в Palette | Навигация по результатам |
| `Enter/Space` на rail-кнопке | Активация |
| `Arrow ←→` в Catalog tree | Expand/collapse папки |

## Тесты

```bash
# Shell-компоненты
npm test -- src/views/components/Shell/

# Bento-карточки
npm test -- src/features/home/bento/

# AI-модуль
npm test -- src/features/ai/

# Каталог папок
npm test -- src/features/catalog/
```

## Откат

Все этапы в отдельных ветках для лёгкого rollback:

```
feature/EXT-shell-v2-base              — baseline до всех изменений
feature/EXT-shell-v2-foundation        — Этап 0: DS 2.0 токены
feature/EXT-shell-v2-rail              — Этап 1: Rail + Drawer shell
feature/EXT-catalog-folders-backend    — Этап 2: backend папок
feature/EXT-catalog-drawer             — Этап 3: Catalog drawer + D&D
feature/EXT-home-bento                 — Этап 4: Home bento
feature/EXT-settings-dropdown          — Этап 5: Settings dropdown
feature/EXT-create-cmdpalette          — Этап 6: Create + Command Palette
feature/EXT-ai-interface               — Этап 7: AI interface
feature/EXT-shell-dashboard            — Этап 8: Dashboard регрессии
feature/EXT-shell-polish               — Этап 9: docs + деплой
```

Откат к любой точке: `git checkout feature/EXT-<stage>`.
