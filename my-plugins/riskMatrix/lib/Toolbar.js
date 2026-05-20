"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("./styles");
/** Toolbar: 3 видимых капсулы — Reset, Mode-Select dropdown (rect/lasso),
    Focus dropdown (worst5/best5/bad/good). Clear появляется условно как 4-я.
    Dropdown pattern из metricTimeSeries: trigger+options в одной капсуле,
    Panel расширяется вниз absolute. */
const ToolbarBar = ({ selectMode, hasFilters, onAction, onReset, onClear, onShowSelection, searchQuery, onSearchChange, }) => {
    const [modeOpen, setModeOpen] = (0, react_1.useState)(false);
    const [focusOpen, setFocusOpen] = (0, react_1.useState)(false);
    const modeWrapRef = (0, react_1.useRef)(null);
    const focusWrapRef = (0, react_1.useRef)(null);
    // Closer-on-outside-click: один глобальный listener закрывает оба dropdown'a
    // если клик произошёл вне их Wrap.
    (0, react_1.useEffect)(() => {
        if (!modeOpen && !focusOpen)
            return;
        const onDocClick = (e) => {
            const target = e.target;
            if (modeOpen && modeWrapRef.current && !modeWrapRef.current.contains(target)) {
                setModeOpen(false);
            }
            if (focusOpen && focusWrapRef.current && !focusWrapRef.current.contains(target)) {
                setFocusOpen(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [modeOpen, focusOpen]);
    const pickMode = (0, react_1.useCallback)((action) => {
        onAction(action);
        setModeOpen(false);
    }, [onAction]);
    const pickFocus = (0, react_1.useCallback)((action) => {
        onAction(action);
        setFocusOpen(false);
    }, [onAction]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ToolbarRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.Toolbar, { role: "toolbar", "aria-label": "\u0421\u0431\u0440\u043E\u0441 \u0432\u0438\u0434\u0430", children: (0, jsx_runtime_1.jsx)(styles_1.TbBtn, { onClick: onReset, title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0438\u0434", type: "button", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0438\u0434", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 7 A5 5 0 1 1 7 12" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 3 L2 7 L6 7" })] }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdWrap, { ref: modeWrapRef, "aria-label": "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", children: (0, jsx_runtime_1.jsxs)(styles_1.SelectDd, { "data-open": modeOpen ? 'true' : 'false', role: "menu", children: [(0, jsx_runtime_1.jsx)(styles_1.TbBtn, { className: selectMode ? 'on' : '', onClick: (e) => {
                                        e.stopPropagation();
                                        setModeOpen((v) => !v);
                                        setFocusOpen(false);
                                    }, title: "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", type: "button", "aria-label": "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", "aria-expanded": modeOpen, "aria-haspopup": "menu", children: selectMode === 'lasso' ? ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" }), (0, jsx_runtime_1.jsx)("circle", { cx: "6.5", cy: "12.5", r: "0.8", fill: "currentColor" })] })) : ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeDasharray: "2 2", children: (0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "10", height: "8", rx: "1" }) })) }), modeOpen && ((0, jsx_runtime_1.jsxs)(styles_1.SelectDdMenu, { children: [(0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { className: selectMode === 'rect' ? 'on' : '', onClick: (e) => {
                                                e.stopPropagation();
                                                pickMode('rect');
                                            }, role: "menuitem", type: "button", title: "\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", "aria-label": "\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeDasharray: "2 2", children: (0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "10", height: "8", rx: "1" }) }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { className: selectMode === 'lasso' ? 'on' : '', onClick: (e) => {
                                                e.stopPropagation();
                                                pickMode('lasso');
                                            }, role: "menuitem", type: "button", title: "\u041B\u0430\u0441\u0441\u043E", "aria-label": "\u041B\u0430\u0441\u0441\u043E", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" }), (0, jsx_runtime_1.jsx)("circle", { cx: "6.5", cy: "12.5", r: "0.8", fill: "currentColor" })] }) }) })] }))] }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdWrap, { ref: focusWrapRef, "aria-label": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440", children: (0, jsx_runtime_1.jsxs)(styles_1.SelectDd, { "data-open": focusOpen ? 'true' : 'false', role: "menu", children: [(0, jsx_runtime_1.jsx)(styles_1.TbBtn, { onClick: (e) => {
                                        e.stopPropagation();
                                        setFocusOpen((v) => !v);
                                        setModeOpen(false);
                                    }, title: "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", type: "button", "aria-label": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", "aria-expanded": focusOpen, "aria-haspopup": "menu", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M1.5 3 L12.5 3 L8.5 7.5 L8.5 12 L5.5 11 L5.5 7.5 Z" }) }) }), focusOpen && ((0, jsx_runtime_1.jsxs)(styles_1.SelectDdMenu, { children: [(0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('worst5');
                                            }, role: "menuitem", type: "button", title: "\u0422\u043E\u043F-5 \u0445\u0443\u0434\u0448\u0438\u0445", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u043E\u043F-5 \u0445\u0443\u0434\u0448\u0438\u0445", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "currentColor", stroke: "none", children: (0, jsx_runtime_1.jsx)("path", { d: "M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" }) }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('best5');
                                            }, role: "menuitem", type: "button", title: "\u0422\u043E\u043F-5 \u043B\u0443\u0447\u0448\u0438\u0445", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u043E\u043F-5 \u043B\u0443\u0447\u0448\u0438\u0445", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" }) }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('bad');
                                            }, role: "menuitem", type: "button", title: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M7 2 L13 12 L1 12 Z" }), (0, jsx_runtime_1.jsx)("line", { x1: "7", y1: "6", x2: "7", y2: "9" }), (0, jsx_runtime_1.jsx)("line", { x1: "7", y1: "11", x2: "7", y2: "11.5" })] }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('good');
                                            }, role: "menuitem", type: "button", title: "\u041B\u0443\u0447\u0448\u0435 \u043F\u043B\u0430\u043D\u0430", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u043B\u0443\u0447\u0448\u0435 \u043F\u043B\u0430\u043D\u0430", children: (0, jsx_runtime_1.jsx)("span", { className: "sdd-icon", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 8 L5.5 11 L12 4" }) }) }) })] }))] }) }), onShowSelection && ((0, jsx_runtime_1.jsx)(styles_1.Toolbar, { role: "toolbar", "aria-label": "\u0421\u043F\u0438\u0441\u043E\u043A \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", children: (0, jsx_runtime_1.jsx)(styles_1.TbBtn, { onClick: onShowSelection, title: hasFilters
                                ? 'Список выделенных магазинов'
                                : 'Список всех магазинов на графике', type: "button", "aria-label": hasFilters
                                ? 'Открыть список выделенных магазинов'
                                : 'Открыть список всех магазинов', children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "3", y1: "4", x2: "11", y2: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "3", y1: "7", x2: "11", y2: "7" }), (0, jsx_runtime_1.jsx)("line", { x1: "3", y1: "10", x2: "11", y2: "10" }), (0, jsx_runtime_1.jsx)("circle", { cx: "1.5", cy: "4", r: "0.5", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "1.5", cy: "7", r: "0.5", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "1.5", cy: "10", r: "0.5", fill: "currentColor", stroke: "none" })] }) }) })), hasFilters && ((0, jsx_runtime_1.jsx)(styles_1.Toolbar, { role: "toolbar", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: (0, jsx_runtime_1.jsx)(styles_1.TbBtn, { className: "clear", onClick: onClear, title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", type: "button", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "3", y1: "3", x2: "11", y2: "11" }), (0, jsx_runtime_1.jsx)("line", { x1: "11", y1: "3", x2: "3", y2: "11" })] }) }) }))] }), (0, jsx_runtime_1.jsxs)(styles_1.SearchWrap, { className: searchQuery.length > 0 ? 'has-value' : '', children: [(0, jsx_runtime_1.jsxs)("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)(styles_1.SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043E\u0431\u044A\u0435\u043A\u0442\u0430\u2026", autoComplete: "off", value: searchQuery, onChange: (e) => onSearchChange(e.target.value), "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u043E\u0431\u044A\u0435\u043A\u0442\u0430" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "search-clear", onClick: () => onSearchChange(''), "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] })] }));
};
exports.default = ToolbarBar;
//# sourceMappingURL=Toolbar.js.map