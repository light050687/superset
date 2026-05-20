"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("@superset-ui/core");
const quadrants_1 = require("./utils/quadrants");
const styles_1 = require("./styles");
const useFocusTrap_1 = require("./utils/useFocusTrap");
/** ListModal — расширение Modal для drill-листа с пагинацией. Modal сам
    скроллит весь контент (overflow-y:auto), но в drill-листе нужен
    фиксированный header/summary + scrollable список + фиксированный
    pagination-footer. Поэтому здесь overflow:hidden + flex column. */
const Modal = (0, core_1.styled)(styles_1.Modal) `
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .m-head,
  .m-summary,
  .m-section > .m-section-l {
    flex-shrink: 0;
  }
  .m-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    margin-bottom: 0;
  }
`;
/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */
/** Контейнер для поиска поверх списка квадранта. */
const SearchContainer = core_1.styled.div `
  margin-bottom: 10px;
`;
/** Заголовочная строка таблицы объектов квадранта (#, имя, X, бар X, Y, бар Y). */
const StoreListHeader = core_1.styled.div `
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  font-family: var(--m);
  /* DS v2.1 §02+§10: ≥10px UPPER, letter-spacing 0.05-0.08em, цвет --g600
     (--g500 запрещён для <14px текста). */
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--g600);
  border-bottom: 1px solid var(--g200);
  margin-bottom: 6px;
  flex-shrink: 0;
`;
/** Колонка-ячейка с центрированием. */
const HeaderCellCenter = core_1.styled.span `
  text-align: center;
`;
/** Колонка-ячейка с выравниванием вправо. */
const HeaderCellRight = core_1.styled.span `
  text-align: right;
`;
/** Подпись «факт vs план» — приглушённая, по центру. */
const HeaderCellMuted = core_1.styled.span `
  text-align: center;
  opacity: 0.7;
`;
/** Колонка-обёртка для строк объектов. flex:1 + overflow-y:auto — единственная
    scrollable область внутри Modal (m-section flex column); header, search,
    pagination остаются фиксированными выше/ниже. */
const StoreList = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;
/** Обёртка SearchWrap, занимающая всю ширину секции. */
const FullWidthSearchWrap = (0, core_1.styled)(styles_1.SearchWrap) `
  width: 100%;
`;
/** Search-row — единая капсула, внутри которой «Точно» toggle и search input
    разделены тонкой вертикальной чертой (border-right у ExactMatchLabel).
    Внешний border/bg даёт сам SearchRow; дочерние SearchInput/wrap — без
    собственных border (overridden ниже). */
const SearchRow = core_1.styled.div `
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  margin-bottom: 10px;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.12s var(--ease);

  &:hover {
    border-color: var(--g300);
  }
  &:focus-within {
    border-color: var(--c-sky);
  }

  /* Дочерний SearchInput внутри SearchRow — без собственных border/bg/radius
     (родительская SearchRow capsule даёт визуальный контейнер). */
  input {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    height: 32px;
  }
`;
/** Toggle «Точно» (exact match) — inline-секция внутри SearchRow, разделена
    с search input тонкой вертикальной чертой справа. */
const ExactMatchLabel = core_1.styled.label `
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-right: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--g500);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--c-sky);
    cursor: pointer;
    margin: 0;
  }
`;
/** Кликабельный заголовок колонки — sort при click, ↑/↓ индикатор активной
    сортировки. На hover — цвет ink (более контрастный). */
