# InfoHint — shared компонент подсказок по управлению

Канонический источник компонента «i-иконка с tooltip» для всех custom viz-плагинов проекта. Изначально извлечён из `drilldownDonut/src/StructureDonut.tsx` (ADR-0001-совместимая реализация с 44×44 touch target и mobile-first responsive).

## Контракт

```tsx
import { InfoHint, type InfoHintHandle } from './components/InfoHint/InfoHint';

// Минимальный пример
<InfoHint ariaLabel="Подсказка по управлению">
  <span className="hi"><span>Click — выбрать</span></span>
  <span className="hi-sep" aria-hidden="true" />
  <span className="hi"><span>Right Click — меню действий</span></span>
</InfoHint>
```

### Props

| Prop | Тип | Default | Назначение |
|---|---|---|---|
| `ariaLabel` | `string` | — | aria-label кнопки-триггера |
| `children` | `ReactNode` | — | Содержимое tooltip. Используйте классы `.hi`, `.hi-sep`, `.hi-arrow` для consistency. |
| `closeOnEscape` | `boolean` | `true` | Закрывать ли tooltip по Escape. Установите `false` если плагин управляет Escape сам через `ref`. |

### Imperative API (через ref)

```tsx
const infoHintRef = useRef<InfoHintHandle>(null);
// ...
<InfoHint ref={infoHintRef} closeOnEscape={false} ariaLabel="...">...</InfoHint>

// В кастомном Escape handler плагина:
if (infoHintRef.current?.isOpen()) {
  infoHintRef.current.close();
  return; // приоритет: hint закрывается раньше других действий
}
```

| Метод | Назначение |
|---|---|
| `isOpen()` | Открыт ли tooltip |
| `open()` | Программно открыть |
| `close()` | Программно закрыть |

## Поведение

- **Hover** (mouse): tooltip появляется немедленно.
- **Focus-visible** (Tab): tooltip появляется, для keyboard navigation.
- **Click**: toggle (открыть/закрыть).
- **Tap-away** (click outside): закрывает tooltip.
- **Escape**: закрывает tooltip (если `closeOnEscape={true}`, default).

## CSS dependencies

Компонент стилизован через `@superset-ui/core` styled-components. Цвета и шрифты подтягиваются через CSS custom properties с **fallback значениями**:

| Variable | Назначение | Fallback |
|---|---|---|
| `--g500` | base color иконки | `#6B7280` |
| `--g100` | hover background | `#F3F4F6` |
| `--ink` | tooltip background, активный цвет иконки | `#111827` |
| `--s` | tooltip text color | `#FFFFFF` |
| `--c-sky` | focus outline | `#0EA5E9` |
| `--m` | tooltip font-family | system-ui |
| `--fs-micro` | tooltip font-size | `11px` |

Если плагин определяет эти переменные на своём корневом контейнере (`StructureDonutRoot` и аналоги) — InfoHint наследует их через CSS cascade. Если нет — используются fallback'и.

## Positioning

Компонент **самостоятельно не задаёт** `position`, `grid-column`, `justify-self` или внешний margin — это ответственность parent layout'а.

Шаблон для footer-right (как в donut):
```tsx
<Footer style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto' }}>
  ...legend...
  <div style={{ gridColumn: 3, justifySelf: 'end' }}>
    <InfoHint ariaLabel="...">...</InfoHint>
  </div>
</Footer>
```

Шаблон для header-right (absolute):
```tsx
<Header style={{ position: 'relative' }}>
  ...title...
  <div style={{ position: 'absolute', top: 8, right: 8 }}>
    <InfoHint ariaLabel="...">...</InfoHint>
  </div>
</Header>
```

## Sync с canonical

При изменении canonical-файлов **скопировать** их во все плагины:

```bash
# из корня проекта
for plugin in bulletChart divergingBars drilldownDonut leaderboard \
              metricTimeSeries paretoAnalysis pivotHeatmap rankedBars \
              riskMatrix scorecard; do
  cp superset/my-plugins/_shared/info-hint/InfoHint.tsx \
     superset/my-plugins/$plugin/src/components/InfoHint/
  cp superset/my-plugins/_shared/info-hint/styles.ts \
     superset/my-plugins/$plugin/src/components/InfoHint/
done
```

Не делайте локальных правок копий — все правки сначала в canonical, потом sync. Иначе плагины разойдутся.

## Версионирование

Версия отслеживается через комментарий в начале `InfoHint.tsx`: `// @canonical-version: 1.0.0`. При breaking changes — bump major.

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-05-16 | Initial extraction from drilldownDonut |

## See also

- ADR-0001 (mobile-first single layout)
- `Superset_Design_System_v2_1_RU.docx` раздел 04 (Брейкпоинты) и 06 (Tooltip)
- `drilldownDonut/src/StructureDonut.tsx` — reference usage
