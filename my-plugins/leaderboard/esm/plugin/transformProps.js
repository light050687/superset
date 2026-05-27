import { enrichStoreWithMocks } from '../mocks/storeEnrichment';
import { DIVISION_BY_FORMAT, FORMATS_META } from '../mocks/rankedStoresMock';
import { generateByPreset } from '../mocks/generateMockStores';
import { BUILD_QUERY_DEFAULTS as D, resolvers } from './buildQuery';
/**
 * DS 2.0 локализация Superset time_range пресетов в русский subtitle.
 */
function formatTimeRangeRu(tr) {
    /* DS: если time_range не задан или 'No filter' — НЕ показываем «за период».
       Пользователь жаловался, что subtitle в модалке захламляется этим
       дефолтом, когда time-фильтр не выбран. */
    if (!tr || tr === 'No filter')
        return '';
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
/** Универсальный привод к числу; NaN → fallback. */
function toNum(v, fallback = 0) {
    if (v === null || v === undefined)
        return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function toStr(v, fallback = '') {
    if (v === null || v === undefined)
        return fallback;
    return String(v);
}
/**
 * Читает значение formData по двум ключам (snake+camelCase) с fallback.
 * Superset иногда конвертирует имена через lodash camelCase, иногда нет.
 */
function readFd(fd, camelKey, snakeKey, fallback) {
    const v = fd[camelKey] ?? fd[snakeKey];
    if (v === undefined || v === null || v === '')
        return fallback;
    return v;
}
/** Нормализует код формата — приводит к одному из известных enum'ов. */
function normalizeFormat(raw) {
    const s = toStr(raw).toLowerCase();
    if (s === 'express' ||
        s === 'minimarket' ||
        s === 'super' ||
        s === 'home' ||
        s === 'superstore') {
        return s;
    }
    if (s.includes('экспресс'))
        return 'express';
    if (s.includes('мини'))
        return 'minimarket';
    if (s.includes('суперстор'))
        return 'superstore';
    if (s.includes('супер'))
        return 'super';
    if (s.includes('дома') || s.includes('дом'))
        return 'home';
    return 'minimarket';
}
/**
 * Превращает queriesData[0].data → массив Store.
 *
 * 1. Если mockModeEnabled — возвращаем сгенерированный набор по пресету,
 *    игнорируя реальные queriesData.
 * 2. Иначе читаем строки по mapping (camel+snake), приводим типы,
 *    enrichStoreWithMocks дополняет tree/trend/distributions мок-полями.
 */
export default function transformProps(chartProps) {
    const { width, height, formData, queriesData, hooks = {}, filterState, } = chartProps;
    const fd = formData;
    /* ── Mapping: D&D zone → legacy text-override → дефолтное имя ── */
    const storeIdCol = resolvers.resolveColumn(fd, 'groupbyStoreId', 'groupby_store_id', D.storeIdCol, { camel: 'storeIdCol', snake: 'store_id_col' });
    const storeNameCol = resolvers.resolveColumn(fd, 'groupbyStoreName', 'groupby_store_name', D.storeNameCol, { camel: 'storeNameCol', snake: 'store_name_col' });
    const cityCol = resolvers.resolveColumn(fd, 'groupbyCity', 'groupby_city', D.cityCol, { camel: 'cityCol', snake: 'city_col' });
    const formatCol = resolvers.resolveColumn(fd, 'groupbyFormat', 'groupby_format', D.formatCol, { camel: 'formatCol', snake: 'format_col' });
    const formatNameCol = resolvers.resolveColumn(fd, 'groupbyFormatName', 'groupby_format_name', D.formatNameCol, { camel: 'formatNameCol', snake: 'format_name_col' });
    const divisionCol = resolvers.resolveColumn(fd, 'groupbyDivision', 'groupby_division', D.divisionCol, { camel: 'divisionCol', snake: 'division_col' });
    const toClassCol = resolvers.resolveColumn(fd, 'groupbyToClass', 'groupby_to_class', D.toClassCol, { camel: 'toClassCol', snake: 'to_class_col' });
    const segmentIdCol = readFd(fd, 'segmentIdCol', 'segment_id_col', 'segment_id');
    /* ── Метрики (имена колонок в data-row) ── */
    const writeoffKey = resolvers.resolveMetric(fd, 'metricWriteoff', 'metric_writeoff', D.writeoffMetric, { camel: 'writeoffMetric', snake: 'writeoff_metric' });
    const shrinkageKey = resolvers.resolveMetric(fd, 'metricShrinkage', 'metric_shrinkage', D.shrinkageMetric, { camel: 'shrinkageMetric', snake: 'shrinkage_metric' });
    const planWriteoffKey = resolvers.resolveMetric(fd, 'metricPlanWriteoff', 'metric_plan_writeoff', D.planWriteoffMetric, { camel: 'planWriteoffMetric', snake: 'plan_writeoff_metric' });
    const planShrinkageKey = resolvers.resolveMetric(fd, 'metricPlanShrinkage', 'metric_plan_shrinkage', D.planShrinkageMetric, { camel: 'planShrinkageMetric', snake: 'plan_shrinkage_metric' });
    const avgWriteoffKey = resolvers.resolveMetric(fd, 'metricAvgWriteoff', 'metric_avg_writeoff', D.avgWriteoffMetric, { camel: 'avgWriteoffMetric', snake: 'avg_writeoff_metric' });
    const avgShrinkageKey = resolvers.resolveMetric(fd, 'metricAvgShrinkageCheck', 'metric_avg_shrinkage_check', D.avgShrinkageCheckMetric, { camel: 'avgShrinkageCheckMetric', snake: 'avg_shrinkage_check_metric' });
    /* ── Режим проектирования: возвращаем моки ── */
    const mockModeEnabled = readFd(fd, 'mockModeEnabled', 'mock_mode_enabled', false);
    const mockPreset = readFd(fd, 'mockPreset', 'mock_preset', 'losses_400');
    const userPeriodLabel = readFd(fd, 'periodLabel', 'period_label', '');
    // Fallback: если юзер не задал periodLabel — берём активный time_range и
    // переводим в русский («Last year» → «за год»). DS 2.0 канон.
    const timeRange = fd['time_range'] ??
        fd['timeRange'];
    const periodLabel = userPeriodLabel.trim() || '';
    const defaultSort = readFd(fd, 'defaultSort', 'default_sort', 'lossCombined');
    const pageSize = Math.max(1, Math.floor(readFd(fd, 'pageSize', 'page_size', 50)));
    let stores;
    if (mockModeEnabled) {
        stores = generateByPreset(mockPreset);
    }
    else {
        const rawRows = queriesData?.[0]?.data ??
            [];
        /* Warn если маппинг явно не совпадает */
        if (rawRows.length > 0 && rawRows[0][storeIdCol] === undefined) {
            // eslint-disable-next-line no-console
            console.warn(`[ext-ranked-stores] В первой строке нет поля "${storeIdCol}". ` +
                `Проверьте mapping колонок в настройках плагина.`);
        }
        stores = rawRows.map((r, idx) => {
            const id = toStr(r[storeIdCol], `row-${idx}`);
            const name = toStr(r[storeNameCol], id);
            const city = toStr(r[cityCol], '');
            const format = normalizeFormat(r[formatCol]);
            const fmtMeta = FORMATS_META[format];
            const formatName = toStr(r[formatNameCol], '') || fmtMeta?.name || String(format);
            const division = toStr(r[divisionCol], '') || DIVISION_BY_FORMAT[format] || '';
            const toClass = Math.round(toNum(r[toClassCol], 0));
            const writeoff = toNum(r[writeoffKey], 0);
            const shrinkage = toNum(r[shrinkageKey], 0);
            const planWriteoff = toNum(r[planWriteoffKey], fmtMeta?.planWriteoff ?? 0);
            const planShrinkage = toNum(r[planShrinkageKey], fmtMeta?.planShrinkage ?? 0);
            const avgWriteoff = Math.round(toNum(r[avgWriteoffKey], 0));
            const avgShrinkageCheck = Math.round(toNum(r[avgShrinkageKey], 0));
            const shortLabel = name.split(/\s+/).slice(-1)[0] || name;
            const base = {
                id,
                code: toStr(r['store_code'], `Д${idx + 1}`),
                name,
                shortLabel,
                city,
                format,
                formatName,
                division,
                revenue: toNum(r['revenue_mln'], toClass),
                toClass,
                writeoff,
                shrinkage,
                planWriteoff,
                planShrinkage,
                avgWriteoff,
                avgShrinkageCheck,
            };
            return enrichStoreWithMocks(base);
        });
    }
    /* emitCrossFilters приходит из chartProps (опционально в Superset 6). По умолчанию false:
       плагин не должен пушить setDataMask, если пользователь явно не включил cross-filter
       на уровне дашборда. */
    const emitCrossFilters = chartProps.emitCrossFilters === true;
    return {
        width,
        height,
        stores,
        formData: formData,
        hooks,
        filterState,
        emitCrossFilters,
        periodLabel,
        defaultSort,
        pageSize,
        storeIdCol,
        segmentIdCol,
    };
}
//# sourceMappingURL=transformProps.js.map