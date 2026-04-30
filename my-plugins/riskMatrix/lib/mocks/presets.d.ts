/**
 * Синтетические данные — 400 магазинов с реалистичными распределениями.
 * Используются, когда mock_mode_enabled=true ИЛИ когда запрос не возвращает
 * данных (fallback для Storybook).
 */
import { StorePoint } from '../types';
export interface MockPreset {
    stores: StorePoint[];
    xLabel: string;
    yLabel: string;
    xUnit: string;
    yUnit: string;
}
export declare function getMockPreset(id: string): MockPreset;
//# sourceMappingURL=presets.d.ts.map