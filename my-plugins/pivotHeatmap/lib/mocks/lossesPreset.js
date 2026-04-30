"use strict";
/**
 * Synthetic losses dataset used in mock mode.
 *
 * Values mirror the prototype `ref/heatmap-pivot-prototype.html`
 * makeData() generator — deterministic pseudo-random numbers seeded
 * by row+col id strings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_COLS = exports.MOCK_ROWS = void 0;
exports.buildMockCells = buildMockCells;
exports.MOCK_ROWS = [
    { id: 'express', name: 'Экспресс' },
    { id: 'supermarket', name: 'Супермаркет' },
    { id: 'minimarket', name: 'Минимаркет' },
    { id: 'near_home', name: 'Магазин у дома' },
    { id: 'superstore', name: 'Суперстор' },
];
exports.MOCK_COLS = [
    { id: 'd_express', name: 'Экспресс' },
    { id: 'd_ne', name: 'Северо-Восточный дивизион' },
    { id: 'd_mini', name: 'Сеть минимаркетов' },
    { id: 'd_disc', name: 'Сеть Дискаунтеров' },
    { id: 'd_cenohit', name: 'Ценохит' },
    { id: 'd_south', name: 'Южный дивизион' },
    { id: 'd_central', name: 'Центральный дивизион' },
];
/** Which cells are available (rest are "нет данных") — mirrors prototype.formatAvail */
const FORMAT_AVAIL = {
    express: ['d_express'],
    supermarket: ['d_express', 'd_ne'],
    minimarket: ['d_mini'],
    near_home: ['d_disc', 'd_cenohit'],
    superstore: ['d_ne', 'd_south', 'd_central'],
};
const BASE_BY_FORMAT = {
    express: { revenue: 12500, planPct: 2.8 },
    supermarket: { revenue: 28000, planPct: 2.2 },
    minimarket: { revenue: 8400, planPct: 2.5 },
    near_home: { revenue: 6800, planPct: 2.3 },
    superstore: { revenue: 32800, planPct: 1.8 },
};
function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h;
}
function seededRand(seed, lo, hi) {
    const x = Math.abs(Math.sin(seed)) * 10000;
    return lo + (x - Math.floor(x)) * (hi - lo);
}
function buildMockCells() {
    const cells = new Map();
    exports.MOCK_ROWS.forEach((row) => {
        const avail = FORMAT_AVAIL[row.id] ?? [];
        const base = BASE_BY_FORMAT[row.id];
        if (!base)
            return;
        exports.MOCK_COLS.forEach((col) => {
            if (!avail.includes(col.id))
                return;
            const seed = hashString(row.id + col.id);
            const ratio = seededRand(seed, 0.7, 1.6);
            const factPct = Number((base.planPct * ratio).toFixed(2));
            const factRub = Number(((base.revenue * factPct) / 100).toFixed(1));
            const planRub = Number(((base.revenue * base.planPct) / 100).toFixed(1));
            const shops = Math.floor(seededRand(seed + 1, 3, 24));
            const weights = [
                seededRand(seed + 3, 0.25, 0.45),
                seededRand(seed + 4, 0.15, 0.3),
                seededRand(seed + 5, 0.12, 0.25),
                seededRand(seed + 6, 0.08, 0.18),
            ];
            const wSum = weights.reduce((a, b) => a + b, 0);
            const breakdown = [
                { name: 'Списания', value: Number((factRub * (weights[0] / wSum)).toFixed(1)) },
                { name: 'Инвентаризации', value: Number((factRub * (weights[1] / wSum)).toFixed(1)) },
                { name: 'Кражи', value: Number((factRub * (weights[2] / wSum)).toFixed(1)) },
                { name: 'Повреждения', value: Number((factRub * (weights[3] / wSum)).toFixed(1)) },
            ];
            cells.set(`${row.id}|${col.id}`, {
                rowId: row.id,
                colId: col.id,
                value: factRub,
                plan: planRub,
                ratio: planRub !== 0 ? factRub / planRub : null,
                pct: factPct,
                planPct: base.planPct,
                revenue: base.revenue,
                shops,
                breakdown,
            });
        });
    });
    return cells;
}
//# sourceMappingURL=lossesPreset.js.map