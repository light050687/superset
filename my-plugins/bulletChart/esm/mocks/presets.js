import { computeStatus } from '../utils/aggregation';
const FORMATS_PROTOTYPE = [
    {
        id: 'express__0',
        name: 'Экспресс',
        stores: 16,
        rate: 2.36,
        plan: 2.09,
        py: 2.08,
        spark: [1.95, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.36],
        storesList: [
            { name: 'Самбери Экспресс «Центральный»', rate: 2.71, plan: 2.09, py: 2.05 },
            { name: 'Самбери Экспресс «Северный»', rate: 2.58, plan: 2.09, py: 2.18 },
            { name: 'Самбери Экспресс «Привокзальный»', rate: 2.45, plan: 2.09, py: 2.1 },
            { name: 'Самбери Экспресс «Чуркин»', rate: 2.4, plan: 2.09, py: 2.0 },
            { name: 'Самбери Экспресс «Эгершельд»', rate: 2.32, plan: 2.09, py: 2.05 },
            { name: 'Самбери Экспресс «Луговая»', rate: 2.28, plan: 2.09, py: 2.04 },
        ],
    },
    {
        id: 'minimarket__1',
        name: 'Минимаркет',
        stores: 101,
        rate: 2.19,
        plan: 2.25,
        py: 2.23,
        spark: [2.3, 2.28, 2.27, 2.25, 2.24, 2.22, 2.2, 2.19],
        storesList: [
            { name: 'Самбери Минимаркет №34 (Уссурийск)', rate: 2.85, plan: 2.25, py: 2.4 },
            { name: 'Самбери Минимаркет №67 (Хабаровск)', rate: 2.42, plan: 2.25, py: 2.3 },
            { name: 'Самбери Минимаркет №19 (Владивосток)', rate: 2.2, plan: 2.25, py: 2.18 },
            { name: 'Самбери Минимаркет №52 (Артём)', rate: 1.95, plan: 2.25, py: 2.15 },
            { name: 'Самбери Минимаркет №88 (Находка)', rate: 1.78, plan: 2.25, py: 2.05 },
            { name: 'Самбери Минимаркет №12 (Биробиджан)', rate: 1.65, plan: 2.25, py: 1.9 },
        ],
    },
    {
        id: 'super__2',
        name: 'Супермаркет',
        stores: 29,
        rate: 1.71,
        plan: 1.95,
        py: 2.35,
        spark: [2.05, 1.95, 1.88, 1.82, 1.78, 1.75, 1.73, 1.71],
        storesList: [
            { name: 'Самбери Супермаркет «Восточный»', rate: 2.1, plan: 1.95, py: 2.55 },
            { name: 'Самбери Супермаркет «Западный»', rate: 1.95, plan: 1.95, py: 2.4 },
            { name: 'Самбери Супермаркет «Северный»', rate: 1.78, plan: 1.95, py: 2.32 },
            { name: 'Самбери Супермаркет «Центральный»', rate: 1.65, plan: 1.95, py: 2.3 },
            { name: 'Самбери Супермаркет «Южный»', rate: 1.5, plan: 1.95, py: 2.25 },
            { name: 'Самбери Супермаркет «Морской»', rate: 1.35, plan: 1.95, py: 2.2 },
        ],
    },
    {
        id: 'home__3',
        name: 'Магазин у дома',
        stores: 220,
        rate: 1.26,
        plan: 1.15,
        py: 1.13,
        spark: [1.1, 1.13, 1.15, 1.18, 1.2, 1.22, 1.25, 1.26],
        storesList: [
            { name: 'Самбери у дома «Кировка»', rate: 1.85, plan: 1.15, py: 1.2 },
            { name: 'Самбери у дома «Заречье»', rate: 1.62, plan: 1.15, py: 1.18 },
            { name: 'Самбери у дома «Парковая»', rate: 1.48, plan: 1.15, py: 1.15 },
            { name: 'Самбери у дома «Лесная»', rate: 1.35, plan: 1.15, py: 1.12 },
            { name: 'Самбери у дома «Озёрная»', rate: 1.22, plan: 1.15, py: 1.1 },
            { name: 'Самбери у дома «Молодёжная»', rate: 1.08, plan: 1.15, py: 1.05 },
        ],
    },
    {
        id: 'superstore__4',
        name: 'Суперстор',
        stores: 34,
        rate: 0.82,
        plan: 0.92,
        py: 0.9,
        spark: [1.05, 1.0, 0.95, 0.92, 0.88, 0.85, 0.83, 0.82],
        storesList: [
            { name: 'Самбери Суперстор «Восток»', rate: 1.05, plan: 0.92, py: 0.98 },
            { name: 'Самбери Суперстор «Запад»', rate: 0.95, plan: 0.92, py: 0.95 },
            { name: 'Самбери Суперстор «Центр»', rate: 0.85, plan: 0.92, py: 0.92 },
            { name: 'Самбери Суперстор «Гипер-1»', rate: 0.75, plan: 0.92, py: 0.88 },
            { name: 'Самбери Суперстор «Гипер-2»', rate: 0.68, plan: 0.92, py: 0.85 },
            { name: 'Самбери Суперстор «Молл»', rate: 0.55, plan: 0.92, py: 0.8 },
        ],
    },
];
const CATEGORIES_PRESET = [
    { id: 'milk', name: 'Молочная продукция', stores: 388, rate: 3.4, plan: 3.0, py: 3.2, spark: [3.2, 3.1, 3.0, 3.1, 3.2, 3.3, 3.35, 3.4] },
    { id: 'bakery', name: 'Хлебобулочные', stores: 388, rate: 4.1, plan: 3.8, py: 4.0, spark: [3.9, 3.95, 4.0, 4.0, 4.05, 4.1, 4.1, 4.1] },
    { id: 'fruits', name: 'Фрукты и овощи', stores: 388, rate: 5.8, plan: 6.0, py: 6.2, spark: [6.1, 6.0, 5.95, 5.9, 5.85, 5.82, 5.8, 5.8] },
    { id: 'meat', name: 'Мясо и птица', stores: 320, rate: 2.1, plan: 2.3, py: 2.5, spark: [2.4, 2.35, 2.3, 2.25, 2.2, 2.15, 2.12, 2.1] },
    { id: 'alco', name: 'Алкоголь', stores: 280, rate: 0.4, plan: 0.5, py: 0.55, spark: [0.55, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4] },
    { id: 'frozen', name: 'Заморозка', stores: 388, rate: 1.8, plan: 1.5, py: 1.6, spark: [1.6, 1.62, 1.65, 1.7, 1.73, 1.75, 1.77, 1.8] },
    { id: 'snacks', name: 'Снэки', stores: 388, rate: 0.9, plan: 0.95, py: 1.0, spark: [0.98, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.9] },
    { id: 'household', name: 'Бытовая химия', stores: 388, rate: 1.1, plan: 1.2, py: 1.3, spark: [1.25, 1.2, 1.18, 1.15, 1.13, 1.12, 1.11, 1.1] },
];
/**
 * Расширяет storesList до фактического количества магазинов категории.
 * Берёт первые N seed-entries (если есть), затем генерирует остальные
 * псевдослучайно вокруг seed-rate с вариацией ±25%. Стабильно: seeded
 * через index, без Math.random — пресет детерминирован.
 */
