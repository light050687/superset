"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@superset-ui/core");
const themeTokens_1 = require("../themeTokens");
const isDarkTheme_1 = require("../utils/isDarkTheme");
const resolveColor_1 = require("../utils/resolveColor");
const groupRows_1 = require("../utils/groupRows");
const buildOption_1 = require("../utils/buildOption");
const presets_1 = require("../mocks/presets");
/**
 * Преобразует ChartProps от Superset в props компонента StructureDonut.
 *
 * Шаги:
 *   1. Нормализация groupby-массивов.
 *   2. Определение dark/light темы → выбор набора токенов.
 *   3. Mock-путь: вернуть preset'овские данные.
 *   4. Empty-путь: нет метрики/колонки/данных.
 *   5. Real-data путь: group rows, resolve colors, compute totalRevenue, DataState.
 */
function transformProps(chartProps) {
    const { width, height, formData, queriesData, theme } = chartProps;
    const fd = formData;
    // 1. Нормализация групбая
    for (const k of [
        'groupby_category',
        'groupby_subcategory',
        'groupbyCategory',
        'groupbySubcategory',
    ]) {
        const v = fd[k];
        if (Array.isArray(v)) {
            fd[k] = v[0] ?? undefined;
        }
    }
    const catCol = (fd.groupbyCategory ?? fd.groupby_category);
    const subCol = (fd.groupbySubcategory ??
        fd.groupby_subcategory);
    // 2. Dark/light mode
    const colorBgContainer = theme?.colorBgContainer;
    const isDarkMode = (0, isDarkTheme_1.isDarkTheme)(colorBgContainer);
    const tokens = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    // Header + subtitle (UI строки на русском — по умолчанию из прототипа)
    const headerText = fd.headerText?.trim() || 'Структура потерь';
    const subtitleText = fd.subtitleText?.trim() || 'за год';
    // Style props
    const padAngle = typeof fd.padAngle === 'number' ? fd.padAngle : 1.5;
    const borderRadius = typeof fd.borderRadius === 'number' ? fd.borderRadius : 2;
    const showOuterLabelsPct = fd.showOuterLabelsPct !== false; // default true
    // rub_decimals — сколько знаков после запятой в hero-числе (controlPanel slider 0-3)
    const fdRubDecimals = fd.rubDecimals
        ?? fd.rub_decimals;
    const rubDecimals = typeof fdRubDecimals === 'number' && fdRubDecimals >= 0 && fdRubDecimals <= 3
        ? fdRubDecimals
        : 2;
    const mockModeEnabled = fd.mock_mode_enabled ?? fd.mockModeEnabled ?? false;
    // Color overrides из controlPanel (CategoryColorMapControl)
    const colorMap = Array.isArray(fd.colorMap)
        ? fd.colorMap.filter((o) => !!o &&
            typeof o === 'object' &&
            typeof o.name === 'string' &&
            typeof o.accent === 'string')
        : [];
    // 3. Mock-путь
    if (mockModeEnabled) {
        const { categories, totalRevenue } = (0, presets_1.getStructurePreset)(fd.mockPreset, fd.mockCustomJson, tokens);
        return {
            width,
            height,
            headerText,
            subtitleText,
            dataState: categories.length === 0 ? 'empty' : 'populated',
            categories,
            hasSubcategories: categories.some((c) => c.children.length > 0),
            totalRevenue,
            padAngle,
            borderRadius,
            showOuterLabelsPct,
            rubDecimals,
            isDarkMode,
            theme,
            mockModeEnabled: true,
        };
    }
    // 4. Валидация
    const q0 = queriesData?.[0];
    const q0Data = (q0?.data ?? []);
    const q0Error = q0?.error;
    const isStale = q0?.is_cached === true;
    const hasValueMetric = !!formData.valueMetric;
    if (q0Error) {
        return {
            width,
            height,
            headerText,
            subtitleText,
            dataState: 'error',
            errorMessage: typeof q0Error === 'string' ? q0Error : 'Ошибка загрузки данных',
            categories: [],
            hasSubcategories: false,
            totalRevenue: null,
            padAngle,
            borderRadius,
            showOuterLabelsPct,
            rubDecimals,
            isDarkMode,
            theme,
            mockModeEnabled: false,
        };
    }
    if (!catCol || !hasValueMetric || q0Data.length === 0) {
        return {
            width,
            height,
            headerText,
            subtitleText,
            dataState: 'empty',
            categories: [],
            hasSubcategories: false,
            totalRevenue: null,
            padAngle,
            borderRadius,
            showOuterLabelsPct,
            rubDecimals,
            isDarkMode,
            theme,
            mockModeEnabled: false,
        };
    }
    // 5. Реальные данные
    const valueLabel = (0, core_1.getMetricLabel)(formData.valueMetric);
    const countLabel = formData.countMetric ? (0, core_1.getMetricLabel)(formData.countMetric) : undefined;
    const revenueLabel = formData.revenueMetric ? (0, core_1.getMetricLabel)(formData.revenueMetric) : undefined;
    const { categories } = (0, groupRows_1.groupRows)(q0Data, catCol, subCol, valueLabel, countLabel);
    // Резолв цветов + шейды детей
    categories.forEach((cat, idx) => {
        const { accent, color } = (0, resolveColor_1.resolveCategoryColor)(cat.name, colorMap, tokens, idx);
        cat.accent = accent;
        cat.color = color;
        (0, buildOption_1.applyChildShades)(cat);
    });
    // Суммарная выручка
    let totalRevenue = null;
    if (revenueLabel) {
        totalRevenue = q0Data.reduce((acc, row) => {
            const v = row[revenueLabel];
            const n = typeof v === 'number' ? v : Number(v);
            return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
        if (totalRevenue === 0)
            totalRevenue = null;
    }
    // DataState
    let dataState = 'populated';
    if (categories.length === 0) {
        dataState = 'empty';
    }
    else if (q0Data.length >= 500) {
        dataState = 'partial';
    }
    else if (isStale) {
        dataState = 'stale';
    }
    return {
        width,
        height,
        headerText,
        subtitleText,
        dataState,
        categories,
        hasSubcategories: !!subCol && categories.some((c) => c.children.length > 0),
        totalRevenue,
        padAngle,
        borderRadius,
        showOuterLabelsPct,
        isDarkMode,
        theme,
        mockModeEnabled: false,
    };
}
exports.default = transformProps;
//# sourceMappingURL=transformProps.js.map