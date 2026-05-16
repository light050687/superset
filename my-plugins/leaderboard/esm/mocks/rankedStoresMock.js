/** Типы причин списаний (driver cell + ranked bars в модалке). */
export const CAUSE_TYPES = [
    { id: 'inventory', name: 'Инвентаризация', colorKey: 'violet' },
    { id: 'expiry', name: 'Списание по истечению сроков', colorKey: 'sky' },
    { id: 'damage', name: 'Списание по браку на убытки', colorKey: 'tangerine' },
    { id: 'storage', name: 'Нарушение условий хранения', colorKey: 'fuchsia' },
    { id: 'theft', name: 'Внутренние хищения', colorKey: 'amber' },
];
/** Виды списаний (ranked bars в модалке). */
export const WRITEOFF_TYPES = [
    'Списание по браку на убытки',
    'Списание на представительские нужды',
    'Списание в производство',
    'Списание на рекламные акции',
];
/** Товарные сегменты для tree-accordion и modal сегмента. */
export const SEGMENTS = [
    '255 НАПИТКИ АЛКОГОЛЬНЫЕ',
    '250 КОНДИТЕРСКИЕ ИЗДЕЛИЯ',
    '210 КУЛИНАРИЯ, САЛАТЫ, ПС',
    '135 МОЛОЧНЫЕ ПРОДУКТЫ',
    '310 БЫТОВАЯ ХИМИЯ',
    '180 МЯСНЫЕ ПРОДУКТЫ',
    '220 ХЛЕБ И ВЫПЕЧКА',
    '150 ОВОЩИ, ФРУКТЫ',
];
/** Форматы магазинов — используются как справочник для dropdown и маппинга цветов. */
export const FORMATS_META = {
    express: {
        id: 'express',
        name: 'Экспресс',
        colorKey: 'sky',
        planWriteoff: 2.09,
        planShrinkage: 0.55,
        count: 16,
    },
    minimarket: {
        id: 'minimarket',
        name: 'Минимаркет',
        colorKey: 'tangerine',
        planWriteoff: 2.25,
        planShrinkage: 0.6,
        count: 101,
    },
    super: {
        id: 'super',
        name: 'Супермаркет',
        colorKey: 'fuchsia',
        planWriteoff: 1.95,
        planShrinkage: 0.5,
        count: 29,
    },
    home: {
        id: 'home',
        name: 'Магазин у дома',
        colorKey: 'amber',
        planWriteoff: 1.15,
        planShrinkage: 0.45,
        count: 220,
    },
    superstore: {
        id: 'superstore',
        name: 'Суперстор',
        colorKey: 'g500',
        planWriteoff: 0.92,
        planShrinkage: 0.38,
        count: 34,
    },
};
/** Справочник дивизионов по формату. */
export const DIVISION_BY_FORMAT = {
    express: 'Сеть Экспресс',
    minimarket: 'Сеть Дискаунтеров',
    super: 'Сеть Супермаркетов',
    home: 'Сеть Дискаунтеров',
    superstore: 'Сеть Гипермаркетов',
};
/** Список форматов в порядке отображения (для dropdown). */
export const FORMAT_ORDER = [
    'express',
    'minimarket',
    'super',
    'home',
    'superstore',
];
//# sourceMappingURL=rankedStoresMock.js.map