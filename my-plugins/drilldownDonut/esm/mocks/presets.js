import { z } from 'zod';
import { ACCENT_PALETTE } from '../types';
import { toRgba } from '../utils/toRgba';
import { applyChildShades } from '../utils/buildOption';
/**
 * Mock-пресеты для режима проектирования. Данные «losses» 1:1 из
 * `ref/structure-donut-prototype.html` строки 148–195.
 *
 * Zod-схема валидирует JSON от пользователя (runtime boundary):
 * невалидный JSON молча падает в fallback на «losses».
 */
const RawSubcategorySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    rub: z.number().finite(),
    count: z.number().int().nonnegative(),
});
const AccentKeySchema = z.enum(ACCENT_PALETTE);
const RawCategorySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    accent: AccentKeySchema,
    rub: z.number().finite(),
    count: z.number().int().nonnegative(),
    children: z.array(RawSubcategorySchema),
});
const StructureMockPresetSchema = z.object({
    label: z.string().optional().default('Кастом'),
    totalRevenue: z.number().finite().nullable().optional().default(null),
    categories: z.array(RawCategorySchema),
});
export const STRUCTURE_MOCK_PRESETS = {
    losses: {
        label: 'Потери (прототип)',
        totalRevenue: 88500,
        categories: [
            {
                id: 'Списания',
                name: 'Списания',
                accent: 'cSky',
                rub: 3240,
                count: 12480,
                children: [
                    { id: 'Списания/Истёкший срок', name: 'Истёкший срок', rub: 1580, count: 6120 },
                    { id: 'Списания/Товарный вид', name: 'Товарный вид', rub: 870, count: 3240 },
                    { id: 'Списания/Заводской брак', name: 'Заводской брак', rub: 520, count: 1880 },
                    { id: 'Списания/Технический сбой', name: 'Технический сбой', rub: 270, count: 1240 },
                ],
            },
            {
                id: 'Инвентаризации',
                name: 'Инвентаризации',
                accent: 'cViolet',
                rub: 2335,
                count: 8650,
                children: [
                    { id: 'Инвентаризации/Недостача', name: 'Недостача', rub: 1720, count: 5840 },
                    { id: 'Инвентаризации/Пересортица', name: 'Пересортица', rub: 420, count: 1720 },
                    { id: 'Инвентаризации/Излишки (отр.)', name: 'Излишки (отр.)', rub: 195, count: 1090 },
                ],
            },
            {
                id: 'Кражи',
                name: 'Кражи',
                accent: 'cTangerine',
                rub: 1420,
                count: 3120,
                children: [
                    { id: 'Кражи/Внешние', name: 'Внешние', rub: 980, count: 2180 },
                    { id: 'Кражи/Внутренние', name: 'Внутренние', rub: 440, count: 940 },
                ],
            },
            {
                id: 'Повреждения',
                name: 'Повреждения',
                accent: 'cFuchsia',
                rub: 890,
                count: 1985,
                children: [
                    { id: 'Повреждения/При приёмке', name: 'При приёмке', rub: 310, count: 720 },
                    { id: 'Повреждения/В торговом зале', name: 'В торговом зале', rub: 295, count: 680 },
                    { id: 'Повреждения/При транспортировке', name: 'При транспортировке', rub: 185, count: 380 },
                    { id: 'Повреждения/Склад', name: 'Склад', rub: 100, count: 205 },
                ],
            },
            {
                id: 'Прочее',
                name: 'Прочее',
                accent: 'cAmber',
                rub: 345,
                count: 760,
                children: [
                    { id: 'Прочее/Штрафы', name: 'Штрафы', rub: 180, count: 420 },
                    { id: 'Прочее/Возвраты', name: 'Возвраты', rub: 120, count: 240 },
                    { id: 'Прочее/Прочие потери', name: 'Прочие потери', rub: 45, count: 100 },
                ],
            },
        ],
    },
    empty: {
        label: 'Пустой',
        totalRevenue: 0,
        categories: [],
    },
};
/**
 * Парсит и валидирует custom JSON через Zod-схему.
 * Runtime-граница: внешний вход → типобезопасный StructureMockPreset.
 * При ошибке (JSON invalid или schema violation) возвращает `losses` preset.
 */
function parseCustomPreset(json) {
    if (!json || json.trim() === '' || json.trim() === '{}') {
        return STRUCTURE_MOCK_PRESETS.losses;
    }
    let parsedJson;
    try {
        parsedJson = JSON.parse(json);
    }
    catch (_e) {
        // Не логируем в prod: console может быть отсутствующим/мутированным.
        return STRUCTURE_MOCK_PRESETS.losses;
    }
    const result = StructureMockPresetSchema.safeParse(parsedJson);
    if (!result.success) {
        return STRUCTURE_MOCK_PRESETS.losses;
    }
    return result.data;
}
/**
 * Возвращает готовые CategoryNode[] с резолвленными цветами и шейдами детей.
 * Используется в transformProps при mockModeEnabled === true.
 */
export function getStructurePreset(presetKey, customJson, tokens) {
    let preset;
    if (presetKey === 'custom') {
        preset = parseCustomPreset(customJson);
    }
    else if (presetKey === 'empty') {
        preset = STRUCTURE_MOCK_PRESETS.empty;
    }
    else {
        preset = STRUCTURE_MOCK_PRESETS.losses;
    }
    const categories = preset.categories.map((c) => {
        const node = {
            id: c.id,
            name: c.name,
            rub: c.rub,
            count: c.count,
            color: tokens[c.accent],
            accent: c.accent,
            children: c.children.map((ch) => ({
                id: ch.id,
                name: ch.name,
                rub: ch.rub,
                count: ch.count,
                color: '', // перезапишется applyChildShades()
            })),
        };
        applyChildShades(node);
        return node;
    });
    return { categories, totalRevenue: preset.totalRevenue };
}
/** Экспорт для unit-тестов */
export { parseCustomPreset as _parseCustomPreset };
export { toRgba as _toRgba };
//# sourceMappingURL=presets.js.map