import { nf0, nf1, nf2 } from './formatRussian';
import { STATUSES } from './statusRules';
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
export function buildCsvRow(s, idx) {
    return [
        idx + 1,
        s.code,
        s.name,
        s.city,
        s.formatName,
        s.division,
        s.toClass,
        nf2(s.writeoff),
        nf2(s.planWriteoff),
        nf2(s.writeoff - s.planWriteoff),
        nf2(s.shrinkage),
        nf2(s.planShrinkage),
        nf2(s.shrinkage - s.planShrinkage),
        nf2(s.lossCombined),
        s.avgWriteoff,
        s.avgShrinkageCheck,
        s.mainCause.name,
        nf1(s.mainCausePct),
        nf2(s.mainCauseDelta),
        s.mainWoType,
        nf2(s.mainWoTypePct),
        s.mainSegment,
        nf0(s.mainSegmentPct),
        STATUSES[s.status].label,
    ];
}
const esc = (v) => {
    const str = String(v);
    if (/["\n;,]/.test(str))
        return `"${str.replace(/"/g, '""')}"`;
    return str;
};
export function toCsv(stores) {
    const sep = ';';
    const rows = stores.map((s, i) => buildCsvRow(s, i));
    const lines = [HEADERS, ...rows].map(r => r.map(esc).join(sep));
    const BOM = '\uFEFF';
    return BOM + lines.join('\r\n');
}
export function defaultCsvFileName(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `Рейтинг_магазинов_${y}${m}${d}.csv`;
}
export function downloadCsv(stores, fileName) {
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