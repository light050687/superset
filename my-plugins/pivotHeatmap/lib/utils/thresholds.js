"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_LABEL = void 0;
exports.statusFromRatio = statusFromRatio;
exports.cellStatus = cellStatus;
exports.totalsStatus = totalsStatus;
/**
 * Compute status class for a cell / totals slice based on fact/plan ratio.
 *
 * Semantics (prototype §cellStatus):
 *   - nd: no data (ratio is null or undefined)
 *   - polarity=higher_is_worse (default, losses/costs):
 *       ratio ≤ thresholds.ok  →  ok (green)
 *       ratio ≤ thresholds.wn  →  wn (yellow)
 *       ratio >  thresholds.wn →  dn (red)
 *   - polarity=higher_is_better (revenue):
 *       inverse — higher ratio is good
 */
function statusFromRatio(ratio, t) {
    if (ratio == null || !Number.isFinite(ratio))
        return 'nd';
    if (t.polarity === 'higher_is_worse') {
        if (ratio <= t.ok)
            return 'ok';
        if (ratio <= t.wn)
            return 'wn';
        return 'dn';
    }
    // higher_is_better — mirror: ratio above 1 is good
    if (ratio >= 1 / t.ok)
        return 'ok';
    if (ratio >= 1 / t.wn)
        return 'wn';
    return 'dn';
}
function cellStatus(cell, t) {
    if (!cell)
        return 'nd';
    return statusFromRatio(cell.ratio, t);
}
function totalsStatus(slice, t) {
    if (!slice)
        return 'nd';
    return statusFromRatio(slice.ratio, t);
}
/** Human-readable status labels (Russian, for tooltip / a11y) */
exports.STATUS_LABEL = {
    ok: 'В норме',
    wn: 'Внимание',
    dn: 'Превышение',
    nd: 'Нет данных',
};
//# sourceMappingURL=thresholds.js.map