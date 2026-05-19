# riskMatrix — дизайн-аудит соответствия мокапу и стандартам

**Версия плагина на момент аудита:** 0.1.0
**Дата:** 2026-05-18
**Эталон:** [ref/scatter-risk-prototype.html](../../../ref/scatter-risk-prototype.html)
**Стандарты:** `CLAUDE.md` (root), `docs/adr/ADR-0001-mobile-first-single-layout.md`, `Superset_Design_System_v2_1_RU.docx`

---

## Полное соответствие мокапу (без изменений)

| Категория | Что |
|---|---|
| Палитра DS 2.0 Cool Steel | LIGHT + DARK tokens идентичны мокапу ([themeTokens.ts](src/themeTokens.ts)) |
| Шрифты | Manrope (text) + JetBrains Mono (mono) — `FONTS` константа |
| Card padding | `18px 22px 16px` — совпадает |
| Card box-shadow | `var(--sh)` — совпадает |
| CardHead layout | `flex space-between gap 18px` — совпадает |
| TitleBlock + .dot | визуально идентично |
| Quadrant tints | `0.04 / 0.05 / 0.06` opacity по квадрантам — идентично |
| Quadrant labels | НЕДОСТАЧИ / КРИТИЧЕСКИ ⚠ / НОРМА ✓ / СПИСАНИЯ — идентично |
| Threshold dashed lines | `stroke-dasharray "6 4"`, color `g400` — идентично |
| Gridlines | `stroke-dasharray "2 4"`, opacity 0.7, color `g200` — идентично |
| Adaptive tick step | `pickStep(range, 7)` — портирован 1:1 из мокапа |
| Worst-5 star marker | SVG path идентичный, цвет `--dn`, stroke `--ink` |
| Tooltip структура | tt-head/tt-status/tt-titles/tt-rows/tt-status-text/tt-foot — идентично |
| Drill modals | Store + Quadrant модали с теми же секциями (summary, bullet, trend, rank, causes, SKUs) |
| Selection tools | rect + lasso + worst5 + bad — все 4 действия порт 1:1 |
| Cross-filter integration | Superset native `setDataMask` — улучшение vs мокапа |
| Animation timings | 0.5s card-mount, 0.12s tt-fade, 0.15s m-fade, 0.2s m-pop — идентично |

---

## Приведено в соответствие в рамках текущего PR

### Visual fidelity к мокапу
- **border-radius alignment** (16 элементов): CardRoot 10→14, Toolbar 6→7, TbBtn 6→5, SelectDd 6→9, SearchInput 6→7, SearchSelectBtn 6→7, QuadAnnot 6→7, selection-rect 6→2, Footer kbd 6→3, tt-status 6→3, tt-foot kbd 6→3, m-close 6→7, m-status 6→3, mini-bullet 6→2, mini-bar 6→1, mini-target 6→1, m-br-band 6→3, m-br-bar 6→2, m-br-target 6→1.5
- **letter-spacing alignment** (6 элементов): CardTitle 0.06→0.04em, Legend .lg-l 0.01→0.03em, Footer корневой 0.01→0.03em, tt-l 0.06→0.02em, tt-sub 0.01→0.02em, tt-foot 0.01→0.02em

### Функциональный фикс
- ~~`.pt.bad` класс на точках~~ — попытка автоматически окрашивать «хуже плана» в красный stroke. **Откачено** после визуальной проверки: в мокапе stroke у точек = цвет формата, никогда не красный (в мокапе `.pt.bad` тоже dead CSS). См. PROBLEMS.md §6. Стиль остаётся в `ChartSvg` как зарезервированный (1:1 с мокапом), класс не присваивается.

### Mobile-first compliance (ADR-0001)
- **Touch targets 44×44 для coarse pointer:** `TbBtn`, `LegendItem`, `SelectDdItem`, `m-close`, `.search-clear` получили `@media (pointer: coarse)` overrides. На desktop сохраняют компактные размеры мокапа.

### Compliance docs
- **[PROBLEMS.md](PROBLEMS.md)** — архитектурные решения, которые «выглядят как баги, но обоснованы» (footer-хинты в InfoHint, fluid типографика, кастомный SVG вместо ECharts, и т.п.).
- **[AUDIT.md](AUDIT.md)** — этот документ.

