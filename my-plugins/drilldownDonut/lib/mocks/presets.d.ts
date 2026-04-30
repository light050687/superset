import { z } from 'zod';
import { AccentKey, CategoryNode } from '../types';
import { Tokens } from '../themeTokens';
import { toRgba } from '../utils/toRgba';
declare const RawCategorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    accent: z.ZodEnum<[AccentKey, ...AccentKey[]]>;
    rub: z.ZodNumber;
    count: z.ZodNumber;
    children: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        rub: z.ZodNumber;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rub?: number;
        name?: string;
        id?: string;
        count?: number;
    }, {
        rub?: number;
        name?: string;
        id?: string;
        count?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    rub?: number;
    name?: string;
    children?: {
        rub?: number;
        name?: string;
        id?: string;
        count?: number;
    }[];
    id?: string;
    accent?: AccentKey;
    count?: number;
}, {
    rub?: number;
    name?: string;
    children?: {
        rub?: number;
        name?: string;
        id?: string;
        count?: number;
    }[];
    id?: string;
    accent?: AccentKey;
    count?: number;
}>;
declare const StructureMockPresetSchema: z.ZodObject<{
    label: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    totalRevenue: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    categories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        accent: z.ZodEnum<[AccentKey, ...AccentKey[]]>;
        rub: z.ZodNumber;
        count: z.ZodNumber;
        children: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            rub: z.ZodNumber;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }, {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        rub?: number;
        name?: string;
        children?: {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }[];
        id?: string;
        accent?: AccentKey;
        count?: number;
    }, {
        rub?: number;
        name?: string;
        children?: {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }[];
        id?: string;
        accent?: AccentKey;
        count?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    label?: string;
    categories?: {
        rub?: number;
        name?: string;
        children?: {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }[];
        id?: string;
        accent?: AccentKey;
        count?: number;
    }[];
    totalRevenue?: number;
}, {
    label?: string;
    categories?: {
        rub?: number;
        name?: string;
        children?: {
            rub?: number;
            name?: string;
            id?: string;
            count?: number;
        }[];
        id?: string;
        accent?: AccentKey;
        count?: number;
    }[];
    totalRevenue?: number;
}>;
type RawCategory = z.infer<typeof RawCategorySchema>;
type StructureMockPreset = z.infer<typeof StructureMockPresetSchema>;
export declare const STRUCTURE_MOCK_PRESETS: {
    losses: {
        label: string;
        totalRevenue: number;
        categories: ({
            id: string;
            name: string;
            accent: "cSky";
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        } | {
            id: string;
            name: string;
            accent: "cViolet";
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        } | {
            id: string;
            name: string;
            accent: "cTangerine";
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        } | {
            id: string;
            name: string;
            accent: "cFuchsia";
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        } | {
            id: string;
            name: string;
            accent: "cAmber";
            rub: number;
            count: number;
            children: {
                id: string;
                name: string;
                rub: number;
                count: number;
            }[];
        })[];
    };
    empty: {
        label: string;
        totalRevenue: number;
        categories: RawCategory[];
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