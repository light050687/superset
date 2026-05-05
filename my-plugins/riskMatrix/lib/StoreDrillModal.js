"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("@superset-ui/core");
const quadrants_1 = require("./utils/quadrants");
const scales_1 = require("./utils/scales");
const detailApi_1 = require("./utils/detailApi");
const styles_1 = require("./styles");
const formatRussian_1 = require("./utils/formatRussian");
const useFocusTrap_1 = require("./utils/useFocusTrap");
/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */
/** ModalBg для store-модали: поверх quadrant-модали (z-index выше). */
const StoreModalBg = (0, core_1.styled)(styles_1.ModalBg) `
  z-index: 1100;
`;
/** Значение «Сумма потерь» — красным акцентом. */
const LossValue = core_1.styled.div `
  color: var(--dn);
`;
/** Inline EmptyBlock для секции с ошибкой загрузки. */
const ErrorEmpty = (0, core_1.styled)(styles_1.EmptyBlock) `
  color: var(--dn);
`;
/** Skeleton фиксированной высоты под спарклайн trend. */
const TrendSkeleton = (0, core_1.styled)(styles_1.Skeleton) `
  height: 90px;
`;
/** Skeleton под список причин/SKU. */
const ListSkeleton = (0, core_1.styled)(styles_1.Skeleton) `
  height: 80px;
`;
/** Контейнер trend-спарклайна: серый бэкграунд + рамка. */
const TrendBox = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;
  min-height: 120px;
`;
/** Контейнер «Позиция среди формата» с padding/border. */
const RankBox = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 14px 16px;
`;
/** Большой номер ранга. */
const RankNumber = core_1.styled.div `
  /* DS v2.0 fluid: --fs-hero (28-56) для большого номера ранга */
  font-family: var(--f);
  font-size: var(--fs-hero);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;
/** Подпись «из N» рядом с номером ранга. */
const RankTotal = core_1.styled.span `
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g500);
  margin-left: 4px;
`;
/** Подпись «Место в формате …». */
const RankCaption = core_1.styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g500);
  margin-top: 6px;
`;
/** Полоса-индикатор позиции (контейнер). */
const RankTrack = core_1.styled.div `
  height: 6px;
  background: var(--g200);
  border-radius: 2px;
  margin-top: 10px;
  position: relative;
`;
/** Цветной градиент-фон поверх трека (плохо → хорошо). */
const RankGradient = core_1.styled.div `
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--dn) 0%,
    var(--wn) 50%,
    var(--up) 100%
  );
  opacity: 0.3;
  border-radius: 2px;
`;
/** Маркер позиции (только left позиция — динамическая, остальное static). */
const RankMarker = core_1.styled.div `
  position: absolute;
  top: -3px;
  width: 2.5px;
  height: 12px;
  background: var(--ink);
  border-radius: 1px;
`;
/** Подписи «Худшие/Лучшие» под полосой ранга. */
const RankLegend = core_1.styled.div `
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-family: var(--m);
  /* DS v2.0 P0: 8.5px → --fs-nano (10) UPPER */
  font-size: var(--fs-nano);
  color: var(--g500);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
/** Колонка-обёртка списка причин. */
const CauseListWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
/** Строка причины: # | имя | бар | значение. */
const CauseListRow = core_1.styled.div `
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 1fr) 80px;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 7px;
`;
/** Имя причины — обрезается с многоточием. */
const CauseName = core_1.styled.div `
  font-size: var(--fs-meta);
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
/** Дорожка для бара причины. */
const CauseTrack = core_1.styled.div `
  height: 6px;
  background: var(--g200);
  border-radius: 2px;
  position: relative;
`;
/** Заполнитель бара причины (width — динамический, в inline). */
const CauseFill = core_1.styled.div `
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--c-sky);
  border-radius: 2px;
`;
/** Значение причины — справа. */
const CauseValue = core_1.styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
/** Колонка-обёртка списка SKU. */
const SkuListWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 5px;
`;
/** Строка SKU: # | имя | бар | значение. */
const SkuListRow = core_1.styled.div `
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) minmax(120px, 1fr) 80px;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 7px;
`;
/** Номер позиции SKU. */
const SkuRank = core_1.styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--g500);
  text-align: center;
`;
/** Имя SKU. */
const SkuName = core_1.styled.div `
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
/** Дорожка для бара SKU. */
const SkuTrack = core_1.styled.div `
  height: 5px;
  background: var(--g200);
  border-radius: 2px;
  position: relative;
