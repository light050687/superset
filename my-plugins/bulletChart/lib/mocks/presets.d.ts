import { FormatRow, Direction } from '../types';
/**
 * Mock-пресеты для режима проектирования.
 *
 * Дефолтный `formats` = данные из bullet-formats-prototype.html (ref:546-614),
 * вместе со storesList для Ctrl+клик drill-down. Остальные пресеты покрывают
 * edge-cases (пусто, отрицательные, много/длинные строки, кастом JSON).
 */
export interface PresetRowsResult {
    rows: FormatRow[];
    totalStores?: number;
    title?: string;
}
/** Получить пресет по имени. direction нужен для расчёта статусов. */
export declare function getPreset(presetName: string | undefined, customJson: string | undefined, direction?: Direction, tolerancePct?: number): PresetRowsResult;
//# sourceMappingURL=presets.d.ts.map