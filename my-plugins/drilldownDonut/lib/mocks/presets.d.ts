import { z } from 'zod';
import { CategoryNode } from '../types';
import { Tokens } from '../themeTokens';
import { toRgba } from '../utils/toRgba';
declare const StructureMockPresetSchema: any;
type StructureMockPreset = z.infer<typeof StructureMockPresetSchema>;
export declare const STRUCTURE_MOCK_PRESETS: {
    losses: {
        label: string;
        totalRevenue: number;
        categories: {
            id: string;
            name: string;
            accent: string;
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        }[];
    };
    empty: {
        label: string;
        totalRevenue: number;
        categories: z.infer<any>[];
    };
};
export type StructureMockPresetKey = keyof typeof STRUCTURE_MOCK_PRESETS;
/**
 * Парсит и валидирует custom JSON через Zod-схему.
 * Runtime-граница: внешний вход → типобезопасный StructureMockPreset.
 * При ошибке (JSON invalid или schema violation) возвращает `losses` preset.
 */
declare function parseCustomPreset(json: string | undefined): StructureMockPreset;
/**
 * Возвращает готовые CategoryNode[] с резолвленными цветами и шейдами детей.
 * Используется в transformProps при mockModeEnabled === true.
 */
export declare function getStructurePreset(presetKey: string | undefined, customJson: string | undefined, tokens: Tokens): {
    categories: CategoryNode[];
    totalRevenue: number | null;
};
/** Экспорт для unit-тестов */
export { parseCustomPreset as _parseCustomPreset };
export { toRgba as _toRgba };
//# sourceMappingURL=presets.d.ts.map