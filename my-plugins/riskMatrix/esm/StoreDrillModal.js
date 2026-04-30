import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { getQuadrant, storeBadness } from './utils/quadrants';
import { seededRandom, randNormal } from './utils/scales';
import { fetchStoreTrend, fetchStoreCauses, fetchStoreSkus, } from './utils/detailApi';
import { ModalBg, Modal, BulletRow, Skeleton, EmptyBlock } from './styles';
import { formatRussianDeltaAbsEx } from './utils/formatRussian';
import { useFocusTrap } from './utils/useFocusTrap';
const initialAsync = () => ({ loading: true, error: null, data: null });
const StoreDrillModal = ({ storeId, stores, quadrants, thresholds, formatColorMap, formatX, formatY, formatSize, formatLoss, xShort, yShort, sizeUnit, detailQueryParams, onClose, }) => {
    const store = useMemo(() => stores.find((s) => s.id === storeId), [stores, storeId]);
    // Rank in format — вычисляем ДО early return, чтобы не нарушить Rules of Hooks.
    // Если store не найден — возвращаем {rank:0,total:0}.
    const rank = useMemo(() => {
        if (!store)
            return { rank: 0, total: 0 };
        const sameFmt = stores.filter((s) => s.format === store.format);
        const sorted = [...sameFmt].sort((a, b) => storeBadness(b) - storeBadness(a));
        const index = sorted.findIndex((s) => s.id === store.id);
        return { rank: index + 1, total: sameFmt.length };
    }, [stores, store]);
    const [trend, setTrend] = useState(initialAsync());
    const [causes, setCauses] = useState(initialAsync());
    const [skus, setSkus] = useState(initialAsync());
    // Lazy-load detail API
    useEffect(() => {
        let cancelled = false;
        const loadTrend = async () => {
            if (!detailQueryParams.datasetId || !detailQueryParams.trendTimeColumn || !detailQueryParams.trendMetric) {
                // Fallback: синтетический trend из текущего значения
                const rng = seededRandom(hashId(storeId) + 13);
                const end = store?.x ?? 0;
                const noise = end * 0.12;
                const out = [];
                const weeks = detailQueryParams.trendWeeks || 12;
                for (let i = 0; i < weeks; i++) {
                    const progress = i / (weeks - 1);
                    const val = end * (0.75 + progress * 0.25) + randNormal(rng, 0, noise);
                    out.push({ t: `w-${weeks - 1 - i}`, value: +val.toFixed(3) });
                }
                out[weeks - 1] = { t: 'now', value: end };
                if (!cancelled)
                    setTrend({ loading: false, error: null, data: out });
                return;
            }
            try {
                const data = await fetchStoreTrend(detailQueryParams, storeId);
                if (!cancelled)
                    setTrend({ loading: false, error: null, data });
            }
            catch (e) {
                if (!cancelled)
                    setTrend({
                        loading: false,
                        error: e instanceof Error ? e.message : 'Ошибка загрузки trend',
                        data: null,
                    });
            }
        };
        const loadCauses = async () => {
            if (!detailQueryParams.datasetId || !detailQueryParams.causesDimension || !detailQueryParams.causesMetric) {
                if (!cancelled)
                    setCauses({ loading: false, error: null, data: [] });
                return;
            }
            try {
                const data = await fetchStoreCauses(detailQueryParams, storeId);
                if (!cancelled)
                    setCauses({ loading: false, error: null, data });
            }
            catch (e) {
                if (!cancelled)
                    setCauses({
                        loading: false,
                        error: e instanceof Error ? e.message : 'Ошибка загрузки причин',
                        data: null,
                    });
            }
        };
        const loadSkus = async () => {
            if (!detailQueryParams.datasetId || !detailQueryParams.skusDimension || !detailQueryParams.skusMetric) {
                if (!cancelled)
                    setSkus({ loading: false, error: null, data: [] });
                return;
            }
            try {
                const data = await fetchStoreSkus(detailQueryParams, storeId);
                if (!cancelled)
                    setSkus({ loading: false, error: null, data });
            }
            catch (e) {
                if (!cancelled)
                    setSkus({
                        loading: false,
                        error: e instanceof Error ? e.message : 'Ошибка загрузки SKU',
                        data: null,
                    });
            }
        };
        setTrend(initialAsync());
        setCauses(initialAsync());
        setSkus(initialAsync());
        loadTrend();
        loadCauses();
        loadSkus();
        return () => {
            cancelled = true;
        };
    }, [storeId, detailQueryParams, store]);
    if (!store)
        return null;
    const q = getQuadrant(store, thresholds);
    const qDef = quadrants[q];
    const qColor = qDef.color;
    // Абсолютная разница в единицах метрики (для отображения в п.п., если метрика — %).
    // Класс подсвечивает статус на основе относительной разницы от плана (threshold 3%).
    const dxAbs = store.planX != null ? store.x - store.planX : null;
    const dyAbs = store.planY != null ? store.y - store.planY : null;
    const dxRatio = store.planX != null && store.planX !== 0 ? (store.x - store.planX) / store.planX : null;
    const dyRatio = store.planY != null && store.planY !== 0 ? (store.y - store.planY) / store.planY : null;
    const dxCls = dxRatio != null ? (dxRatio > 0.03 ? 'dn' : dxRatio < -0.03 ? 'up' : 'wn') : 'wn';
    const dyCls = dyRatio != null ? (dyRatio > 0.03 ? 'dn' : dyRatio < -0.03 ? 'up' : 'wn') : 'wn';
    const rankPct = rank.total > 0 ? (rank.rank / rank.total) * 100 : 0;
    const onBgClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    const trapRef = useFocusTrap(true);
    return (_jsx(ModalBg, { "data-open": "true", onClick: onBgClick, style: { zIndex: 1100 }, children: _jsxs(Modal, { role: "dialog", "aria-modal": "true", "aria-labelledby": "sr-store-title", ref: trapRef, children: [_jsxs("div", { className: "m-head", children: [_jsx("div", { className: "m-status", style: { background: qColor } }), _jsxs("div", { className: "m-titles", children: [_jsx("div", { className: "m-title", id: "sr-store-title", children: store.name }), _jsxs("div", { className: "m-sub", children: [store.formatName, store.city ? ` · ${store.city}` : ''] })] }), _jsx("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs("div", { className: "m-summary", children: [_jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: xShort }), _jsx("div", { className: "m-stat-v", children: formatX(store.x) }), dxAbs != null && (_jsxs("div", { className: `m-stat-d ${dxCls}`, children: [formatRussianDeltaAbsEx(dxAbs, 2, 'п.п.'), " \u043A \u043F\u043B\u0430\u043D\u0443"] }))] }), _jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: yShort }), _jsx("div", { className: "m-stat-v", children: formatY(store.y) }), dyAbs != null && (_jsxs("div", { className: `m-stat-d ${dyCls}`, children: [formatRussianDeltaAbsEx(dyAbs, 2, 'п.п.'), " \u043A \u043F\u043B\u0430\u043D\u0443"] }))] }), _jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: sizeUnit || 'Размер' }), _jsx("div", { className: "m-stat-v", children: formatSize(store.size) })] }), store.sumLoss != null && (_jsxs("div", { className: "m-stat", children: [_jsx("div", { className: "m-stat-l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E\u0442\u0435\u0440\u044C" }), _jsx("div", { className: "m-stat-v", style: { color: 'var(--dn)' }, children: formatLoss(store.sumLoss) })] }))] }), (store.planX != null || store.planY != null) && (_jsxs("div", { className: "m-section", children: [_jsx("div", { className: "m-section-l", children: _jsx("span", { children: "Bullet chart \u00B7 \u0424\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" }) }), store.planX != null && (_jsx(ModalBullet, { label: xShort, val: store.x, plan: store.planX, color: "var(--c-tangerine)", formatter: formatX })), store.planY != null && (_jsx(ModalBullet, { label: yShort, val: Math.max(0, store.y), plan: store.planY, color: "var(--c-sky)", formatter: formatY }))] })), _jsxs("div", { className: "m-grid-2col", children: [_jsxs("div", { className: "m-section", children: [_jsxs("div", { className: "m-section-l", children: [_jsx("span", { children: "\u0422\u0440\u0435\u043D\u0434" }), trend.data && trend.data.length > 0 && (_jsx("span", { className: "count", children: formatX(trend.data[trend.data.length - 1].value) }))] }), _jsxs("div", { style: {
                                        background: 'var(--g50)',
                                        border: '1px solid var(--g200)',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        minHeight: 120,
                                    }, children: [trend.loading && _jsx(Skeleton, { style: { height: 90 } }), !trend.loading && trend.error && (_jsxs(EmptyBlock, { style: { color: 'var(--dn)' }, children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", trend.error] })), !trend.loading && !trend.error && trend.data && trend.data.length > 0 && (_jsx(TrendSpark, { data: trend.data, color: "var(--c-tangerine)" })), !trend.loading && !trend.error && trend.data && trend.data.length === 0 && (_jsx(EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434" }))] })] }), _jsxs("div", { className: "m-section", children: [_jsx("div", { className: "m-section-l", children: _jsx("span", { children: "\u041F\u043E\u0437\u0438\u0446\u0438\u044F \u0441\u0440\u0435\u0434\u0438 \u0444\u043E\u0440\u043C\u0430\u0442\u0430" }) }), _jsxs("div", { style: {
                                        background: 'var(--g50)',
                                        border: '1px solid var(--g200)',
                                        borderRadius: 10,
                                        padding: '14px 16px',
                                    }, children: [_jsxs("div", { style: {
                                                fontFamily: 'var(--f)',
                                                fontSize: 26,
                                                fontWeight: 800,
                                                color: 'var(--ink)',
                                                letterSpacing: '-0.02em',
                                                lineHeight: 1,
                                            }, children: ["#", rank.rank, _jsxs("span", { style: { fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginLeft: 4 }, children: ["\u0438\u0437 ", rank.total] })] }), _jsxs("div", { style: {
                                                fontFamily: 'var(--m)',
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                color: 'var(--g500)',
                                                marginTop: 6,
                                            }, children: ["\u041C\u0435\u0441\u0442\u043E \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u00AB", store.formatName, "\u00BB"] }), _jsxs("div", { style: {
                                                height: 6,
                                                background: 'var(--g200)',
                                                borderRadius: 2,
                                                marginTop: 10,
                                                position: 'relative',
                                            }, children: [_jsx("div", { style: {
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        height: '100%',
                                                        width: '100%',
                                                        background: 'linear-gradient(90deg, var(--dn) 0%, var(--wn) 50%, var(--up) 100%)',
                                                        opacity: 0.3,
                                                        borderRadius: 2,
                                                    } }), _jsx("div", { style: {
                                                        position: 'absolute',
                                                        top: -3,
                                                        width: 2.5,
                                                        height: 12,
                                                        background: 'var(--ink)',
                                                        borderRadius: 1,
                                                        left: `calc(${100 - rankPct}% - 1.25px)`,
                                                    } })] }), _jsxs("div", { style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginTop: 4,
                                                fontFamily: 'var(--m)',
                                                fontSize: 8.5,
                                                color: 'var(--g500)',
                                            }, children: [_jsx("span", { children: "\u0425\u0443\u0434\u0448\u0438\u0435" }), _jsx("span", { children: "\u041B\u0443\u0447\u0448\u0438\u0435" })] })] })] })] }), detailQueryParams.causesDimension && (_jsxs("div", { className: "m-section", children: [_jsx("div", { className: "m-section-l", children: _jsx("span", { children: "\u0422\u043E\u043F \u043F\u0440\u0438\u0447\u0438\u043D\u044B" }) }), causes.loading && _jsx(Skeleton, { style: { height: 80 } }), !causes.loading && causes.error && (_jsxs(EmptyBlock, { style: { color: 'var(--dn)' }, children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", causes.error] })), !causes.loading && !causes.error && causes.data && causes.data.length === 0 && (_jsx(EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u0445" })), !causes.loading && !causes.error && causes.data && causes.data.length > 0 && (_jsx(CauseList, { rows: causes.data, formatter: formatLoss }))] })), detailQueryParams.skusDimension && (_jsxs("div", { className: "m-section", children: [_jsx("div", { className: "m-section-l", children: _jsx("span", { children: "\u0422\u043E\u043F SKU" }) }), skus.loading && _jsx(Skeleton, { style: { height: 80 } }), !skus.loading && skus.error && (_jsxs(EmptyBlock, { style: { color: 'var(--dn)' }, children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", skus.error] })), !skus.loading && !skus.error && skus.data && skus.data.length === 0 && (_jsx(EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E SKU" })), !skus.loading && !skus.error && skus.data && skus.data.length > 0 && (_jsx(SkuList, { rows: skus.data, formatter: formatLoss }))] }))] }) }));
};
const ModalBullet = ({ label, val, plan, color, formatter }) => {
    const maxScale = Math.max(val, plan, plan * 1.5) * 1.1 || 1;
    const barPct = (val / maxScale) * 100;
    const targetPct = (plan / maxScale) * 100;
    const ratio = plan !== 0 ? val / plan : 1;
    const status = ratio <= 0.95 ? 'up' : ratio >= 1.05 ? 'dn' : 'wn';
    const valColor = status === 'up' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : 'var(--wn)';
    return (_jsxs(BulletRow, { children: [_jsx("div", { className: "m-br-label", children: label }), _jsxs("div", { className: "m-br-chart", children: [_jsx("div", { className: "m-br-band m-br-band-1", style: { width: '100%' } }), _jsx("div", { className: "m-br-band m-br-band-2", style: { width: `${targetPct}%` } }), _jsx("div", { className: "m-br-band m-br-band-3", style: { width: `${targetPct * 0.8}%` } }), _jsx("div", { className: "m-br-bar", style: { width: `${barPct}%`, background: color } }), _jsx("div", { className: "m-br-target", style: { left: `calc(${targetPct}% - 1.25px)` } })] }), _jsxs("div", { className: "m-br-val", style: { color: valColor }, children: [formatter(val), _jsxs("span", { className: "plan-note", children: ["\u0446\u0435\u043B\u044C: ", formatter(plan)] })] })] }));
};
const TrendSpark = ({ data, color, }) => {
    const w = 340;
    const h = 110;
    const padL = 8;
    const padR = 8;
    const padT = 8;
    const padB = 22;
    const min = Math.min(...data.map((p) => p.value)) * 0.9;
    const max = Math.max(...data.map((p) => p.value)) * 1.05;
    const range = max - min || 1;
    const sx = (i) => padL + (i / Math.max(data.length - 1, 1)) * (w - padL - padR);
    const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
    const pts = data.map((p, i) => ({ x: sx(i), y: sy(p.value), val: p.value }));
    let path = pts.length > 0 ? `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}` : '';
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    const areaPath = pts.length > 0
        ? path +
            ` L${pts[pts.length - 1].x.toFixed(1)} ${(h - padB).toFixed(1)} L${pts[0].x.toFixed(1)} ${(h - padB).toFixed(1)} Z`
        : '';
    const gradId = `trend-grad-${Math.random().toString(36).slice(2, 8)}`;
    return (_jsxs("svg", { width: "100%", height: h, viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.35" }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0.02" })] }) }), _jsx("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: "var(--g200)", strokeWidth: "1" }), areaPath && _jsx("path", { d: areaPath, fill: `url(#${gradId})` }), path && _jsx("path", { d: path, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map((p, i) => {
                const isLast = i === pts.length - 1;
                return (_jsx("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: isLast ? 3 : 1.8, fill: color, stroke: "var(--g50)", strokeWidth: isLast ? 1.5 : 1 }, i));
            })] }));
};
const CauseList = ({ rows, formatter, }) => {
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: rows.map((r, i) => {
            const pct = (r.value / max) * 100;
            return (_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) minmax(140px, 1fr) 80px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: 'var(--g50)',
                    border: '1px solid var(--g200)',
                    borderRadius: 7,
                }, children: [_jsx("div", { style: {
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }, children: r.name }), _jsx("div", { style: { height: 6, background: 'var(--g200)', borderRadius: 2, position: 'relative' }, children: _jsx("div", { style: {
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${pct}%`,
                                background: 'var(--c-sky)',
                                borderRadius: 2,
                            } }) }), _jsx("div", { style: {
                            fontFamily: 'var(--m)',
                            fontSize: 11,
                            fontWeight: 700,
                            textAlign: 'right',
                        }, children: formatter(r.value) })] }, i));
        }) }));
};
const SkuList = ({ rows, formatter }) => {
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 5 }, children: rows.map((r, i) => {
            const pct = (r.value / max) * 100;
            return (_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '22px minmax(0,1fr) minmax(120px, 1fr) 80px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '7px 12px',
                    background: 'var(--g50)',
                    border: '1px solid var(--g200)',
                    borderRadius: 7,
                }, children: [_jsx("div", { style: {
                            fontFamily: 'var(--m)',
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--g500)',
                            textAlign: 'center',
                        }, children: String(i + 1).padStart(2, '0') }), _jsx("div", { style: {
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }, children: r.name }), _jsx("div", { style: { height: 5, background: 'var(--g200)', borderRadius: 2, position: 'relative' }, children: _jsx("div", { style: {
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${pct}%`,
                                background: 'var(--dn)',
                                borderRadius: 2,
                            } }) }), _jsx("div", { style: { fontFamily: 'var(--m)', fontSize: 10.5, fontWeight: 700, textAlign: 'right' }, children: formatter(r.value) })] }, i));
        }) }));
};
function hashId(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++)
        h = (h * 31 + id.charCodeAt(i)) | 0;
    return Math.abs(h);
}
export default StoreDrillModal;
//# sourceMappingURL=StoreDrillModal.js.map