const SortableHeader = core_1.styled.button `
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  /* DS §10: <14px минимум --g600 (--g500 запрещён). */
  color: var(--g600);
  cursor: pointer;
  text-align: inherit;

  &:hover {
    color: var(--ink);
  }
  &.active {
    color: var(--c-sky);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;
/** Pagination bar — нормальный flex-item внизу m-section (вне scrollable
    StoreList), всегда видна и до самого низа закрашена bg --s. */
const PaginationBar = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 12px;
  padding: 10px 0 4px;
  background: var(--s);
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--g500);
`;
const PageBtn = core_1.styled.button `
  appearance: none;
  background: var(--g100);
  border: 1px solid var(--g200);
  color: var(--ink);
  border-radius: 5px;
  padding: 4px 10px;
  cursor: pointer;
  font: inherit;
  transition: background 0.12s var(--ease), border-color 0.12s var(--ease);

  &:hover:not(:disabled) {
    background: var(--g200);
    border-color: var(--g300);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const PAGE_SIZE = 50;
const QuadrantDrillModal = ({ quadrantKey, quadrants, thresholds, stores, allStoresTotal, formatColorMap, formatX, formatY, formatLoss, formatCount, xShort, yShort, onClose, onOpenStore, selectionIds, selectionTitle, selectionSubtitle, }) => {
    const [q, setQ] = (0, react_1.useState)('');
    // Точный поиск (exact match): сравнение по === вместо includes. Toggle
    // через checkbox «Точно» рядом с search input.
    const [exactMatch, setExactMatch] = (0, react_1.useState)(false);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(0);
    // По умолчанию сортируем по имени по алфавиту.
    const [sortColumn, setSortColumn] = (0, react_1.useState)('name');
    const [sortDirection, setSortDirection] = (0, react_1.useState)('asc');
    const isSelection = !!selectionIds;
    // qDef нужен только в quadrant-режиме (для color/label/description).
    // В selection-режиме используем neutral header (--c-sky accent).
    const qDef = !isSelection && quadrantKey ? quadrants[quadrantKey] : null;
    const inGroup = (0, react_1.useMemo)(() => {
        if (isSelection && selectionIds) {
            const setIds = new Set(selectionIds);
            return stores.filter((s) => setIds.has(s.id));
        }
        if (quadrantKey) {
            return stores.filter((s) => (0, quadrants_1.getQuadrant)(s, thresholds) === quadrantKey);
        }
        return [];
    }, [stores, thresholds, quadrantKey, isSelection, selectionIds]);
    // Alias inQuadrant → inGroup для минимального touch'а ниже.
    const inQuadrant = inGroup;
    const totalLoss = (0, react_1.useMemo)(() => inQuadrant.reduce((sum, s) => sum + (s.sumLoss ?? 0), 0), [inQuadrant]);
    // Полный отсортированный/отфильтрованный список (без pagination cut).
    const sorted = (0, react_1.useMemo)(() => {
        const query = q.trim().toLowerCase();
        let list = inQuadrant;
        if (query) {
            list = inQuadrant.filter((s) => {
                const name = s.name.toLowerCase();
                if (exactMatch)
                    return name === query;
                return name.includes(query);
            });
        }
        const sign = sortDirection === 'asc' ? 1 : -1;
        return [...list].sort((a, b) => {
            let cmp = 0;
            switch (sortColumn) {
                case 'name':
                    cmp = a.name.localeCompare(b.name, 'ru');
                    break;
                case 'x':
                    cmp = a.x - b.x;
                    break;
                case 'y':
                    cmp = a.y - b.y;
                    break;
            }
            return cmp * sign;
        });
    }, [inQuadrant, q, exactMatch, sortColumn, sortDirection]);
    // Slice по pagination.
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages - 1);
    const filtered = (0, react_1.useMemo)(() => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE), [sorted, safePage]);
    // Сброс на первую страницу при изменении поиска/сортировки/режима.
    (0, react_1.useEffect)(() => {
        setCurrentPage(0);
    }, [q, exactMatch, sortColumn, sortDirection]);
    const handleSort = (col) => {
        if (sortColumn === col) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortColumn(col);
            setSortDirection(col === 'name' ? 'asc' : 'desc');
        }
    };
    const sortIcon = (col) => {
        if (sortColumn !== col)
            return '';
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };
    const maxX = (0, react_1.useMemo)(() => (inQuadrant.length > 0 ? Math.max(...inQuadrant.map((s) => s.x)) * 1.1 : 1), [inQuadrant]);
    const maxY = (0, react_1.useMemo)(() => inQuadrant.length > 0
        ? Math.max(...inQuadrant.map((s) => Math.max(0, s.y)), 0.1) * 1.1
        : 1, [inQuadrant]);
    const onBgClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    const lossPct = allStoresTotal > 0 ? (inQuadrant.length / allStoresTotal) * 100 : 0;
    const trapRef = (0, useFocusTrap_1.useFocusTrap)(true);
    return ((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { "data-open": "true", onClick: onBgClick, children: (0, jsx_runtime_1.jsxs)(Modal, { role: "dialog", "aria-modal": "true", "aria-labelledby": "sr-quad-title", ref: trapRef, children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-status", style: { background: qDef ? qDef.color : 'var(--c-sky)' } }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-title", id: "sr-quad-title", children: qDef
                                        ? qDef.label.replace(/\s[⚠✓]$/, '')
                                        : selectionTitle ?? 'Выбранные магазины' }), (0, jsx_runtime_1.jsx)("div", { className: "m-sub", children: qDef
                                        ? qDef.description
                                        : selectionSubtitle ?? 'Магазины, применённые как cross-filter' })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u041E\u0431\u044A\u0435\u043A\u0442\u043E\u0432" }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatCount(inQuadrant.length) }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-d wn", children: [lossPct.toFixed(1), "% \u043E\u0442 \u0432\u0441\u0435\u0445"] })] }), totalLoss > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E\u0442\u0435\u0440\u044C" }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", style: { color: qDef ? qDef.color : 'var(--c-sky)' }, children: formatLoss(totalLoss) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", xShort] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatX(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.x, 0) / inQuadrant.length
                                        : 0) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", yShort] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatY(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.y, 0) / inQuadrant.length
                                        : 0) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-section-l", children: [(0, jsx_runtime_1.jsx)("span", { children: isSelection ? 'Выделенные объекты' : 'Объекты квадранта' }), (0, jsx_runtime_1.jsx)("span", { className: "count", children: q.trim()
                                        ? `${sorted.length} из ${inQuadrant.length} найдено · показано ${filtered.length}`
                                        : `${inQuadrant.length} всего · показано ${filtered.length}` })] }), (0, jsx_runtime_1.jsxs)(SearchRow, { children: [(0, jsx_runtime_1.jsxs)(ExactMatchLabel, { title: "\u0421\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0442\u044C \u0438\u043C\u044F \u0442\u043E\u0447\u043D\u043E (==), \u0430 \u043D\u0435 \u043A\u0430\u043A \u043F\u043E\u0434\u0441\u0442\u0440\u043E\u043A\u0443", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: exactMatch, onChange: (e) => setExactMatch(e.target.checked) }), "\u0422\u043E\u0447\u043D\u043E"] }), (0, jsx_runtime_1.jsxs)(FullWidthSearchWrap, { className: q.length > 0 ? 'has-value' : '', children: [(0, jsx_runtime_1.jsxs)("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)(styles_1.SearchInput, { type: "text", placeholder: exactMatch
                                                ? 'Точный поиск по имени…'
                                                : 'Поиск по имени…', autoComplete: "off", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043E\u0431\u044A\u0435\u043A\u0442\u0430\u043C" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "search-clear", onClick: () => setQ(''), "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] })] }), filtered.length === 0 ? ((0, jsx_runtime_1.jsxs)(styles_1.EmptyBlock, { children: ["\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", q.trim() ? ` по запросу «${q}»` : ''] })) : ((0, jsx_runtime_1.jsxs)(StoreListHeader, { children: [(0, jsx_runtime_1.jsxs)(SortableHeader, { type: "button", onClick: () => handleSort('name'), className: sortColumn === 'name' ? 'active' : '', title: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430", children: ["\u041E\u0431\u044A\u0435\u043A\u0442", sortIcon('name')] }), (0, jsx_runtime_1.jsx)(SortableHeader, { type: "button", onClick: () => handleSort('x'), className: sortColumn === 'x' ? 'active' : '', title: `Сортировка по ${xShort}`, children: (0, jsx_runtime_1.jsxs)(HeaderCellRight, { children: [xShort, sortIcon('x')] }) }), (0, jsx_runtime_1.jsx)(HeaderCellMuted, { children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)(SortableHeader, { type: "button", onClick: () => handleSort('y'), className: sortColumn === 'y' ? 'active' : '', title: `Сортировка по ${yShort}`, children: (0, jsx_runtime_1.jsxs)(HeaderCellRight, { children: [yShort, sortIcon('y')] }) }), (0, jsx_runtime_1.jsx)(HeaderCellMuted, { children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" })] })), (0, jsx_runtime_1.jsx)(StoreList, { children: filtered.map((s, i) => {
                                const color = formatColorMap.get(s.format) || 'var(--g500)';
                                const dx = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
                                const dy = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
                                const dxCls = dx > 0.03 ? 'dn' : dx < -0.03 ? 'up' : 'wn';
                                const dyCls = dy > 0.03 ? 'dn' : dy < -0.03 ? 'up' : 'wn';
                                const xBarPct = (s.x / maxX) * 100;
                                const xTargetPct = s.planX != null ? (s.planX / maxX) * 100 : 0;
                                const yBarPct = (Math.max(0, s.y) / maxY) * 100;
                                const yTargetPct = s.planY != null ? (s.planY / maxY) * 100 : 0;
                                return ((0, jsx_runtime_1.jsxs)(styles_1.StoreRow, { onClick: () => onOpenStore(s.id), role: "button", tabIndex: 0, onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onOpenStore(s.id);
                                        }
                                    }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "name", title: s.name, children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: color } }), (0, jsx_runtime_1.jsx)("span", { className: "label", children: s.name })] }), (0, jsx_runtime_1.jsx)("div", { className: `cell-v ${dxCls}`, title: s.planX != null
                                                ? `${xShort}: ${formatX(s.x)} (план ${formatX(s.planX)}, отклонение ${(dx * 100).toFixed(1)}%)`
                                                : `${xShort}: ${formatX(s.x)}`, children: formatX(s.x) }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", title: s.planX != null
                                                ? `${formatX(s.x)} vs план ${formatX(s.planX)}`
                                                : `${formatX(s.x)} (план не задан)`, children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar mini-bar--x", style: { width: `${xBarPct}%` } }), s.planX != null && ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: { left: `calc(${xTargetPct}% - 1px)` } }))] }), (0, jsx_runtime_1.jsx)("div", { className: `cell-v ${dyCls}`, title: s.planY != null
                                                ? `${yShort}: ${formatY(s.y)} (план ${formatY(s.planY)}, отклонение ${(dy * 100).toFixed(1)}%)`
                                                : `${yShort}: ${formatY(s.y)}`, children: formatY(s.y) }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", title: s.planY != null
                                                ? `${formatY(s.y)} vs план ${formatY(s.planY)}`
                                                : `${formatY(s.y)} (план не задан)`, children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar mini-bar--y", style: { width: `${yBarPct}%` } }), s.planY != null && ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: { left: `calc(${yTargetPct}% - 1px)` } }))] })] }, s.id));
                            }) }), totalPages > 1 && ((0, jsx_runtime_1.jsxs)(PaginationBar, { children: [(0, jsx_runtime_1.jsx)(PageBtn, { type: "button", onClick: () => setCurrentPage((p) => Math.max(0, p - 1)), disabled: safePage === 0, "aria-label": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430", children: "\u2190" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", safePage + 1, " \u0438\u0437 ", totalPages] }), (0, jsx_runtime_1.jsx)(PageBtn, { type: "button", onClick: () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1)), disabled: safePage >= totalPages - 1, "aria-label": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430", children: "\u2192" })] }))] })] }) }));
};
exports.default = QuadrantDrillModal;
//# sourceMappingURL=QuadrantDrillModal.js.map