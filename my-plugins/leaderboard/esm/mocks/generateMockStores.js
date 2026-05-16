import { enrichStoreWithMocks } from './storeEnrichment';
import { DIVISION_BY_FORMAT, FORMATS_META } from './rankedStoresMock';
import { randNormal, seededRandom } from './seededRandom';
/**
 * Генерирует детерминированный mock-набор магазинов для режима проектирования.
 * Полностью повторяет логику из ref/ranked-stores-prototype.html.
 */
export function generateMockStores(total = 400) {
    if (total === 0)
        return [];
    const rng = seededRandom(20260315);
    const cityList = [
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
    const subList = {
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
    /* Распределение магазинов по форматам — пропорционально FORMATS_META.count */
    const ratios = {
        express: FORMATS_META.express.count,
        minimarket: FORMATS_META.minimarket.count,
        super: FORMATS_META.super.count,
        home: FORMATS_META.home.count,
        superstore: FORMATS_META.superstore.count,
    };
    const totalRatio = Object.values(ratios).reduce((a, b) => a + b, 0);
    const counts = {
        express: Math.round((ratios.express / totalRatio) * total),
        minimarket: Math.round((ratios.minimarket / totalRatio) * total),
        super: Math.round((ratios.super / totalRatio) * total),
        home: Math.round((ratios.home / totalRatio) * total),
        superstore: Math.round((ratios.superstore / totalRatio) * total),
    };
    const revenueByFormat = {
        express: () => 6 + rng() * 14,
        minimarket: () => 15 + rng() * 25,
        super: () => 45 + rng() * 60,
        home: () => 4 + rng() * 12,
        superstore: () => 110 + rng() * 180,
    };
    const stores = [];
    let idx = 0;
    Object.keys(FORMATS_META).forEach(formatCode => {
        const fmt = FORMATS_META[formatCode];
        const n = counts[formatCode];
        for (let i = 0; i < n; i += 1) {
            let writeoff = randNormal(rng, fmt.planWriteoff, fmt.planWriteoff * 0.35);
            if (rng() < 0.07)
                writeoff = fmt.planWriteoff * (1.5 + rng() * 2.5);
            if (rng() < 0.05)
                writeoff = fmt.planWriteoff * (0.3 + rng() * 0.4);
            writeoff = Math.max(0.05, writeoff);
            let shrinkage = randNormal(rng, fmt.planShrinkage + (writeoff - fmt.planWriteoff) * 0.12, fmt.planShrinkage * 0.45);
            if (rng() < 0.06)
                shrinkage = fmt.planShrinkage * (2 + rng() * 4);
            if (rng() < 0.04)
                shrinkage = fmt.planShrinkage * (0.2 + rng() * 0.4);
            shrinkage = Math.max(-0.3, shrinkage);
            const revenue = revenueByFormat[formatCode]();
            const toClass = Math.round(revenue);
            const city = cityList[Math.floor(rng() * cityList.length)];
            const sub = subList[formatCode][Math.floor(rng() * subList[formatCode].length)];
            const fmtSuffix = fmt.name === 'Магазин у дома' ? '' : fmt.name;
            const name = `${sub} ${fmtSuffix}`.trim();
            const shortLabel = sub;
            const id = `mock-s${idx}`;
            const code = `Д${idx + 1}`;
            const avgWriteoff = Math.round(50 + rng() * 450);
            const avgShrinkageCheck = Math.round(30 + rng() * 280);
            const base = {
                id,
                code,
                name,
                shortLabel,
                city,
                format: formatCode,
                formatName: fmt.name,
                division: DIVISION_BY_FORMAT[formatCode],
                revenue: +revenue.toFixed(1),
                toClass,
                writeoff: +writeoff.toFixed(2),
                shrinkage: +shrinkage.toFixed(2),
                planWriteoff: fmt.planWriteoff,
                planShrinkage: fmt.planShrinkage,
                avgWriteoff,
                avgShrinkageCheck,
            };
            stores.push(enrichStoreWithMocks(base));
            idx += 1;
        }
    });
    return stores;
}
export function generateByPreset(preset) {
    switch (preset) {
        case 'losses_50':
            return generateMockStores(50);
        case 'empty':
            return generateMockStores(0);
        case 'losses_400':
        default:
            return generateMockStores(400);
    }
}
//# sourceMappingURL=generateMockStores.js.map