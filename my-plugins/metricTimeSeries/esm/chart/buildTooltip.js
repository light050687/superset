import { toRgba } from '../utils/formatRussian';
/**
 * Build the ECharts tooltip formatter.
 * Returns a fn(params) that produces HTML as a string.
 *
 * Matches the prototype layout (lines 1038-1108):
 *   - title line (month/year + optional week label)
 *   - series rows with dot/swatch + value (right-aligned, tabular-nums)
 *   - stack mode: total row after separator, then overlays (plan/py)
 */
export function buildTooltipFormatter(params) {
    const { mode, gran, buckets, tokens, fontText, fontMono, valueFormatter, seriesLabels, totalLabel } = params;
    /* Tooltip того же тона что Card surface (НЕ инверт). Text — tokens.ink. */
    const ttText = tokens.ink;
    return (rawParams) => {
        const list = Array.isArray(rawParams) ? rawParams : [rawParams];
        if (!list.length)
            return '';
        const idx = list[0].dataIndex ?? 0;
        const b = buckets[idx];
        if (!b)
            return '';
        let title;
        if (gran === 'year') {
            title = String(b.year);
        }
        else if (gran === 'month') {
            title = `${b.monthName} ${b.year}`;
        }
        else if (gran === 'week') {
            title = `${b.monthName} ${b.year} · Неделя ${b.week}`;
        }
        else {
            title = `${b.day} ${b.monthShort} ${b.year}`;
        }
        /* DS 2.1 §08: header 11px Manrope/600, строки 12px Mono.
           Header имеет border-bottom + padding-bottom 8px (визуально отделить). */
        let html = `<div style="font:700 13px ${fontText};color:${ttText};margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(128,128,128,0.25);line-height:1.3">${title}</div>`;
        if (mode === 'line') {
            const byId = new Map();
            list.forEach(p => {
                if (p.seriesId)
                    byId.set(p.seriesId, p);
            });
            const order = [
                { id: 'fact', label: seriesLabels.fact },
                { id: 'plan', label: seriesLabels.plan },
                { id: 'py', label: seriesLabels.py },
            ];
            order.forEach(({ id, label }) => {
                const p = byId.get(id);
                if (!p)
                    return;
                const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.color};margin-right:6px;vertical-align:middle"></span>`;
                const val = valueFormatter(p.value ?? null);
                html += `<div style="font:500 12px ${fontMono};color:${ttText};line-height:1.5;display:flex;justify-content:space-between;gap:12px">
          <span>${dot}${label}</span>
          <span style="font-variant-numeric:tabular-nums;font-weight:600">${val}</span>
        </div>`;
            });
            return html;
        }
        // Stack mode: categories reversed (top of stack shown first), total, then overlays.
        let total = 0;
        let hasAny = false;
        const reversed = [...list].reverse();
        reversed.forEach(p => {
            if (!p.seriesId || !p.seriesId.startsWith('cat-'))
                return;
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:6px;vertical-align:middle"></span>`;
            const val = valueFormatter(p.value ?? null);
            if (p.value != null) {
                total += p.value;
                hasAny = true;
            }
            html += `<div style="font:500 12px ${fontMono};color:${ttText};line-height:1.5;display:flex;justify-content:space-between;gap:12px">
        <span>${dot}${p.seriesName ?? ''}</span>
        <span style="font-variant-numeric:tabular-nums;font-weight:600">${val}</span>
      </div>`;
        });
        if (hasAny) {
            html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(128,128,128,0.25);font:600 12px ${fontMono};color:${ttText};display:flex;justify-content:space-between;gap:12px">
        <span>${totalLabel}</span>
        <span style="font-variant-numeric:tabular-nums;font-weight:700">${valueFormatter(total)}</span>
      </div>`;
        }
        // Overlays: plan + py (py may be a 'py-bar' ghost in stack-bar mode).
        const byId = new Map();
        list.forEach(p => {
            if (p.seriesId)
                byId.set(p.seriesId, p);
        });
        const pyKey = mode === 'stack-bar' ? 'py-bar' : 'py';
        const overlays = [
            { id: 'plan', lookupKey: 'plan', label: seriesLabels.plan },
            { id: 'py', lookupKey: pyKey, label: seriesLabels.py },
        ];
        overlays.forEach(({ id, lookupKey, label }) => {
            const p = byId.get(lookupKey);
            if (!p || p.value == null)
                return;
            let mark;
            if (id === 'plan') {
                mark = `<span style="display:inline-block;width:14px;margin-right:6px;vertical-align:middle"><svg width="14" height="10"><line x1="0" y1="5" x2="14" y2="5" stroke="${tokens.g600}" stroke-width="1.4"/><circle cx="7" cy="5" r="2.6" fill="${tokens.s}" stroke="${tokens.g600}" stroke-width="1.4"/></svg></span>`;
            }
            else if (mode === 'stack-bar') {
                mark = `<span style="display:inline-block;width:14px;margin-right:6px;vertical-align:middle"><svg width="14" height="10"><rect x="2" y="2" width="10" height="7" rx="1" fill="${tokens.cViolet}" fill-opacity=".35" stroke="${tokens.cViolet}" stroke-width="1" stroke-dasharray="2 2"/></svg></span>`;
            }
            else {
                mark = `<span style="display:inline-block;width:14px;margin-right:6px;vertical-align:middle"><svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="${tokens.cViolet}" stroke-width="1.6" stroke-dasharray="6 5"/></svg></span>`;
            }
            html += `<div style="font:500 12px ${fontMono};color:${toRgba(ttText, 0.75)};line-height:1.5;display:flex;justify-content:space-between;gap:12px">
        <span>${mark}${label}</span>
        <span style="font-variant-numeric:tabular-nums;font-weight:500">${valueFormatter(p.value)}</span>
      </div>`;
        });
        return html;
    };
}
//# sourceMappingURL=buildTooltip.js.map