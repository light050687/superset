"use strict";
/**
 * Russian number formatters matching DS 2.0:
 * — space as thousands separator
 * — comma as decimal separator
 * — currency symbol AFTER the number (1 234,5 млн ₽)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtRub = fmtRub;
exports.fmtPct = fmtPct;
exports.fmtDelta = fmtDelta;
exports.fmtCount = fmtCount;
exports.getDeltaStatus = getDeltaStatus;
const nf = (decimals) => new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
});
function fmtRub(value, decimals = 1, suffix = 'млн ₽') {
    if (!Number.isFinite(value)) {
        return { number: '—', unit: '' };
    }
    if (Math.abs(value) >= 1) {
        return { number: nf(decimals).format(value), unit: ` ${suffix}` };
    }
    const inThousands = value * 1000;
    return {
        number: new Intl.NumberFormat('ru-RU', {
            maximumFractionDigits: 0,
        }).format(inThousands),
        unit: ' тыс ₽',
    };
}
function fmtPct(value, decimals = 1) {
    if (!Number.isFinite(value)) {
        return { number: '—', unit: '' };
    }
    return { number: nf(decimals).format(value), unit: ' %' };
}
/**
 * Format a delta value in percentage points.
 * Returns "+1,03 п.п.", "−0,42 п.п.", "0,00 п.п." with the unicode minus sign.
 */
function fmtDelta(pp, decimals = 2) {
    if (!Number.isFinite(pp)) {
        return '—';
    }
    const formatted = nf(decimals).format(Math.abs(pp));
    const sign = pp > 0 ? '+' : pp < 0 ? '−' : '';
    return `${sign}${formatted} п.п.`;
}
/** Format a plain integer count: "1 234". */
function fmtCount(value) {
    if (!Number.isFinite(value)) {
        return '—';
    }
    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0,
    }).format(value);
}
function getDeltaStatus(pp, invertGood, threshold = 0.1) {
    if (!Number.isFinite(pp) || Math.abs(pp) < threshold) {
        return 'wn';
    }
    if (invertGood) {
        return pp > 0 ? 'dn' : 'up';
    }
    return pp > 0 ? 'up' : 'dn';
}
//# sourceMappingURL=formatRussian.js.map