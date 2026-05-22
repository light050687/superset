import { CategoricalColorNamespace, getMetricLabel, } from '@superset-ui/core';
import { formatRussianSmartEx } from '../utils/formatRussian';
import { LIGHT_TOKENS, DARK_TOKENS, DEFAULT_FORMAT_PALETTE, } from '../themeTokens';
import { computeWeightedAverage, computeAverage } from '../utils/quadrants';
import { getMockPreset } from '../mocks/presets';
// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
function toNumber(v) {
    if (v == null)
        return NaN;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : NaN;
}
/**
 * DS 2.0 локализация Superset time_range пресетов в русский subtitle.
 */
function formatTimeRangeRu(tr) {
    if (!tr || tr === 'No filter')
        return 'за период';
    const map = {
        'Last day': 'за день',
        'Last week': 'за неделю',
        'Last month': 'за месяц',
        'Last quarter': 'за квартал',
        'Last year': 'за год',
        Today: 'сегодня',
        'This week': 'за эту неделю',
        'This month': 'за этот месяц',
        'This year': 'за этот год',
        'previous calendar week': 'за прошлую неделю',
        'previous calendar month': 'за прошлый месяц',
        'previous calendar year': 'за прошлый год',
    };
    return map[tr] ?? tr;
}
function getColumnValue(row, col) {
    if (!col)
        return undefined;
    const v = row[col];
    return v == null ? undefined : String(v);
}
/** Конвертация AdhocFilter[] → simple filters + freeform WHERE */
function splitAdhocFilters(filters = []) {
    const simple = [];
    const whereParts = [];
    const havingParts = [];
    filters.forEach((f) => {
        if (!f)
            return;
        const expr = f;
        if (expr.expressionType === 'SIMPLE' && expr.subject && expr.operator) {
            simple.push({
                col: expr.subject,
                op: expr.operator,
                val: expr.comparator ?? '',
            });
        }
        else if (expr.expressionType === 'SQL' && expr.sqlExpression) {
            if (expr.clause === 'HAVING') {
                havingParts.push(expr.sqlExpression);
            }
            else {
                whereParts.push(expr.sqlExpression);
            }
        }
    });
    return {
        simple,
        where: whereParts.join(' AND '),
        having: havingParts.join(' AND '),
    };
}
function resolveSemanticColor(semantic, tokens, xColor, yColor) {
    switch (semantic) {
        case 'up':
            return tokens.up;
        case 'dn':
            return tokens.dn;
        case 'wn':
            return tokens.wn;
        case 'x':
            return xColor;
        case 'y':
            return yColor;
        default:
            return tokens.g500;
    }
}
function makeValueFormatter(decimals, unit) {
    const suffix = unit || '';
    return (n) => {
        if (!Number.isFinite(n))
            return '—';
        // Если явно проценты — используем fixed decimals без abbreviation
        if (suffix === '%' || suffix === ' %') {
            const abs = Math.abs(n);
            const sign = n < 0 ? '−' : '';
            return `${sign}${new Intl.NumberFormat('ru-RU', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }).format(abs)}\u00A0${suffix.trim()}`;
        }
        return formatRussianSmartEx(n, decimals, suffix);
    };
}
// ═══════════════════════════════════════
// Main
// ═══════════════════════════════════════
export default function transformProps(chartProps) {
    const { width, height, formData: fd, queriesData, theme } = chartProps;
    const formData = fd;
    // Поля с normalisation array → scalar
    const groupbyStore = (Array.isArray(formData.groupbyStore)
        ? formData.groupbyStore[0]
        : formData.groupbyStore);
    const groupbyFormat = (Array.isArray(formData.groupbyFormat)
        ? formData.groupbyFormat[0]
        : formData.groupbyFormat);
    const groupbyCity = (Array.isArray(formData.groupbyCity)
        ? formData.groupbyCity[0]
        : formData.groupbyCity);
    // Metric labels
    const metricX = formData.metricX;
    const metricY = formData.metricY;
    const metricSize = formData.metricSize;
    const metricPlanX = formData.metricPlanX;
    const metricPlanY = formData.metricPlanY;
    const metricSumLoss = formData.metricSumLoss;
    const labelX = metricX ? getMetricLabel(metricX) : '';
    const labelY = metricY ? getMetricLabel(metricY) : '';
    const labelSize = metricSize ? getMetricLabel(metricSize) : '';
    const labelPlanX = metricPlanX ? getMetricLabel(metricPlanX) : '';
    const labelPlanY = metricPlanY ? getMetricLabel(metricPlanY) : '';
    const labelSumLoss = metricSumLoss ? getMetricLabel(metricSumLoss) : '';
    // ── Theme detection ──
    const isDarkMode = (() => {
        const bg = theme?.colorBgContainer ?? '';
        if (typeof bg === 'string') {
            // Грубая эвристика: если фон тёмный (<50% brightness) — dark mode
            const cleaned = bg.replace('#', '');
            if (cleaned.length === 6) {
                const r = parseInt(cleaned.slice(0, 2), 16);
                const g = parseInt(cleaned.slice(2, 4), 16);
                const b = parseInt(cleaned.slice(4, 6), 16);
                return (r + g + b) / 3 < 128;
            }
        }
        return false;
    })();
    const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
    // ── Raw data ──
    const rawData = queriesData?.[0]?.data ?? [];
    // Mock mode fallback
    const mockEnabled = Boolean(formData.mockModeEnabled);
    const usingMock = mockEnabled && (rawData.length === 0 || !groupbyStore);
    const mock = usingMock ? getMockPreset(String(formData.mockPreset ?? 'retail')) : null;
    // ── Build StorePoint[] ──
    const stores = [];
    if (mock) {
        stores.push(...mock.stores);
    }
    else {
        rawData.forEach((row, idx) => {
            const id = getColumnValue(row, groupbyStore) ?? `row-${idx}`;
            const format = getColumnValue(row, groupbyFormat) ?? 'default';
            const city = getColumnValue(row, groupbyCity);
            const x = toNumber(row[labelX]);
            const y = toNumber(row[labelY]);
            const size = metricSize ? toNumber(row[labelSize]) : 1;
            const planX = metricPlanX ? toNumber(row[labelPlanX]) : undefined;
            const planY = metricPlanY ? toNumber(row[labelPlanY]) : undefined;
            const sumLoss = metricSumLoss ? toNumber(row[labelSumLoss]) : undefined;
            if (!Number.isFinite(x) || !Number.isFinite(y))
                return;
            stores.push({
                id,
                name: id,
                city,
                format,
                formatName: format,
                x,
                y,
                size: Number.isFinite(size) && size > 0 ? size : 1,
                planX: Number.isFinite(planX) ? planX : undefined,
                planY: Number.isFinite(planY) ? planY : undefined,
                sumLoss: Number.isFinite(sumLoss) ? sumLoss : undefined,
            });
        });
    }
    // ── Aggregate formats ──
    const colorScheme = formData.colorScheme;
    // CategoricalColorNamespace.getScale() возвращает CategoricalColorScale instance.
    // Берём цвет через .getColor(key); если scheme не задана — используем fallback из DS 2.0.
    const colorScale = CategoricalColorNamespace.getScale(colorScheme);
    const formatMap = new Map();
    stores.forEach((s) => {
        let meta = formatMap.get(s.format);
        if (!meta) {
            const paletteIndex = formatMap.size % DEFAULT_FORMAT_PALETTE.length;
            const tokenKey = DEFAULT_FORMAT_PALETTE[paletteIndex];
            const fallback = tokens[tokenKey];
            let color = fallback;
            try {
                const scheme = colorScale.getColor(s.format);
                if (typeof scheme === 'string' && scheme.length > 0)
                    color = scheme;
            }
            catch {
                // Если color scale упал (нет scheme) — остаёмся на fallback
            }
            meta = {
                id: s.format,
                name: s.formatName || s.format,
                color,
                count: 0,
            };
            formatMap.set(s.format, meta);
        }
        meta.count += 1;
    });
    // Если у формата есть plan-значения — усредняем для отображения
    if (metricPlanX || metricPlanY) {
        formatMap.forEach((fmt) => {
            const sublist = stores.filter((s) => s.format === fmt.id);
            if (metricPlanX) {
                const planValues = sublist.map((s) => s.planX ?? NaN);
                const weights = sublist.map((s) => s.size);
                fmt.planX = computeWeightedAverage(planValues, weights);
            }
            if (metricPlanY) {
                const planValues = sublist.map((s) => s.planY ?? NaN);
                const weights = sublist.map((s) => s.size);
                fmt.planY = computeWeightedAverage(planValues, weights);
            }
        });
    }
    const formats = Array.from(formatMap.values());
    // Применяем цвет формата обратно к StorePoint.formatName (человекочитаемое имя = formatName)
    stores.forEach((s) => {
        const meta = formatMap.get(s.format);
        if (meta)
            s.formatName = meta.name;
    });
    // ── Thresholds ──
    const thresholdMode = (formData.thresholdMode ?? 'metric');
    let thresholdX = 0;
    let thresholdY = 0;
    let hasThresholds = false;
    // В mock-режиме у каждой точки уже есть planX/planY (см. mocks/presets.ts) —
    // используем их как источник порогов, чтобы режим проектирования был
    // визуально идентичен мокапу (с пунктирами/квадрантами/аннотациями).
    const mockHasPlanX = usingMock && stores.some((s) => s.planX != null);
    const mockHasPlanY = usingMock && stores.some((s) => s.planY != null);
    if (thresholdMode === 'static') {
        thresholdX = toNumber(formData.staticThresholdX) || 0;
        thresholdY = toNumber(formData.staticThresholdY) || 0;
        hasThresholds = true;
    }
    else if (thresholdMode === 'avg') {
        thresholdX = computeAverage(stores.map((s) => s.x));
        thresholdY = computeAverage(stores.map((s) => s.y));
        hasThresholds = stores.length > 0;
    }
    else {
        // 'metric' — средневзвешенное per-row plan (если метрика задана ИЛИ это mock с planX/planY)
        if (metricPlanX || mockHasPlanX) {
            thresholdX = computeWeightedAverage(stores.map((s) => s.planX ?? NaN), stores.map((s) => s.size));
        }
        if (metricPlanY || mockHasPlanY) {
            thresholdY = computeWeightedAverage(stores.map((s) => s.planY ?? NaN), stores.map((s) => s.size));
        }
        hasThresholds = Boolean(metricPlanX || metricPlanY || mockHasPlanX || mockHasPlanY);
        // Если пороги не заданы — падаем в среднее фактических значений, чтобы квадранты имели смысл
        if (!metricPlanX && !mockHasPlanX)
            thresholdX = computeAverage(stores.map((s) => s.x));
        if (!metricPlanY && !mockHasPlanY)
            thresholdY = computeAverage(stores.map((s) => s.y));
    }
    // ── Quadrants ──
    const xColorToken = tokens.cTangerine; // X-ось (писания)
    const yColorToken = tokens.cSky; // Y-ось (недостачи)
    const mkQuadrant = (key, labelFieldName, semanticFieldName, defaultLabel, defaultSemantic, description) => {
        const label = formData[labelFieldName] || defaultLabel;
        const semantic = (formData[semanticFieldName] ||
            defaultSemantic);
        const color = resolveSemanticColor(semantic, tokens, xColorToken, yColorToken);
        return { key, label, semantic, color, description };
    };
    const quadrants = {
        tl: mkQuadrant('tl', 'quadTlLabel', 'quadTlSemantic', 'НЕДОСТАЧИ', 'y', 'Высокие Y, X в норме'),
        tr: mkQuadrant('tr', 'quadTrLabel', 'quadTrSemantic', 'КРИТИЧЕСКИ ⚠', 'dn', 'Обе проблемы — требуют немедленных действий'),
        bl: mkQuadrant('bl', 'quadBlLabel', 'quadBlSemantic', 'НОРМА ✓', 'up', 'Оба показателя в норме'),
        br: mkQuadrant('br', 'quadBrLabel', 'quadBrSemantic', 'СПИСАНИЯ', 'x', 'Высокие X, Y в норме'),
    };
    // ── Formatters ──
    const xDecimals = Number.isFinite(Number(formData.xDecimals))
        ? Number(formData.xDecimals)
        : 2;
    const yDecimals = Number.isFinite(Number(formData.yDecimals))
        ? Number(formData.yDecimals)
        : 2;
    const xUnit = formData.xUnit ?? '%';
    const yUnit = formData.yUnit ?? '%';
    const sizeUnit = formData.sizeUnit ?? 'млн ₽';
    const formatX = makeValueFormatter(xDecimals, xUnit);
    const formatY = makeValueFormatter(yDecimals, yUnit);
    // Size/Loss: значения обычно уже в "млн ₽" — просто форматируем с суффиксом,
    // НЕ используя abbreviation (иначе получим "1,2 млрд млн ₽").
    // Валюта идёт ПОСЛЕ числа согласно DS 2.0.
    const formatNumberRu = (n, decimals) => new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n);
    const formatSize = (n) => Number.isFinite(n) ? `${formatNumberRu(n, 1)}\u00A0${sizeUnit}` : '—';
    const formatLoss = (n) => Number.isFinite(n) ? `${formatNumberRu(n, 2)}\u00A0${sizeUnit}` : '—';
    const formatCount = (n) => Number.isFinite(n)
        ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)
        : '—';
    // ── Labels ──
    // В mock-режиме preset.xLabel/yLabel имеют приоритет над labelX/Y от метрик
    // (потому что mock-метрика обычно дефолтная COUNT(*) с label "count" — это не то,
    // что хочет увидеть пользователь). Form-data всегда выигрывает у обоих.
    const xLabel = formData.xLabel ||
        (usingMock ? mock?.xLabel : undefined) ||
        labelX ||
        'X';
    const yLabel = formData.yLabel ||
        (usingMock ? mock?.yLabel : undefined) ||
        labelY ||
        'Y';
    const xShort = xLabel.length > 20 ? xLabel.slice(0, 18) + '…' : xLabel;
    const yShort = yLabel.length > 20 ? yLabel.slice(0, 18) + '…' : yLabel;
    // ── Detail query params ──
    const { simple: baseFilters, where: baseWhere, having: baseHaving } = splitAdhocFilters(formData.adhocFilters ?? []);
    const detailQueryParams = {
        datasetId: formData.detailDatasetId,
        storeColumn: groupbyStore,
        trendTimeColumn: formData.trendTimeColumn,
        trendWeeks: Number(formData.trendWeeks ?? 12) || 12,
        trendMetric: metricX,
        causesDimension: formData.causesDimension,
        causesMetric: formData.causesMetric,
        causesTopN: Number(formData.causesTopN ?? 3) || 3,
        skusDimension: formData.skusDimension,
        skusMetric: formData.skusMetric,
        skusTopN: Number(formData.skusTopN ?? 5) || 5,
        rankDimension: formData.rankDimension ?? groupbyFormat,
        baseFilters,
        baseWhere,
        baseHaving,
        timeRange: formData.time_range,
    };
    /* DS 2.0 §06 «Состояния»: empty / partial / stale / populated.
       - empty: нет stores
       - partial: бэкенд отверг часть фильтров (rejected_filters > 0)
       - stale: данные пришли из кеша
       - populated: всё хорошо. */
    const q0 = queriesData?.[0];
    let dataState;
    if (stores.length === 0) {
        dataState = 'empty';
    }
    else if (q0?.rejected_filters && q0.rejected_filters.length > 0) {
        dataState = 'partial';
    }
    else if (q0?.is_cached) {
        dataState = 'stale';
    }
    else {
        dataState = 'populated';
    }
    return {
        width,
        height,
        dataState,
        stores,
        formats,
        thresholdX,
        thresholdY,
        hasThresholds,
        quadrants,
        enableQuadrantAnnotations: formData.enableQuadrantAnnotations ?? true,
        enableWorstStar: formData.enableWorstStar ?? true,
        title: formData.title || 'Матрица рисков',
        subtitle: formData.subtitle?.trim() ||
            formatTimeRangeRu(formData.time_range ??
                formData.timeRange),
        xLabel,
        yLabel,
        xUnit,
        yUnit,
        sizeUnit,
        formatX,
        formatY,
        formatSize,
        formatLoss,
        formatCount,
        xShort,
        yShort,
        isDarkMode,
        setDataMask: chartProps.hooks?.setDataMask,
        filterState: chartProps.filterState,
        storeColumn: groupbyStore,
        drillEnabled: formData.drillEnabled ?? true,
        detailQueryParams,
        shortcutsHint: formData.shortcutsHint ||
            'Click — фильтр · Ctrl+Click — детализация · Drag — перемещение · Scroll — масштаб',
        mockModeEnabled: mockEnabled,
    };
}
//# sourceMappingURL=transformProps.js.map