"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_PRESET = exports.LOSSES_PRESET = exports.LOSSES_BREAKDOWN = exports.LOSSES_ITEMS = void 0;
exports.getBreakdown = getBreakdown;
exports.getParetoPreset = getParetoPreset;
/**
 * Данные взяты 1:1 из прототипа `ref/pareto-prototype.html` (строки 493..508).
 * 14 товарных категорий ритейла Samberi; value в млн ₽.
 *
 * При подключении реального источника этот пресет остаётся в качестве демо/fixture.
 */
exports.LOSSES_ITEMS = [
    { id: '190', name: 'Овощи, зелень', value: 21.8, revenueRub: 380, valuePrev: 16.4 },
    { id: '185', name: 'Фрукты', value: 20.9, revenueRub: 420, valuePrev: 19.8 },
    { id: '205', name: 'Кулинария горячая', value: 8.7, revenueRub: 210, valuePrev: 6.2 },
    { id: '135', name: 'Молочные продукты', value: 8.5, revenueRub: 640, valuePrev: 9.1 },
    { id: '115', name: 'Хлеб · Хлебобулочное', value: 5.8, revenueRub: 320, valuePrev: 7.0 },
    { id: '210', name: 'Кулинария холодная', value: 5.7, revenueRub: 180, valuePrev: 4.8 },
    { id: '175', name: 'Колбасные изделия', value: 3.5, revenueRub: 290, valuePrev: 3.7 },
    { id: '110', name: 'Хлеб приготовленный', value: 3.4, revenueRub: 155, valuePrev: 2.9 },
    { id: '180', name: 'Рыбная гастрономия', value: 3.0, revenueRub: 225, valuePrev: 3.4 },
    { id: '155', name: 'Птица охлаждённая', value: 2.7, revenueRub: 410, valuePrev: 2.5 },
    { id: '140', name: 'Сыры ПП', value: 2.6, revenueRub: 340, valuePrev: 2.2 },
    { id: '105', name: 'Мясо охлаждённое', value: 2.4, revenueRub: 480, valuePrev: 2.8 },
    { id: '120', name: 'Кондитерка', value: 2.3, revenueRub: 265, valuePrev: 3.1 },
    { id: '145', name: 'Яйца', value: 1.4, revenueRub: 195, valuePrev: 1.5 },
];
/**
 * Раскладка причин списаний по категории (для drill-модалки).
 * Ключ — id категории. Для id'шников без записи используется getBreakdown().
 */
exports.LOSSES_BREAKDOWN = {
    '190': [
        { name: 'Истёкший срок', rub: 14.5 },
        { name: 'Повреждения', rub: 4.2 },
        { name: 'Товарный вид', rub: 2.1 },
        { name: 'Прочее', rub: 1.0 },
    ],
    '185': [
        { name: 'Истёкший срок', rub: 12.8 },
        { name: 'Повреждения', rub: 4.0 },
        { name: 'Товарный вид', rub: 3.2 },
        { name: 'Прочее', rub: 0.9 },
    ],
    '205': [
        { name: 'Истёкший срок', rub: 5.1 },
        { name: 'Технологические', rub: 2.0 },
        { name: 'Товарный вид', rub: 1.1 },
        { name: 'Прочее', rub: 0.5 },
    ],
    '135': [
        { name: 'Истёкший срок', rub: 5.4 },
        { name: 'Повреждения', rub: 1.8 },
        { name: 'Товарный вид', rub: 0.9 },
        { name: 'Прочее', rub: 0.4 },
    ],
    '115': [
        { name: 'Черствение', rub: 3.7 },
        { name: 'Истёкший срок', rub: 1.5 },
        { name: 'Товарный вид', rub: 0.4 },
        { name: 'Прочее', rub: 0.2 },
    ],
    '210': [
        { name: 'Истёкший срок', rub: 3.6 },
        { name: 'Товарный вид', rub: 1.3 },
        { name: 'Технологические', rub: 0.6 },
        { name: 'Прочее', rub: 0.2 },
    ],
};
/** Дефолтная раскладка для категорий без явного BREAKDOWN. */
function getBreakdown(id, totalRub) {
    const explicit = exports.LOSSES_BREAKDOWN[id];
    if (explicit)
        return explicit;
    return [
        { name: 'Истёкший срок', rub: +(totalRub * 0.55).toFixed(1) },
        { name: 'Повреждения', rub: +(totalRub * 0.22).toFixed(1) },
        { name: 'Товарный вид', rub: +(totalRub * 0.15).toFixed(1) },
        { name: 'Прочее', rub: +(totalRub * 0.08).toFixed(1) },
    ];
}
exports.LOSSES_PRESET = {
    items: exports.LOSSES_ITEMS,
    metricLabel: 'Сумма списаний',
    metricUnit: 'млн ₽',
    metricGenitive: 'всех списаний',
    headerText: 'Списания по Парето',
    breakdownTitle: 'Причины списаний',
};
exports.EMPTY_PRESET = {
    items: [],
    metricLabel: 'Сумма списаний',
    metricUnit: 'млн ₽',
    metricGenitive: 'всех списаний',
    headerText: 'Списания по Парето',
    breakdownTitle: 'Причины списаний',
};
/**
 * Резолв mock-пресета по имени с возможностью кастомного JSON.
 * При неудачном парсинге кастом-JSON возвращает EMPTY_PRESET.
 */
function getParetoPreset(preset, customJson) {
    if (preset === 'custom' && customJson) {
        try {
            const parsed = JSON.parse(customJson);
            if (!parsed || !Array.isArray(parsed.items))
                return exports.EMPTY_PRESET;
            return {
                items: parsed.items,
                metricLabel: parsed.metricLabel ?? exports.LOSSES_PRESET.metricLabel,
                metricUnit: parsed.metricUnit ?? exports.LOSSES_PRESET.metricUnit,
                metricGenitive: parsed.metricGenitive ?? exports.LOSSES_PRESET.metricGenitive,
                headerText: parsed.headerText ?? exports.LOSSES_PRESET.headerText,
                breakdownTitle: parsed.breakdownTitle ?? exports.LOSSES_PRESET.breakdownTitle,
            };
        }
        catch {
            return exports.EMPTY_PRESET;
        }
    }
    if (preset === 'empty')
        return exports.EMPTY_PRESET;
    return exports.LOSSES_PRESET;
}
//# sourceMappingURL=presets.js.map