# Ant Design v5 → v6 — Inventory Report

**Generated**: 2026-04-20  
**Branch**: `feature/EXT-antd-v6-migration`  
**Baseline tag**: `pre-antd-v6-baseline` (commit `a489397`)  
**Backup branch**: `backup/pre-antd-v6`

Источник правил: [AntD v6 migration guide](https://ant.design/docs/react/migration-v6), `npx @ant-design/cli antd migrate 5 6` (482 строки, 42 шага: 4 auto-fixable, 38 manual).

## КЛЮЧЕВЫЕ НАХОДКИ `antd doctor`

**13 passed, 1 failed**:
- ❌ `[react-compat]` **React 17.0.2 may not be compatible with antd 5.25.4** — antd 5.x **уже требует React 18+**.
- ✓ `@ant-design/icons 5.6.1` installed (придётся поднять до v6 вместе с antd).
- ✓ Нет duplicate antd/dayjs/cssinjs.
- ✓ Theme config без проблем.

**Вывод**: React 18 prerequisite критичен не только для AntD v6 — он уже нужен для корректной работы текущего antd 5.25.4. Текущий проект висит на borderline-совместимости.

## Usage-сводка (`antd usage`)

Отсканировано 3168 файлов. Прямых импортов `from 'antd'` мало (обёрнуто в `@superset-ui/core`):
- **36 компонентов, 55 прямых импортов**: Dropdown (4), Table/Modal/Tooltip/Input (3 каждый), Layout/Alert/ConfigProvider/Button/Flex/Form/Menu/Popover (2 каждый), остальные по 1.
- **28 non-component экспортов**: `theme` (6), типы `LabeledValue`/`RefSelectProps`, `message` (3), и др.
- **Wrapper-слой** `packages/superset-ui-core/src/components/` — главный leverage, >300 внутренних consumers.

## Дополнительные breaking changes от `antd migrate 5 6`

Сверх собранного:
- **`<Button type="primary|dashed|link|text">`** → разложено на `color` + `variant`. Auto-fixable.
- **`<Button danger>`** → `color="danger"`. Auto-fixable.
- **`<Button ghost>`** → `variant="outlined"`. Auto-fixable.

Полный guide: [antd-migrate-5-to-6.md](antd-migrate-5-to-6.md) (42 шага).

---

## Сводка по категориям breaking changes

| Категория | Изменение в v6 | Файлов | Приоритет |
|-----------|----------------|-------:|-----------|
| `destroyTooltipOnHide` | → `destroyOnHidden` | 11 | 🔴 HIGH |
| `destroyOnClose` | → `destroyOnHidden` | 2 | 🔴 HIGH |
| `visible={}` | → `open={}` | 14 | 🔴 HIGH |
| `onVisibleChange` | → `onOpenChange` | 6 + 2 теста | 🔴 HIGH |
| `bordered={}` | → `variant="borderless"/"outlined"` | 7 | 🟡 MED |
| `bodyStyle` / `headStyle` / `maskStyle` / `overlayStyle` | → `styles.body` / `styles.header` / `styles.mask` / `styles.root` | 16 | 🟡 MED |
| `dropdownClassName` / `dropdownRender` / `popupClassName` | → `classNames.popup.root` / `popupRender` | входит в 16 выше | 🟡 MED |
| `Tabs.TabPane` (legacy children API) | → `items` prop | 2 (RoleListEditModal) + обёртка | 🟡 MED |
| `Dropdown.Button` | → `Space.Compact + Dropdown + Button` | 1 wrapper | 🟢 LOW |
| `getPopupContainer` | API сохранён, но DOM строже | 18 | 🟢 VERIFY |
| `styled(...)` targeting `.ant-*` internal classes | DOM в v6 изменён | 36 | 🟡 MED |
| `direction=` на Space/Steps | пока совместим, но в v7 → `orientation` | 16+ | 🟢 LOW |

**Всего рисковых файлов**: ~100 (с учётом пересечений). Wrapper-слой в `packages/superset-ui-core/src/components/` покрывает >300 consumers — приоритет на него.

---

## 1. `destroyTooltipOnHide` (11 файлов)

Переименовано в `destroyOnHidden` в v6.

- [src/dashboard/components/nativeFilters/FilterBar/FilterPresets/PresetButton.tsx:163](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterBar/FilterPresets/PresetButton.tsx)
- [src/explore/components/controls/AnnotationLayerControl/index.tsx:255](superset/superset-frontend/src/explore/components/controls/AnnotationLayerControl/index.tsx)
- [src/explore/components/controls/FilterControl/AdhocFilterPopoverTrigger/index.tsx:112](superset/superset-frontend/src/explore/components/controls/FilterControl/AdhocFilterPopoverTrigger/index.tsx)
- [src/explore/components/controls/ContourControl/ContourPopoverTrigger.tsx:53](superset/superset-frontend/src/explore/components/controls/ContourControl/ContourPopoverTrigger.tsx)
- [src/explore/components/controls/ConditionalFormattingControl/ConditionalFormattingControl.tsx:158,174](superset/superset-frontend/src/explore/components/controls/ConditionalFormattingControl/ConditionalFormattingControl.tsx)
- [src/explore/components/controls/ControlPopover/ControlPopover.tsx:55,173](superset/superset-frontend/src/explore/components/controls/ControlPopover/ControlPopover.tsx)
- [src/explore/components/controls/ControlPopover/ControlPopover.test.tsx:137,168](superset/superset-frontend/src/explore/components/controls/ControlPopover/ControlPopover.test.tsx)
- [src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx:361](superset/superset-frontend/src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx)
- [src/explore/components/controls/DndColumnSelectControl/ColumnSelectPopoverTrigger.tsx:175](superset/superset-frontend/src/explore/components/controls/DndColumnSelectControl/ColumnSelectPopoverTrigger.tsx)
- [src/explore/components/controls/MetricControl/AdhocMetricPopoverTrigger.tsx:266](superset/superset-frontend/src/explore/components/controls/MetricControl/AdhocMetricPopoverTrigger.tsx)

## 2. `destroyOnClose` (2 файла)

- [src/dashboard/components/nativeFilters/FilterBar/FilterPresets/ImportPresetModal.tsx:135](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterBar/FilterPresets/ImportPresetModal.tsx)
- [src/dashboard/components/nativeFilters/FilterBar/FilterPresets/CreatePresetModal.tsx:225](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterBar/FilterPresets/CreatePresetModal.tsx)

## 3. `visible={}` — 14 JSX-потребителей

- [src/SqlLab/components/SaveQuery/index.tsx:215](superset/superset-frontend/src/SqlLab/components/SaveQuery/index.tsx)
- [src/SqlLab/components/ResultSet/index.tsx:337](superset/superset-frontend/src/SqlLab/components/ResultSet/index.tsx)
- [src/explore/components/ExploreChartPanel/index.tsx:485](superset/superset-frontend/src/explore/components/ExploreChartPanel/index.tsx)
- [src/explore/components/DatasourcePanel/index.tsx:325](superset/superset-frontend/src/explore/components/DatasourcePanel/index.tsx)
- [src/explore/components/controls/ColorBreakpointsControl/index.tsx:118](superset/superset-frontend/src/explore/components/controls/ColorBreakpointsControl/index.tsx)
- [src/explore/components/controls/ContourControl/index.tsx:134](superset/superset-frontend/src/explore/components/controls/ContourControl/index.tsx)
- [src/explore/components/controls/DndColumnSelectControl/ColumnSelectPopoverTrigger.tsx:158](superset/superset-frontend/src/explore/components/controls/DndColumnSelectControl/ColumnSelectPopoverTrigger.tsx)
- [src/explore/components/controls/DndColumnSelectControl/DndColumnSelect.tsx:210](superset/superset-frontend/src/explore/components/controls/DndColumnSelectControl/DndColumnSelect.tsx)
- [src/explore/components/controls/DndColumnSelectControl/DndFilterSelect.tsx:464](superset/superset-frontend/src/explore/components/controls/DndColumnSelectControl/DndFilterSelect.tsx)
- [src/explore/components/controls/DndColumnSelectControl/DndMetricSelect.tsx:389](superset/superset-frontend/src/explore/components/controls/DndColumnSelectControl/DndMetricSelect.tsx)
- [src/explore/components/controls/MetricControl/AdhocMetricPopoverTrigger.tsx:248](superset/superset-frontend/src/explore/components/controls/MetricControl/AdhocMetricPopoverTrigger.tsx)

**Примечание**: `src/views/components/Shell/CentralPill.tsx:556` использует `$visible` — Emotion transient prop, НЕ AntD, не трогать.

## 4. `onVisibleChange` (6 прод + 2 теста)

- [src/components/GridTable/HeaderMenu.tsx:44,54,246](superset/superset-frontend/src/components/GridTable/HeaderMenu.tsx) — type `DropdownProps['onOpenChange']` уже намекает на правильное имя
- [src/components/GridTable/Header.tsx:108,190](superset/superset-frontend/src/components/GridTable/Header.tsx)
- [packages/superset-ui-core/src/components/Tooltip/Tooltip.stories.tsx:69](superset/superset-frontend/packages/superset-ui-core/src/components/Tooltip/Tooltip.stories.tsx)
- Tests: HeaderMenu.test.tsx, PageHeaderWithActions.test.tsx

## 5. `bordered={}` (7 файлов)

- [src/pages/UserInfo/index.tsx](superset/superset-frontend/src/pages/UserInfo/index.tsx)
- [src/explore/components/ControlPanelsContainer.tsx](superset/superset-frontend/src/explore/components/ControlPanelsContainer.tsx)
- [src/explore/components/controls/AnnotationLayerControl/index.tsx](superset/superset-frontend/src/explore/components/controls/AnnotationLayerControl/index.tsx)
- [src/dashboard/components/nativeFilters/FilterBar/FiltersOutOfScopeCollapsible/index.tsx](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterBar/FiltersOutOfScopeCollapsible/index.tsx)
- [plugins/plugin-chart-table/src/Styles.tsx](superset/superset-frontend/plugins/plugin-chart-table/src/Styles.tsx)
- [packages/superset-ui-core/src/components/Collapse/Collapse.tsx](superset/superset-frontend/packages/superset-ui-core/src/components/Collapse/Collapse.tsx)
- [packages/superset-ui-core/src/chart-composition/tooltip/TooltipTable.tsx](superset/superset-frontend/packages/superset-ui-core/src/chart-composition/tooltip/TooltipTable.tsx)

Замена: `bordered={false}` → `variant="borderless"`; `bordered={true}` → `variant="outlined"` (дефолт, можно дропнуть).

## 6. `bodyStyle` / `headStyle` / `maskStyle` / `overlayStyle` / `dropdownClassName` / `dropdownRender` / `popupClassName` / `dropdownStyle` (16 файлов)

- [src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx](superset/superset-frontend/src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx)
- [src/features/databases/DatabaseModal/index.tsx](superset/superset-frontend/src/features/databases/DatabaseModal/index.tsx)
- [src/explore/components/controls/ViewQuery.tsx](superset/superset-frontend/src/explore/components/controls/ViewQuery.tsx)
- [src/explore/components/controls/LayerConfigsControl/LayerConfigsControl.tsx](superset/superset-frontend/src/explore/components/controls/LayerConfigsControl/LayerConfigsControl.tsx)
- [src/explore/components/controls/MapViewControl/MapViewControl.tsx](superset/superset-frontend/src/explore/components/controls/MapViewControl/MapViewControl.tsx)
- [src/explore/components/controls/ConditionalFormattingControl/FormattingPopover.tsx](superset/superset-frontend/src/explore/components/controls/ConditionalFormattingControl/FormattingPopover.tsx)
- [src/dashboard/components/nativeFilters/FilterCard/index.tsx](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterCard/index.tsx)
- [src/dashboard/components/nativeFilters/FilterBar/CrossFilters/ScopingModal/ScopingModal.tsx](superset/superset-frontend/src/dashboard/components/nativeFilters/FilterBar/CrossFilters/ScopingModal/ScopingModal.tsx)
- [src/dashboard/components/SliceHeaderControls/index.tsx](superset/superset-frontend/src/dashboard/components/SliceHeaderControls/index.tsx)
- [src/components/ListView/Filters/index.tsx](superset/superset-frontend/src/components/ListView/Filters/index.tsx)
- [src/components/ListView/Filters/Select.tsx](superset/superset-frontend/src/components/ListView/Filters/Select.tsx)
- [src/components/Chart/ChartContextMenu/ChartContextMenu.tsx](superset/superset-frontend/src/components/Chart/ChartContextMenu/ChartContextMenu.tsx)
- [packages/superset-ui-core/src/components/PopoverDropdown/index.tsx](superset/superset-frontend/packages/superset-ui-core/src/components/PopoverDropdown/index.tsx)
- [packages/superset-ui-core/src/components/Modal/FormModal.tsx](superset/superset-frontend/packages/superset-ui-core/src/components/Modal/FormModal.tsx)
- [packages/superset-ui-core/src/components/Dropdown/index.tsx](superset/superset-frontend/packages/superset-ui-core/src/components/Dropdown/index.tsx)
- [packages/superset-ui-core/src/components/DropdownContainer/DropdownContainer.test.tsx](superset/superset-frontend/packages/superset-ui-core/src/components/DropdownContainer/DropdownContainer.test.tsx)

## 7. `Tabs.TabPane` — legacy children API (дроп в v6)

- [src/features/roles/RoleListEditModal.tsx:208–229](superset/superset-frontend/src/features/roles/RoleListEditModal.tsx) — 2 `<Tabs.TabPane>`, мигрировать на `items={[...]}`
- [packages/superset-ui-core/src/components/Tabs/Tabs.tsx:95,132](superset/superset-frontend/packages/superset-ui-core/src/components/Tabs/Tabs.tsx) — обёртка экспортирует `.TabPane`; оставить для обратной совместимости тестов/внешних consumers

## 8. `Dropdown.Button` (1 wrapper)

- [packages/superset-ui-core/src/components/DropdownButton/index.tsx:53–69](superset/superset-frontend/packages/superset-ui-core/src/components/DropdownButton/index.tsx) — рефакторить на `<Space.Compact><Dropdown ... /><Button /></Space.Compact>`

## 9. `getPopupContainer` (18 файлов — API сохранён)

API остался, но v6 строже к detached portal targets — smoke-тест всех.

## 10. `styled(...)` → `.ant-*` (36 файлов — DOM-изменения)

Требуется визуальный regression на каждом файле. Список см. grep выше. Приоритет — переход на token-based стили там, где возможно (правило проекта "Avoid custom css").

## 11. `direction="horizontal"/"vertical"` на `Space`/`Steps` (16+ файлов)

В v6 ещё работает, но deprecated — в будущем `orientation`. Не блокирующее для v6, отложить.

---

## Рекомендуемый порядок ручных правок (Phase 3)

1. **Wrapper-слой** (`packages/superset-ui-core/src/components/`): Modal, Tooltip, Popover, Drawer, Dropdown, Select, Input, Form, Tabs, DropdownButton, Collapse. Один PR — cascade на 300+ consumers.
2. **High-priority rename** (1 regex-sweep в каждом): destroyTooltipOnHide, destroyOnClose, visible→open, onVisibleChange→onOpenChange, bodyStyle→styles.body и т.д. Purely mechanical → codemod + review.
3. **Structural rewrites**: Tabs.TabPane→items, Dropdown.Button→Space.Compact. Ручная работа, 1–2 файла.
4. **Visual regression**: 36 `styled().ant-*` файлов — по одному с Applitools diff.

## Что НЕ правим в этой миграции

- `$visible` (Emotion transient prop) — не AntD.
- `direction=` на Space — пока работает, к v7 будет `orientation`.
- `Tabs.TabPane` обёртка в packages/superset-ui-core/src/components/Tabs/Tabs.tsx — оставить для BC тестов.
