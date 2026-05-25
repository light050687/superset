/**
 * Детерминированный генератор мок-данных — порт `generateStores()` из
 * `ref/velocity-diverging-prototype.html`. Seed фиксирован, чтобы один и
 * тот же дашборд у всех пользователей отрисовывался одинаково.
 *
 * v2: модель данных period-over-period. Возвращаем prev/curr скаляры
 * (агрегаты loss за прошлый/текущий период) + опциональный тренд
 * длиной 12 точек (для DetailModal — равняется main-периоду в demo-режиме).
 *
 * `comparisonMode` влияет на «силу» разницы prev vs curr:
 *  - prev_week — небольшой сдвиг (±5%)
 *  - prev_month / prev_quarter — средний
 *  - prev_year / prev_period / custom — крупный (могут быть кратные изменения)
 */
const SEED = 20260315;
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}
/** Box-Muller — нормальное распределение. */
function randN(rng, m, sd) {
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    return m + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sd;
}
/** Дефолтные форматы — точная копия FORMATS из прототипа. */
export const DEFAULT_FORMATS = [
    { id: 'express', name: 'Экспресс', color: 'c-sky', plan: 2.09, count: 16 },
    { id: 'minimarket', name: 'Минимаркет', color: 'c-tangerine', plan: 2.25, count: 101 },
    { id: 'super', name: 'Супермаркет', color: 'c-fuchsia', plan: 1.95, count: 29 },
    { id: 'home', name: 'Магазин у дома', color: 'c-amber', plan: 1.15, count: 220 },
    { id: 'superstore', name: 'Суперстор', color: 'g500', plan: 0.92, count: 34 },
];
const CITIES = [
    'Хабаровск',
    'Владивосток',
    'Уссурийск',
    'Артём',
    'Находка',
    'Биробиджан',
    'Спасск-Дальний',
    'Благовещенск',
    'Комсомольск',
    'Амурск',
];
const SUBS = {
    express: [
        'Центральная',
        'Северная',
        'Привокзальная',
        'Чуркинская',
        'Эгершельдская',
        'Луговая',
        'Морская',
    ],
    minimarket: [
        'Студенческая',
        'Ленинская',
        'Светланская',
        'Крайняя',
        'Заводская',
        'Рабочая',
        'Пионерская',
    ],
    super: [
        'Восточная',
        'Западная',
        'Северная',
        'Южная',
        'Центральная',
        'Морская',
        'Парковая',
    ],
    home: [
        'Кировская',
        'Заречная',
        'Парковая',
        'Лесная',
        'Озёрная',
        'Молодёжная',
        'Школьная',
        'Садовая',
        'Полевая',
        'Волочаевская',
        'Ватутинская',
        'Фрунзе',
        'Ушакова',
        'Игнатьевская',
    ],
    superstore: ['Молл', 'Гипер-1', 'Гипер-2', 'Восток', 'Запад', 'Центр'],
};
/**
 * Возвращает множитель для prev → curr в зависимости от режима сравнения.
 * Чем больше «дистанция» между prev и curr — тем сильнее разброс.
 */
function modeFactorRange(mode) {
    switch (mode) {
        case 'prev_week':
            return { mean: 0.0, sd: 0.05 };
        case 'prev_month':
            return { mean: 0.03, sd: 0.12 };
        case 'prev_quarter':
            return { mean: 0.05, sd: 0.18 };
        case 'prev_year':
            return { mean: 0.08, sd: 0.28 };
        case 'custom':
        case 'prev_period':
        default:
            return { mean: 0.04, sd: 0.2 };
    }
}
export function generateStores(formats = DEFAULT_FORMATS, seed = SEED, comparisonMode = 'prev_period') {
    const rng = seededRandom(seed);
    const stores = [];
    let id = 0;
    const { mean: slopeMean, sd: slopeSd } = modeFactorRange(comparisonMode);
    formats.forEach(fmt => {
        const count = fmt.count ?? 50;
        const plan = fmt.plan ?? 1.5;
        const subList = SUBS[fmt.id] ?? ['Магазин'];
        for (let i = 0; i < count; i += 1) {
            const city = CITIES[Math.floor(rng() * CITIES.length)];
            const name = subList[Math.floor(rng() * subList.length)];
            const code = `Д${id + 1}`;
            const to = Math.round(20 + rng() * 300);
            // Базовая «средняя» сумма потерь — пропорциональна ТО и плану формата.
            const baseRub = Math.max(10, randN(rng, to * plan * 0.01 * 10, to * plan * 0.005));
            // Slope = относительный сдвиг prev → curr.
            const t = rng();
            let slope;
            if (t < 0.15)
                slope = randN(rng, 0.4 + slopeMean, slopeSd);
            else if (t < 0.35)
                slope = randN(rng, 0.18 + slopeMean, slopeSd);
            else if (t < 0.65)
                slope = randN(rng, slopeMean, slopeSd);
            else if (t < 0.85)
                slope = randN(rng, -0.1 + slopeMean, slopeSd);
            else
                slope = randN(rng, -0.25 + slopeMean, slopeSd);
            // prev_period 12 weeks: симулируем тренд для DetailModal.
            const trendLen = 12;
            const trendRub = [];
            const trendPct = [];
            const trendLabels = [];
            for (let w = 0; w < trendLen; w += 1) {
                // Линейный наклон от baseRub*(1-slope/2) до baseRub*(1+slope/2)
                const factor = 1 - slope / 2 + (slope * w) / Math.max(1, trendLen - 1);
                const noise = randN(rng, 0, baseRub * 0.08);
                const val = Math.max(5, baseRub * factor + noise);
                trendRub.push(+val.toFixed(0));
                const pct = (val / (to * 10)) * 100;
                trendPct.push(+pct.toFixed(2));
                trendLabels.push(`Н${w + 1}`);
            }
            const currValueRub = +(baseRub * (1 + slope / 2)).toFixed(0);
            const prevValueRub = +(baseRub * (1 - slope / 2)).toFixed(0);
            const currValuePct = +((currValueRub / (to * 10)) * 100).toFixed(2);
            const prevValuePct = +((prevValueRub / (to * 10)) * 100).toFixed(2);
            stores.push({
                id: `s${id}`,
                code,
                name,
                shortLabel: name,
                city,
                format: fmt.id,
                formatName: fmt.name,
                plan,
                to,
                prevValueRub,
                currValueRub,
                prevValuePct,
                currValuePct,
                trendRub,
                trendPct,
                trendLabels,
            });
            id += 1;
        }
    });
    return stores;
}
//# sourceMappingURL=mockGenerator.js.map