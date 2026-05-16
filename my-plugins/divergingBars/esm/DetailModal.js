import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { t } from '@superset-ui/core';
import { ModalOverlay } from './styles';
import { computeTempo, tempoDirection } from './utils/computeTempo';
import { fmtByMetric, fmtSignedPct, fmtTempoText, } from './utils/formatRussian';
/**
 * Большой спарклайн с плавной кривой Безье (порт buildBigSpark).
 * Принимает цвета через palette — нет вызовов getComputedStyle.
 */
const BigSpark = ({ data, tempo, palette }) => {
    const w = 860;
    const h = 160;
    const padL = 12;
    const padR = 12;
    const padT = 16;
    const padB = 28;
    if (!data.length)
        return _jsx("svg", { viewBox: `0 0 ${w} ${h}` });
    const min = Math.min(...data) * 0.88;
    const max = Math.max(...data) * 1.1;
    const range = max - min || 1;
    const sx = (i) => padL + (i / (data.length - 1)) * (w - padL - padR);
    const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
    const pts = data.map((v, i) => ({ x: sx(i), y: sy(v), v }));
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    const areaPath = `${path} L${pts[pts.length - 1].x.toFixed(1)} ${(h - padB).toFixed(1)} L${pts[0].x.toFixed(1)} ${(h - padB).toFixed(1)} Z`;
    const color = tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;
    const gradId = `vd-big-spark-grad-${tempo.toFixed(3).replace(/\./g, '-')}`;
    const labels = [];
    for (let i = 0; i < 12; i += 2) {
        labels.push({ x: sx(i), label: i === 11 ? t('сейчас') : `Н${i + 1}` });
    }
    return (_jsxs("svg", { width: "100%", height: h, viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", overflow: "visible", role: "img", "aria-label": t('Тренд потерь за 12 недель'), children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.3" }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0.02" })] }) }), _jsx("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), _jsx("path", { d: areaPath, fill: `url(#${gradId})` }), _jsx("path", { d: path, fill: "none", stroke: color, strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map((p, i) => (_jsx("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: i === pts.length - 1 ? 3.5 : 2, fill: color, stroke: palette.g50, strokeWidth: i === pts.length - 1 ? 1.5 : 1 }, i))), labels.map(l => (_jsx("text", { x: l.x, y: h - 8, fontFamily: palette.fontMono, fontSize: "11", fill: palette.g600, textAnchor: "middle", children: l.label }, l.label)))] }));
};
const DetailModal = ({ store, metric, horizon, theme, palette, onClose, }) => {
    const overlayRef = useRef(null);
    const closeBtnRef = useRef(null);
    const previousFocus = useRef(null);
    const tr = computeTempo(store, horizon, metric);
    const dir = tempoDirection(tr.tempo);
    const color = dir === 'grow' ? palette.dn : dir === 'shrink' ? palette.up : palette.g600;
    const tCls = dir === 'grow' ? 'dn' : dir === 'shrink' ? 'up' : 'wn';
    /* Escape + focus trap (DS 2.0 §10 + CLAUDE.md a11y). */
    useEffect(() => {
        previousFocus.current = document.activeElement;
        closeBtnRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key === 'Tab' && overlayRef.current) {
                const focusables = overlayRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (!focusables.length)
                    return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            const prev = previousFocus.current;
            if (prev instanceof HTMLElement)
                prev.focus();
        };
    }, [onClose]);
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current)
            onClose();
    };
    const weeks = metric === 'rub' ? store.weeksRub : store.weeksPct;
    const fv = (v) => fmtByMetric(v, metric);
    const signed = tr.pctChange > 0 ? '+' : tr.pctChange < 0 ? '\u2212' : '';
    const trendNote = `${fmtTempoText(tr.tempo)} · ${fmtSignedPct(tr.pctChange)}`;
    return (_jsx(ModalOverlay, { ref: overlayRef, "data-theme": theme, role: "dialog", "aria-modal": "true", "aria-label": `${t('Детализация магазина')} ${store.name}`, onClick: handleOverlayClick, children: _jsxs("div", { className: "vd-modal", children: [_jsxs("div", { className: "m-head", children: [_jsx("div", { className: "m-status", style: { background: color } }), _jsxs("div", { className: "m-titles", children: [_jsx("h3", { className: "m-title", children: store.name }), _jsxs("div", { className: "m-sub", children: [_jsx("span", { className: "m-code", children: store.code }), _jsx("span", { children: store.city }), _jsx("span", { className: "m-dot", "aria-hidden": "true" }), _jsx("span", { children: store.formatName }), _jsx("span", { className: "m-dot", "aria-hidden": "true" }), _jsxs("span", { children: [t('ТО'), " ", store.to, " ", t('млн ₽')] })] })] }), _jsx("button", { type: "button", ref: closeBtnRef, className: "m-close", "aria-label": t('Закрыть'), onClick: onClose, children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs("div", { className: "m-summary", children: [_jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: t('Было') }), _jsx("div", { className: "m-stat-v", children: fv(tr.prev) }), _jsx("div", { className: "m-stat-d", children: t('прошлый период') })] }), _jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: t('Стало') }), _jsx("div", { className: "m-stat-v", children: fv(tr.curr) }), _jsx("div", { className: "m-stat-d", children: t('текущий период') })] }), _jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: t('Темп') }), _jsx("div", { className: "m-stat-v", style: { color }, children: fmtTempoText(tr.tempo) }), _jsx("div", { className: `m-stat-d ${tCls}`, children: fmtSignedPct(tr.pctChange) })] }), _jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: t('Абс. разница') }), _jsxs("div", { className: "m-stat-v", style: { color }, children: [signed, fv(Math.abs(tr.absDelta))] }), _jsx("div", { className: "m-stat-d", children: dir === 'grow'
                                        ? t('прирост')
                                        : dir === 'shrink'
                                            ? t('снижение')
                                            : t('без изменений') })] })] }), _jsxs("div", { className: "m-trend-wrap", children: [_jsxs("div", { className: "m-section-l", children: [_jsx("span", { children: t('Тренд потерь · 12 недель') }), _jsx("span", { className: "right", children: trendNote })] }), _jsx("div", { className: "m-trend-card", children: _jsx(BigSpark, { data: weeks, tempo: tr.tempo, palette: palette }) })] })] }) }));
};
export default DetailModal;
//# sourceMappingURL=DetailModal.js.map