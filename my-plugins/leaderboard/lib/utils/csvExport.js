"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCsvRow = buildCsvRow;
exports.toCsv = toCsv;
exports.defaultCsvFileName = defaultCsvFileName;
exports.downloadCsv = downloadCsv;
const formatRussian_1 = require("./formatRussian");
const statusRules_1 = require("./statusRules");
/**
 * Экспортирует отфильтрованный и отсортированный список магазинов в CSV.
 * Формат совместим с Excel RU locale: BOM, ';', кириллица без проблем.
 */
const HEADERS = [
    '№',
    'Код',
    'Магазин',
    'Город',
    'Формат',
    'Дивизион',
    'ТО млн ₽',
    'Списания %',
    'План списаний %',
    'Δ к плану спис. п.п.',
    'Недостачи %',
    'План недостач %',
    'Δ к плану нед. п.п.',
    'Уровень потерь %',
    'Ср. сумма спис. ₽',
    'Ср. чек нед. ₽',
    'Осн. причина',
    'Доля причины %',
    'Δ причины',
    'Осн. вид списания',
    'Доля вида %',
    'Осн. сегмент',
    'Доля сегмента %',
    'Статус',
];
function buildCsvRow(s, idx) {
    return [
        idx + 1,
        s.code,
        s.name,
        s.city,
        s.formatName,
        s.division,
        s.toClass,
        (0, formatRussian_1.nf2)(s.writeoff),
        (0, formatRussian_1.nf2)(s.planWriteoff),
        (0, formatRussian_1.nf2)(s.writeoff - s.planWriteoff),
        (0, formatRussian_1.nf2)(s.shrinkage),
        (0, formatRussian_1.nf2)(s.planShrinkage),
        (0, formatRussian_1.nf2)(s.shrinkage - s.planShrinkage),
        (0, formatRussian_1.nf2)(s.lossCombined),
        s.avgWriteoff,
        s.avgShrinkageCheck,
        s.mainCause.name,
        (0, formatRussian_1.nf1)(s.mainCausePct),
        (0, formatRussian_1.nf2)(s.mainCauseDelta),
        s.mainWoType,
        (0, formatRussian_1.nf2)(s.mainWoTypePct),
        s.mainSegment,
        (0, formatRussian_1.nf0)(s.mainSegmentPct),
        statusRules_1.STATUSES[s.status].label,
    ];
}
const esc = (v) => {
    const str = String(v);
    if (/["\n;,]/.test(str))
        return `"${str.replace(/"/g, '""')}"`;
    return str;
};
function toCsv(stores) {
    const sep = ';';
    const rows = stores.map((s, i) => buildCsvRow(s, i));
    const lines = [HEADERS, ...rows].map(r => r.map(esc).join(sep));
    const BOM = '\uFEFF';
    return BOM + lines.join('\r\n');
}
function defaultCsvFileName(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `Рейтинг_магазинов_${y}${m}${d}.csv`;
}
function downloadCsv(stores, fileName) {
    const csv = toCsv(stores);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ?? defaultCsvFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Небольшая задержка перед revoke для Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
//# sourceMappingURL=csvExport.js.map