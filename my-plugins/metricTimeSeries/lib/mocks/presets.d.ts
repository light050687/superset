import { TimePoint, CategorySeries } from '../types';
/**
 * Returns a mock dataset matching the shape expected by the main component.
 *
 * The `preset` parameter currently toggles between three thematic variants,
 * but they all share the same shape — only labels/scales differ.
 */
export interface MockDataset {
    label: string;
    timePoints: TimePoint[];
    categories: CategorySeries[];
}
export declare function getPreset(preset?: string): MockDataset;
//# sourceMappingURL=presets.d.ts.map