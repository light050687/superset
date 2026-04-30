/**
 * Детерминированный генератор мок-данных — порт `generateStores()` из
 * `ref/velocity-diverging-prototype.html`. Seed фиксирован, чтобы один и
 * тот же дашборд у всех пользователей отрисовывался одинаково.
 */
const SEED = 20260315;
/**
 * Линейный конгруэнтный генератор (LCG) — копирует `seededRandom` из
 * прототипа. Даёт идентичный поток чисел на сервере и в браузере.
 */
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
export function generateStores(formats = DEFAULT_FORMATS, seed = SEED) {
    const rng = seededRandom(seed);
    const stores = [];
    let id = 0;
    formats.forEach(fmt => {
        const count = fmt.count ?? 50;
        const plan = fmt.plan ?? 1.5;
        const subList = SUBS[fmt.id] ?? ['Магазин'];
        for (let i = 0; i < count; i += 1) {
            const city = CITIES[Math.floor(rng() * CITIES.length)];
            const name = subList[Math.floor(rng() * subList.length)];
            const code = `Д${id + 1}`;
            const to = Math.round(20 + rng() * 300);
            const t = rng();
            const baseRub = Math.max(10, randN(rng, to * plan * 0.01 * 10, to * plan * 0.005));
            let slope;
            if (t < 0.15)
                slope = randN(rng, 0.15, 0.06);
            else if (t < 0.35)
                slope = randN(rng, 0.06, 0.03);
            else if (t < 0.65)
                slope = randN(rng, 0.01, 0.02);
            else if (t < 0.85)
                slope = randN(rng, -0.04, 0.02);
            else
                slope = randN(rng, -0.1, 0.04);
            const weeksRub = [];
            const weeksPct = [];
            for (let w = 0; w < 12; w += 1) {
                const noise = randN(rng, 0, baseRub * 0.08);
                const val = Math.max(5, baseRub * (1 + slope * w) + noise);
                weeksRub.push(+val.toFixed(0));
                const pct = (val / (to * 10)) * 100;
                weeksPct.push(+pct.toFixed(2));
            }
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
                weeksRub,
                weeksPct,
            });
            id += 1;
        }
    });
    return stores;
}
//# sourceMappingURL=mockGenerator.js.map