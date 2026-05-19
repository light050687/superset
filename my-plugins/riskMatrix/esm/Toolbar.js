import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Toolbar, ToolbarRow, TbBtn, SelectDd, SelectDdMenu, SelectDdItem, SelectDdWrap, SearchInput, SearchWrap, } from './styles';
/** Toolbar: 3 видимых капсулы — Reset, Mode-Select dropdown (rect/lasso),
    Focus dropdown (worst5/best5/bad/good). Clear появляется условно как 4-я.
    Dropdown pattern из metricTimeSeries: trigger+options в одной капсуле,
    Panel расширяется вниз absolute. */
const ToolbarBar = ({ selectMode, hasFilters, onAction, onReset, onClear, searchQuery, onSearchChange, }) => {
    const [modeOpen, setModeOpen] = useState(false);
    const [focusOpen, setFocusOpen] = useState(false);
    const modeWrapRef = useRef(null);
    const focusWrapRef = useRef(null);
    // Closer-on-outside-click: один глобальный listener закрывает оба dropdown'a
    // если клик произошёл вне их Wrap.
    useEffect(() => {
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
    const pickMode = useCallback((action) => {
        onAction(action);
        setModeOpen(false);
    }, [onAction]);
    const pickFocus = useCallback((action) => {
        onAction(action);
        setFocusOpen(false);
    }, [onAction]);
    return (_jsxs(_Fragment, { children: [_jsxs(ToolbarRow, { children: [_jsx(Toolbar, { role: "toolbar", "aria-label": "\u0421\u0431\u0440\u043E\u0441 \u0432\u0438\u0434\u0430", children: _jsx(TbBtn, { onClick: onReset, title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0438\u0434", type: "button", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0438\u0434", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M2 7 A5 5 0 1 1 7 12" }), _jsx("path", { d: "M2 3 L2 7 L6 7" })] }) }) }), _jsx(SelectDdWrap, { ref: modeWrapRef, "aria-label": "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", children: _jsxs(SelectDd, { "data-open": modeOpen ? 'true' : 'false', role: "menu", children: [_jsx(TbBtn, { className: selectMode ? 'on' : '', onClick: (e) => {
                                        e.stopPropagation();
                                        setModeOpen((v) => !v);
                                        setFocusOpen(false);
                                    }, title: "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", type: "button", "aria-label": "\u0420\u0435\u0436\u0438\u043C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F", "aria-expanded": modeOpen, "aria-haspopup": "menu", children: selectMode === 'lasso' ? (_jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" }), _jsx("circle", { cx: "6.5", cy: "12.5", r: "0.8", fill: "currentColor" })] })) : (_jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeDasharray: "2 2", children: _jsx("rect", { x: "2", y: "3", width: "10", height: "8", rx: "1" }) })) }), modeOpen && (_jsxs(SelectDdMenu, { children: [_jsx(SelectDdItem, { className: selectMode === 'rect' ? 'on' : '', onClick: (e) => {
                                                e.stopPropagation();
                                                pickMode('rect');
                                            }, role: "menuitem", type: "button", title: "\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", "aria-label": "\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0435 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: _jsx("span", { className: "sdd-icon", children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeDasharray: "2 2", children: _jsx("rect", { x: "2", y: "3", width: "10", height: "8", rx: "1" }) }) }) }), _jsx(SelectDdItem, { className: selectMode === 'lasso' ? 'on' : '', onClick: (e) => {
                                                e.stopPropagation();
                                                pickMode('lasso');
                                            }, role: "menuitem", type: "button", title: "\u041B\u0430\u0441\u0441\u043E", "aria-label": "\u041B\u0430\u0441\u0441\u043E", children: _jsx("span", { className: "sdd-icon", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 4 C3 2 11 2 11 5 C11 7 6 8 6 10 C6 11 7 11.5 7 11.5" }), _jsx("circle", { cx: "6.5", cy: "12.5", r: "0.8", fill: "currentColor" })] }) }) })] }))] }) }), _jsx(SelectDdWrap, { ref: focusWrapRef, "aria-label": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440", children: _jsxs(SelectDd, { "data-open": focusOpen ? 'true' : 'false', role: "menu", children: [_jsx(TbBtn, { onClick: (e) => {
                                        e.stopPropagation();
                                        setFocusOpen((v) => !v);
                                        setModeOpen(false);
                                    }, title: "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", type: "button", "aria-label": "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", "aria-expanded": focusOpen, "aria-haspopup": "menu", children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M1.5 3 L12.5 3 L8.5 7.5 L8.5 12 L5.5 11 L5.5 7.5 Z" }) }) }), focusOpen && (_jsxs(SelectDdMenu, { children: [_jsx(SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('worst5');
                                            }, role: "menuitem", type: "button", title: "\u0422\u043E\u043F-5 \u0445\u0443\u0434\u0448\u0438\u0445", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u043E\u043F-5 \u0445\u0443\u0434\u0448\u0438\u0445", children: _jsx("span", { className: "sdd-icon", children: _jsx("svg", { viewBox: "0 0 14 14", fill: "currentColor", stroke: "none", children: _jsx("path", { d: "M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" }) }) }) }), _jsx(SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('best5');
                                            }, role: "menuitem", type: "button", title: "\u0422\u043E\u043F-5 \u043B\u0443\u0447\u0448\u0438\u0445", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u043E\u043F-5 \u043B\u0443\u0447\u0448\u0438\u0445", children: _jsx("span", { className: "sdd-icon", children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", children: _jsx("path", { d: "M7 1 L8.8 5 L13 5.5 L9.9 8.5 L10.7 12.7 L7 10.5 L3.3 12.7 L4.1 8.5 L1 5.5 L5.2 5 Z" }) }) }) }), _jsx(SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('bad');
                                            }, role: "menuitem", type: "button", title: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", children: _jsx("span", { className: "sdd-icon", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M7 2 L13 12 L1 12 Z" }), _jsx("line", { x1: "7", y1: "6", x2: "7", y2: "9" }), _jsx("line", { x1: "7", y1: "11", x2: "7", y2: "11.5" })] }) }) }), _jsx(SelectDdItem, { onClick: (e) => {
                                                e.stopPropagation();
                                                pickFocus('good');
                                            }, role: "menuitem", type: "button", title: "\u041B\u0443\u0447\u0448\u0435 \u043F\u043B\u0430\u043D\u0430", "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u044B \u043B\u0443\u0447\u0448\u0435 \u043F\u043B\u0430\u043D\u0430", children: _jsx("span", { className: "sdd-icon", children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M2 8 L5.5 11 L12 4" }) }) }) })] }))] }) }), hasFilters && (_jsx(Toolbar, { role: "toolbar", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: _jsx(TbBtn, { className: "clear", onClick: onClear, title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", type: "button", "aria-label": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [_jsx("line", { x1: "3", y1: "3", x2: "11", y2: "11" }), _jsx("line", { x1: "11", y1: "3", x2: "3", y2: "11" })] }) }) }))] }), _jsxs(SearchWrap, { className: searchQuery.length > 0 ? 'has-value' : '', children: [_jsxs("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx(SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043E\u0431\u044A\u0435\u043A\u0442\u0430\u2026", autoComplete: "off", value: searchQuery, onChange: (e) => onSearchChange(e.target.value), "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u043E\u0431\u044A\u0435\u043A\u0442\u0430" }), _jsx("button", { type: "button", className: "search-clear", onClick: () => onSearchChange(''), "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), _jsx("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] })] }));
};
export default ToolbarBar;
//# sourceMappingURL=Toolbar.js.map