`;
/** Заполнитель бара SKU. */
const SkuFill = core_1.styled.div `
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--dn);
  border-radius: 2px;
`;
/** Значение SKU — справа. */
const SkuValue = core_1.styled.div `
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
const initialAsync = () => ({ loading: true, error: null, data: null });
const StoreDrillModal = ({ storeId, stores, quadrants, thresholds, formatColorMap, formatX, formatY, formatSize, formatLoss, xShort, yShort, sizeUnit, detailQueryParams, onClose, }) => {
    const store = (0, react_1.useMemo)(() => stores.find((s) => s.id === storeId), [stores, storeId]);
    // Rank in format — вычисляем ДО early return, чтобы не нарушить Rules of Hooks.
    // Если store не найден — возвращаем {rank:0,total:0}.
    const rank = (0, react_1.useMemo)(() => {
        if (!store)
            return { rank: 0, total: 0 };
        const sameFmt = stores.filter((s) => s.format === store.format);
        const sorted = [...sameFmt].sort((a, b) => (0, quadrants_1.storeBadness)(b) - (0, quadrants_1.storeBadness)(a));
        const index = sorted.findIndex((s) => s.id === store.id);
        return { rank: index + 1, total: sameFmt.length };
    }, [stores, store]);
    const [trend, setTrend] = (0, react_1.useState)(initialAsync());
    const [causes, setCauses] = (0, react_1.useState)(initialAsync());
    const [skus, setSkus] = (0, react_1.useState)(initialAsync());
    // Lazy-load detail API
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        const loadTrend = async () => {
            if (!detailQueryParams.datasetId || !detailQueryParams.trendTimeColumn || !detailQueryParams.trendMetric) {
                // Fallback: синтетический trend из текущего значения
                const rng = (0, scales_1.seededRandom)(hashId(storeId) + 13);
                const end = store?.x ?? 0;
                const noise = end * 0.12;
                const out = [];
                const weeks = detailQueryParams.trendWeeks || 12;
                for (let i = 0; i < weeks; i++) {
                    const progress = i / (weeks - 1);
                    const val = end * (0.75 + progress * 0.25) + (0, scales_1.randNormal)(rng, 0, noise);
                    out.push({ t: `w-${weeks - 1 - i}`, value: +val.toFixed(3) });
                }
                out[weeks - 1] = { t: 'now', value: end };
                if (!cancelled)
                    setTrend({ loading: false, error: null, data: out });
                return;
            }
            try {
                const data = await (0, detailApi_1.fetchStoreTrend)(detailQueryParams, storeId);
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
                const data = await (0, detailApi_1.fetchStoreCauses)(detailQueryParams, storeId);
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
                const data = await (0, detailApi_1.fetchStoreSkus)(detailQueryParams, storeId);
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
    const q = (0, quadrants_1.getQuadrant)(store, thresholds);
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
    const trapRef = (0, useFocusTrap_1.useFocusTrap)(true);
    return ((0, jsx_runtime_1.jsx)(StoreModalBg, { "data-open": "true", onClick: onBgClick, children: (0, jsx_runtime_1.jsxs)(styles_1.Modal, { role: "dialog", "aria-modal": "true", "aria-labelledby": "sr-store-title", ref: trapRef, children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-status", style: { background: qColor } }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-title", id: "sr-store-title", children: store.name }), (0, jsx_runtime_1.jsxs)("div", { className: "m-sub", children: [store.formatName, store.city ? ` · ${store.city}` : ''] })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: xShort }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatX(store.x) }), dxAbs != null && ((0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dxCls}`, children: [(0, formatRussian_1.formatRussianDeltaAbsEx)(dxAbs, 2, 'п.п.'), " \u043A \u043F\u043B\u0430\u043D\u0443"] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: yShort }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatY(store.y) }), dyAbs != null && ((0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dyCls}`, children: [(0, formatRussian_1.formatRussianDeltaAbsEx)(dyAbs, 2, 'п.п.'), " \u043A \u043F\u043B\u0430\u043D\u0443"] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: sizeUnit || 'Размер' }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatSize(store.size) })] }), store.sumLoss != null && ((0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E\u0442\u0435\u0440\u044C" }), (0, jsx_runtime_1.jsx)(LossValue, { className: "m-stat-v", children: formatLoss(store.sumLoss) })] }))] }), (store.planX != null || store.planY != null) && ((0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-section-l", children: (0, jsx_runtime_1.jsx)("span", { children: "Bullet chart \u00B7 \u0424\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" }) }), store.planX != null && ((0, jsx_runtime_1.jsx)(ModalBullet, { label: xShort, val: store.x, plan: store.planX, color: "var(--c-tangerine)", formatter: formatX })), store.planY != null && ((0, jsx_runtime_1.jsx)(ModalBullet, { label: yShort, val: Math.max(0, store.y), plan: store.planY, color: "var(--c-sky)", formatter: formatY }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "m-grid-2col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-section-l", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0422\u0440\u0435\u043D\u0434" }), trend.data && trend.data.length > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "count", children: formatX(trend.data[trend.data.length - 1].value) }))] }), (0, jsx_runtime_1.jsxs)(TrendBox, { children: [trend.loading && (0, jsx_runtime_1.jsx)(TrendSkeleton, {}), !trend.loading && trend.error && ((0, jsx_runtime_1.jsxs)(ErrorEmpty, { children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", trend.error] })), !trend.loading && !trend.error && trend.data && trend.data.length > 0 && ((0, jsx_runtime_1.jsx)(TrendSpark, { data: trend.data, color: "var(--c-tangerine)" })), !trend.loading && !trend.error && trend.data && trend.data.length === 0 && ((0, jsx_runtime_1.jsx)(styles_1.EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434" }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-section-l", children: (0, jsx_runtime_1.jsx)("span", { children: "\u041F\u043E\u0437\u0438\u0446\u0438\u044F \u0441\u0440\u0435\u0434\u0438 \u0444\u043E\u0440\u043C\u0430\u0442\u0430" }) }), (0, jsx_runtime_1.jsxs)(RankBox, { children: [(0, jsx_runtime_1.jsxs)(RankNumber, { children: ["#", rank.rank, (0, jsx_runtime_1.jsxs)(RankTotal, { children: ["\u0438\u0437 ", rank.total] })] }), (0, jsx_runtime_1.jsxs)(RankCaption, { children: ["\u041C\u0435\u0441\u0442\u043E \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u00AB", store.formatName, "\u00BB"] }), (0, jsx_runtime_1.jsxs)(RankTrack, { children: [(0, jsx_runtime_1.jsx)(RankGradient, {}), (0, jsx_runtime_1.jsx)(RankMarker, { style: { left: `calc(${100 - rankPct}% - 1.25px)` } })] }), (0, jsx_runtime_1.jsxs)(RankLegend, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0425\u0443\u0434\u0448\u0438\u0435" }), (0, jsx_runtime_1.jsx)("span", { children: "\u041B\u0443\u0447\u0448\u0438\u0435" })] })] })] })] }), detailQueryParams.causesDimension && ((0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-section-l", children: (0, jsx_runtime_1.jsx)("span", { children: "\u0422\u043E\u043F \u043F\u0440\u0438\u0447\u0438\u043D\u044B" }) }), causes.loading && (0, jsx_runtime_1.jsx)(ListSkeleton, {}), !causes.loading && causes.error && ((0, jsx_runtime_1.jsxs)(ErrorEmpty, { children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", causes.error] })), !causes.loading && !causes.error && causes.data && causes.data.length === 0 && ((0, jsx_runtime_1.jsx)(styles_1.EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u0445" })), !causes.loading && !causes.error && causes.data && causes.data.length > 0 && ((0, jsx_runtime_1.jsx)(CauseList, { rows: causes.data, formatter: formatLoss }))] })), detailQueryParams.skusDimension && ((0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-section-l", children: (0, jsx_runtime_1.jsx)("span", { children: "\u0422\u043E\u043F SKU" }) }), skus.loading && (0, jsx_runtime_1.jsx)(ListSkeleton, {}), !skus.loading && skus.error && ((0, jsx_runtime_1.jsxs)(ErrorEmpty, { children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", skus.error] })), !skus.loading && !skus.error && skus.data && skus.data.length === 0 && ((0, jsx_runtime_1.jsx)(styles_1.EmptyBlock, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E SKU" })), !skus.loading && !skus.error && skus.data && skus.data.length > 0 && ((0, jsx_runtime_1.jsx)(SkuList, { rows: skus.data, formatter: formatLoss }))] }))] }) }));
};
const ModalBullet = ({ label, val, plan, color, formatter }) => {
    const maxScale = Math.max(val, plan, plan * 1.5) * 1.1 || 1;
    const barPct = (val / maxScale) * 100;
    const targetPct = (plan / maxScale) * 100;
    const ratio = plan !== 0 ? val / plan : 1;
    const status = ratio <= 0.95 ? 'up' : ratio >= 1.05 ? 'dn' : 'wn';
    const valColor = status === 'up' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : 'var(--wn)';
    return ((0, jsx_runtime_1.jsxs)(styles_1.BulletRow, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-br-label", children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "m-br-chart", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-br-band m-br-band-1" }), (0, jsx_runtime_1.jsx)("div", { className: "m-br-band m-br-band-2", style: { width: `${targetPct}%` } }), (0, jsx_runtime_1.jsx)("div", { className: "m-br-band m-br-band-3", style: { width: `${targetPct * 0.8}%` } }), (0, jsx_runtime_1.jsx)("div", { className: "m-br-bar", style: { width: `${barPct}%`, background: color } }), (0, jsx_runtime_1.jsx)("div", { className: "m-br-target", style: { left: `calc(${targetPct}% - 1.25px)` } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-br-val", style: { color: valColor }, children: [formatter(val), (0, jsx_runtime_1.jsxs)("span", { className: "plan-note", children: ["\u0446\u0435\u043B\u044C: ", formatter(plan)] })] })] }));
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
    return ((0, jsx_runtime_1.jsxs)("svg", { width: "100%", height: h, viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: color, stopOpacity: "0.35" }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: color, stopOpacity: "0.02" })] }) }), (0, jsx_runtime_1.jsx)("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: "var(--g200)", strokeWidth: "1" }), areaPath && (0, jsx_runtime_1.jsx)("path", { d: areaPath, fill: `url(#${gradId})` }), path && (0, jsx_runtime_1.jsx)("path", { d: path, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), pts.map((p, i) => {
                const isLast = i === pts.length - 1;
                return ((0, jsx_runtime_1.jsx)("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: isLast ? 3 : 1.8, fill: color, stroke: "var(--g50)", strokeWidth: isLast ? 1.5 : 1 }, i));
            })] }));
};
const CauseList = ({ rows, formatter, }) => {
    const max = Math.max(...rows.map((r) => r.value), 1);
    return ((0, jsx_runtime_1.jsx)(CauseListWrap, { children: rows.map((r, i) => {
            const pct = (r.value / max) * 100;
            return ((0, jsx_runtime_1.jsxs)(CauseListRow, { children: [(0, jsx_runtime_1.jsx)(CauseName, { children: r.name }), (0, jsx_runtime_1.jsx)(CauseTrack, { children: (0, jsx_runtime_1.jsx)(CauseFill, { style: { width: `${pct}%` } }) }), (0, jsx_runtime_1.jsx)(CauseValue, { children: formatter(r.value) })] }, i));
        }) }));
};
const SkuList = ({ rows, formatter }) => {
    const max = Math.max(...rows.map((r) => r.value), 1);
    return ((0, jsx_runtime_1.jsx)(SkuListWrap, { children: rows.map((r, i) => {
            const pct = (r.value / max) * 100;
            return ((0, jsx_runtime_1.jsxs)(SkuListRow, { children: [(0, jsx_runtime_1.jsx)(SkuRank, { children: String(i + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsx)(SkuName, { children: r.name }), (0, jsx_runtime_1.jsx)(SkuTrack, { children: (0, jsx_runtime_1.jsx)(SkuFill, { style: { width: `${pct}%` } }) }), (0, jsx_runtime_1.jsx)(SkuValue, { children: formatter(r.value) })] }, i));
        }) }));
};
function hashId(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++)
        h = (h * 31 + id.charCodeAt(i)) | 0;
    return Math.abs(h);
}
exports.default = StoreDrillModal;
//# sourceMappingURL=StoreDrillModal.js.map