function expandStoresList(row) {
    const seeds = row.storesList ?? [];
    const target = row.stores ?? seeds.length;
    if (target <= seeds.length)
        return seeds;
    const baseName = seeds[0]?.name?.replace(/[«"][^»"]*[»"]/, '') || `${row.name} `;
    const plan = row.plan ?? row.rate;
    const py = row.py ?? row.rate;
    // Seeded "random" — стабильно через index + категория hash.
    const hash = row.id
        .split('')
        .reduce((s, c) => s + c.charCodeAt(0), 0);
    const pseudo = (i) => {
        const x = Math.sin(hash * 9999 + i * 17.31) * 10000;
        return x - Math.floor(x); // 0..1
    };
    const out = [...seeds];
    for (let i = seeds.length; i < target; i++) {
        // Вариация rate ±25% от row.rate — кто-то лучше, кто-то хуже.
        const variance = (pseudo(i) - 0.5) * 0.5; // -0.25..+0.25
        const rate = +(row.rate * (1 + variance)).toFixed(2);
        const pyVar = (pseudo(i + 1) - 0.5) * 0.3;
        const pyVal = +(py * (1 + pyVar)).toFixed(2);
        out.push({
            name: `${baseName.trim()} №${String(i + 1).padStart(2, '0')}`,
            rate,
            plan,
            py: pyVal,
        });
    }
    return out;
}
function enrichRow(row, direction, tolerancePct = 5) {
    const expandedStores = expandStoresList(row);
    const deltaPlan = row.plan != null ? row.rate - row.plan : null;
    const deltaPy = row.py != null ? row.rate - row.py : null;
    const status = computeStatus(row.rate, row.plan, direction, tolerancePct);
    return { ...row, storesList: expandedStores, deltaPlan, deltaPy, status };
}
/** Получить пресет по имени. direction нужен для расчёта статусов. */
export function getPreset(presetName, customJson, direction = 'less_is_better', tolerancePct = 5) {
    const enr = (r) => enrichRow(r, direction, tolerancePct);
    switch (presetName) {
        case 'categories':
            return {
                rows: CATEGORIES_PRESET.map(enr),
                totalStores: 388,
                title: 'Уровень списаний по категориям',
            };
        case 'single_row':
            return {
                rows: [enr(FORMATS_PROTOTYPE[3])],
                totalStores: 220,
                title: 'Одна строка',
            };
        case 'many_rows': {
            const rows = [];
            for (let i = 0; i < 20; i += 1) {
                const base = FORMATS_PROTOTYPE[i % FORMATS_PROTOTYPE.length];
                const jitter = (i - 10) * 0.12;
                rows.push(enr({
                    ...base,
                    id: `${base.id}__many_${i}`,
                    name: `${base.name} ${i + 1}`,
                    rate: Math.max(0, base.rate + jitter),
                    stores: Math.round((base.stores ?? 10) * (1 + i * 0.05)),
                    spark: base.spark.map(v => v + jitter * 0.5),
                }));
            }
            return { rows, totalStores: 800, title: 'Много строк (20)' };
        }
        case 'long_names':
            return {
                rows: FORMATS_PROTOTYPE.map(r => enr({
                    ...r,
                    name: `${r.name} с очень длинным названием и уточнениями — филиал №${Math.round(Math.random() * 999)}`,
                })),
                totalStores: 400,
            };
        case 'negative':
            return {
                rows: FORMATS_PROTOTYPE.map((r, i) => enr({
                    ...r,
                    rate: r.rate - (i % 2 === 0 ? 3 : 1.5),
                    spark: r.spark.map(v => v - 2),
                })),
                totalStores: 400,
                title: 'Отрицательные значения',
            };
        case 'empty':
            return { rows: [], totalStores: 0, title: 'Пустой пресет' };
        case 'custom': {
            if (!customJson)
                return { rows: [] };
            try {
                const parsed = JSON.parse(customJson);
                if (!Array.isArray(parsed))
                    return { rows: [] };
                return { rows: parsed.map(enr) };
            }
            catch {
                return { rows: [] };
            }
        }
        case 'formats':
        default:
            return {
                rows: FORMATS_PROTOTYPE.map(enr),
                totalStores: 400,
                title: 'Уровень списаний по форматам',
            };
    }
}
//# sourceMappingURL=presets.js.map