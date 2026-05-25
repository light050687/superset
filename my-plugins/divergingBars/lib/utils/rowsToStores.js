"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparisonModeToShift = comparisonModeToShift;
exports.rowsToStores = rowsToStores;
/** Маппинг режима сравнения на time-compare суффикс. */
function comparisonModeToShift(mode) {
    switch (mode) {
        case 'prev_period':
            return 'inherit';
        case 'prev_week':
            return '1 week ago';
        case 'prev_month':
            return '1 month ago';
        case 'prev_quarter':
            return '1 quarter ago';
        case 'prev_year':
            return '1 year ago';
        case 'custom':
        default:
            return '';
    }
}
/**
 * Группирует rows в Store[]. Каждая row = один магазин (один уникальный
 * groupby-ключ). prev/curr собираются по имени колонок:
 *   `<lossLabel>`           — current
 *   `<lossLabel>__<shift>`  — previous
 */
function rowsToStores(rows, columns, formatsMap, prevRows) {
    const { codeCol, nameCol, cityCol, formatCol, lossLabel, turnoverLabel, comparisonMode, } = columns;
    const shift = comparisonMode && comparisonMode !== 'custom'
        ? comparisonModeToShift(comparisonMode)
        : '';
    const lossPrevKey = lossLabel && shift ? `${lossLabel}__${shift}` : undefined;
    const toPrevKey = turnoverLabel && shift ? `${turnoverLabel}__${shift}` : undefined;
    const num = (v) => {
        const n = Number(v ?? 0);
        return Number.isFinite(n) ? n : 0;
    };
    const buildKey = (r) => {
        const code = codeCol ? String(r[codeCol] ?? '') : '';
        const name = nameCol ? String(r[nameCol] ?? '') : '';
        const city = cityCol ? String(r[cityCol] ?? '') : '';
        return code || `${name}|${city}`;
    };
    // Index prevRows by groupby-key (для custom-режима, когда prev приходит
    // отдельным query).
    const prevByKey = new Map();
    if (prevRows && prevRows.length) {
        for (const r of prevRows) {
            prevByKey.set(buildKey(r), r);
        }
    }
    const storeMap = new Map();
    rows.forEach(r => {
        const code = codeCol ? String(r[codeCol] ?? '') : '';
        const name = nameCol ? String(r[nameCol] ?? '') : code || '—';
        const city = cityCol ? String(r[cityCol] ?? '') : '';
        const formatId = formatCol ? String(r[formatCol] ?? '') : '';
        const key = buildKey(r);
        let store = storeMap.get(key);
        if (!store) {
            const fmtDef = formatsMap.get(formatId);
            store = {
                id: key,
                code: code || name,
                name,
                shortLabel: name,
                city,
                format: formatId,
                formatName: fmtDef?.name ?? formatId ?? '—',
                plan: fmtDef?.plan ?? 0,
                to: 0,
                prevValueRub: 0,
                currValueRub: 0,
                prevValuePct: 0,
                currValuePct: 0,
            };
            storeMap.set(key, store);
        }
        // Current period (main row).
        const currLoss = lossLabel ? num(r[lossLabel]) : 0;
        const currTo = turnoverLabel ? num(r[turnoverLabel]) : 0;
        store.currValueRub += currLoss;
        store.to = Math.max(store.to, currTo);
        if (currTo > 0) {
            store.currValuePct = +((store.currValueRub / currTo) * 100).toFixed(2);
        }
        // Previous period — либо из той же row через time-compare suffix,
        // либо из prevRows (custom-режим).
        let prevLoss = 0;
        let prevTo = 0;
        if (lossPrevKey && r[lossPrevKey] !== undefined) {
            prevLoss = num(r[lossPrevKey]);
        }
        if (toPrevKey && r[toPrevKey] !== undefined) {
            prevTo = num(r[toPrevKey]);
        }
        // Fallback: prevRows (custom-режим).
        const prevRow = prevByKey.get(key);
        if (prevRow) {
            if (lossLabel && prevRow[lossLabel] !== undefined && !lossPrevKey) {
                prevLoss = num(prevRow[lossLabel]);
            }
            if (turnoverLabel &&
                prevRow[turnoverLabel] !== undefined &&
                !toPrevKey) {
                prevTo = num(prevRow[turnoverLabel]);
            }
        }
        store.prevValueRub += prevLoss;
        if (prevTo > 0) {
            store.prevValuePct = +((store.prevValueRub / prevTo) * 100).toFixed(2);
        }
    });
    return Array.from(storeMap.values());
}
//# sourceMappingURL=rowsToStores.js.map