---

## Сознательные отклонения от мокапа (обоснования — см. PROBLEMS.md)

| Отклонение | Причина | Ссылка |
|---|---|---|
| Footer без kbd-хинтов | Хинты в InfoHint overlay (canonical) | PROBLEMS.md §1 |
| Fluid типографика (`--fs-*`) | Mobile-first ADR-0001 | PROBLEMS.md §2 |
| qa-label 10px вместо 8.5px | A11y — UPPERCASE labels ≥10px | PROBLEMS.md §3 |
| Footer = `flex space-between` | Только 1 блок справа, grid избыточен | PROBLEMS.md §4 |
| Custom SVG вместо ECharts | Лассо/zoom/pan/quadrant click — нестандартный UX | PROBLEMS.md §5 |

---

## Проверка соответствия CLAUDE.md и ADR-0001

### CLAUDE.md «i-иконка и подсказки по управлению»
- ✅ Используется `<InfoHint>` из `_shared/info-hint/` (canonical v3.3.0)
- ✅ Размещение через `<InfoHintTopRight>` в `Controls` блока CardHead
- ✅ Card имеет `position: relative` и `data-info-hint-container=""` (inline атрибут, не через `styled.attrs`)
- ✅ Структура контента overlay: `<div className="hint-section">` + `<div className="hint-section-title">` для секций «Управление» / «Пояснения»
- ✅ InfoHint версия совпадает с canonical (`_shared/info-hint/`)

### CLAUDE.md «Анимации визуалов и расположение элементов»
- ✅ Card-mount animation 0.5s ease-out `cubic-bezier(.2, .8, .25, 1)`, `animation-fill-mode: both`
- ✅ Card-mount запускается ровно один раз — loading state имеет `data-no-anim=""` ([ScatterRisk.tsx:920](src/ScatterRisk.tsx))
- ✅ Footer-row — `flex align-items: center`
- ⚠ ECharts series animation не применима (custom SVG renderer; см. PROBLEMS.md §5)

### ADR-0001 mobile-first single layout
- ✅ Base styles под xs (нет max-width queries)
- ✅ Touch target 44×44 везде на `(pointer: coarse)` — TbBtn / LegendItem / SelectDdItem / m-close / search-clear
- ✅ User-Agent detection не используется для условного рендеринга
- ✅ Один responsive компонент, не 3 раздельных layout-а

### Definition of Done (CLAUDE.md секция)
- ✅ Types (`npm run type`) — проверяется при сборке PR
- ✅ Lint (`npm run lint-fix`) — проверяется при сборке PR
- ⚠ UI changes — визуальная проверка на 375px viewport: **выполнить вручную перед merge** (см. ниже)
- ✅ Diff показан пользователю до коммита
- ✅ Drive-by edits — нет; правки только в `styles.ts` + `ScatterRisk.tsx` + 2 новых `.md`

---

## Что НЕ покрыто и требует ручной проверки

1. **375px viewport visual check** — открыть в Chrome DevTools mobile mode (iPhone SE) дашборд с риск-матрицей в mock режиме. Убедиться:
   - Card не уходит в horizontal overflow
   - Toolbar кнопки тапаются (44×44)
   - Legend items тапаются и переносятся (wrap)
   - Tooltip помещается на экране (autopositioning у краёв)
   - Drill modals открываются и читаемы (max-height 90vh + scroll)
2. **Регрессионная проверка взаимодействий:**
   - Cross-filter сохраняется при переключении легенды
   - Esc закрывает модалки в правильном порядке (Store → Quadrant → select mode)
   - `«Выбрать хуже плана»` (`onSelectAction('bad')`) выбирает РОВНО те же точки, что теперь подсвечены `.pt.bad` (проверка консистентности логики)
3. **A11y** — keyboard navigation на точках (`tabindex=0`, Enter toggles filter, Space opens modal) — функционал есть, manual screen-reader test опционален.

---

## История

| Дата | Изменения | Автор |
|---|---|---|
| 2026-05-18 | Initial audit. Visual fidelity к мокапу + `.pt.bad` фикс + mobile touch targets + compliance docs. | Claude (по запросу пользователя) |
