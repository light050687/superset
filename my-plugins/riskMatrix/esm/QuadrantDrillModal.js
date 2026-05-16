import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { styled } from '@superset-ui/core';
import { getQuadrant, storeBadness } from './utils/quadrants';
import { ModalBg, Modal, StoreRow, SearchWrap, SearchInput, EmptyBlock } from './styles';
import { useFocusTrap } from './utils/useFocusTrap';
/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */
/** Контейнер для поиска поверх списка квадранта. */
const SearchContainer = styled.div `
  margin-bottom: 10px;
`;
/** Заголовочная строка таблицы объектов квадранта (#, имя, X, бар X, Y, бар Y). */
const StoreListHeader = styled.div `
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  font-family: var(--m);
  /* DS v2.0 P0: 8.5px → --fs-nano (10) UPPER */
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--g500);
  border-bottom: 1px solid var(--g200);
  margin-bottom: 6px;
`;
/** Колонка-ячейка с центрированием. */
const HeaderCellCenter = styled.span `
  text-align: center;
`;
/** Колонка-ячейка с выравниванием вправо. */
const HeaderCellRight = styled.span `
  text-align: right;
`;
/** Подпись «факт vs план» — приглушённая, по центру. */
const HeaderCellMuted = styled.span `
  text-align: center;
  opacity: 0.7;
`;
/** Колонка-обёртка для строк объектов в квадранте. */
const StoreList = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
/** Обёртка SearchWrap, занимающая всю ширину секции. */
const FullWidthSearchWrap = styled(SearchWrap) `
  width: 100%;
`;
const LIMIT = 50;
const QuadrantDrillModal = ({ quadrantKey, quadrants, thresholds, stores, allStoresTotal, formatColorMap, formatX, formatY, formatLoss, formatCount, xShort, yShort, onClose, onOpenStore, }) => {
    const [q, setQ] = useState('');
    const qDef = quadrants[quadrantKey];
    const inQuadrant = useMemo(() => stores.filter((s) => getQuadrant(s, thresholds) === quadrantKey), [stores, thresholds, quadrantKey]);
    const totalLoss = useMemo(() => inQuadrant.reduce((sum, s) => sum + (s.sumLoss ?? 0), 0), [inQuadrant]);
    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        const list = query
            ? inQuadrant.filter((s) => s.name.toLowerCase().includes(query) ||
                (s.city?.toLowerCase().includes(query) ?? false))
            : inQuadrant;
        return [...list].sort((a, b) => storeBadness(b) - storeBadness(a)).slice(0, LIMIT);
    }, [inQuadrant, q]);
    const maxX = useMemo(() => (inQuadrant.length > 0 ? Math.max(...inQuadrant.map((s) => s.x)) * 1.1 : 1), [inQuadrant]);
    const maxY = useMemo(() => inQuadrant.length > 0
        ? Math.max(...inQuadrant.map((s) => Math.max(0, s.y)), 0.1) * 1.1
        : 1, [inQuadrant]);
    const onBgClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    const lossPct = allStoresTotal > 0 ? (inQuadrant.length / allStoresTotal) * 100 : 0;
    const trapRef = useFocusTrap(true);
    return (_jsx(ModalBg, { "data-open": "true", onClick: onBgClick, children: _jsxs(Modal, { role: "dialog", "aria-modal": "true", "aria-labelledby": "sr-quad-title", ref: trapRef, children: [_jsxs("div", { className: "m-head", children: [_jsx("div", { className: "m-status", style: { background: qDef.color } }), _jsxs("div", { className: "m-titles", children: [_jsx("div", { className: "m-title", id: "sr-quad-title", children: qDef.label.replace(/\s[⚠✓]$/, '') }), _jsx("div", { className: "m-sub", children: qDef.description })] }), _jsx("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs("div", { className: "m-summary", children: [_jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: "\u041E\u0431\u044A\u0435\u043A\u0442\u043E\u0432" }), _jsx("div", { className: "m-stat-v", children: formatCount(inQuadrant.length) }), _jsxs("div", { className: "m-stat-d wn", children: [lossPct.toFixed(1), "% \u043E\u0442 \u0432\u0441\u0435\u0445"] })] }), totalLoss > 0 && (_jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E\u0442\u0435\u0440\u044C" }), _jsx("div", { className: "m-stat-v", style: { color: qDef.color }, children: formatLoss(totalLoss) })] })), _jsxs("div", { className: "m-stat", children: [_jsxs("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", xShort] }), _jsx("div", { className: "m-stat-v", children: formatX(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.x, 0) / inQuadrant.length
                                        : 0) })] }), _jsxs("div", { className: "m-stat", children: [_jsxs("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", yShort] }), _jsx("div", { className: "m-stat-v", children: formatY(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.y, 0) / inQuadrant.length
                                        : 0) })] })] }), _jsxs("div", { className: "m-section", children: [_jsxs("div", { className: "m-section-l", children: [_jsx("span", { children: "\u041E\u0431\u044A\u0435\u043A\u0442\u044B \u043A\u0432\u0430\u0434\u0440\u0430\u043D\u0442\u0430" }), _jsx("span", { className: "count", children: q.trim()
                                        ? `${filtered.length} из ${inQuadrant.length} найдено`
                                        : `${inQuadrant.length} всего · показано ${filtered.length}` })] }), _jsx(SearchContainer, { children: _jsxs(FullWidthSearchWrap, { className: q.length > 0 ? 'has-value' : '', children: [_jsxs("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx(SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u0438\u043B\u0438 \u0433\u043E\u0440\u043E\u0434\u0443\u2026", autoComplete: "off", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043E\u0431\u044A\u0435\u043A\u0442\u0430\u043C \u043A\u0432\u0430\u0434\u0440\u0430\u043D\u0442\u0430" }), _jsx("button", { type: "button", className: "search-clear", onClick: () => setQ(''), "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), _jsx("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }) }), filtered.length === 0 ? (_jsxs(EmptyBlock, { children: ["\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", q.trim() ? ` по запросу «${q}»` : ''] })) : (_jsxs(StoreListHeader, { children: [_jsx(HeaderCellCenter, { children: "#" }), _jsx("span", { children: "\u041E\u0431\u044A\u0435\u043A\u0442" }), _jsx(HeaderCellRight, { children: xShort }), _jsx(HeaderCellMuted, { children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" }), _jsx(HeaderCellRight, { children: yShort }), _jsx(HeaderCellMuted, { children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" })] })), _jsx(StoreList, { children: filtered.map((s, i) => {
                                const dx = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
                                const dy = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
                                const dxCls = dx > 0.03 ? 'dn' : dx < -0.03 ? 'up' : 'wn';
                                const dyCls = dy > 0.03 ? 'dn' : dy < -0.03 ? 'up' : 'wn';
                                const xBarPct = (s.x / maxX) * 100;
                                const xTargetPct = s.planX != null ? (s.planX / maxX) * 100 : 0;
                                const yBarPct = (Math.max(0, s.y) / maxY) * 100;
                                const yTargetPct = s.planY != null ? (s.planY / maxY) * 100 : 0;
                                return (_jsxs(StoreRow, { onClick: () => onOpenStore(s.id), title: `${s.name} · ${xShort}: ${formatX(s.x)} · ${yShort}: ${formatY(s.y)}`, role: "button", tabIndex: 0, onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onOpenStore(s.id);
                                        }
                                    }, children: [_jsx("div", { className: "rank", children: String(i + 1).padStart(2, '0') }), _jsxs("div", { className: "name", children: [s.name, s.city && _jsx("span", { className: "city", children: s.city })] }), _jsx("div", { className: `cell-v ${dxCls}`, children: formatX(s.x) }), _jsxs("div", { className: "mini-bullet", children: [_jsx("div", { className: "mini-bar mini-bar--x", style: { width: `${xBarPct}%` } }), s.planX != null && (_jsx("div", { className: "mini-target", style: { left: `calc(${xTargetPct}% - 1px)` } }))] }), _jsx("div", { className: `cell-v ${dyCls}`, children: formatY(s.y) }), _jsxs("div", { className: "mini-bullet", children: [_jsx("div", { className: "mini-bar mini-bar--y", style: { width: `${yBarPct}%` } }), s.planY != null && (_jsx("div", { className: "mini-target", style: { left: `calc(${yTargetPct}% - 1px)` } }))] })] }, s.id));
                            }) })] })] }) }));
};
export default QuadrantDrillModal;
//# sourceMappingURL=QuadrantDrillModal.js.map