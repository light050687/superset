import { enrichStoreWithMocks } from './storeEnrichment';
/**
 * Генерирует детерминированный mock-набор магазинов для режима проектирования.
 * Полностью повторяет логику из ref/ranked-stores-prototype.html.
 */
export declare function generateMockStores(total?: 400 | 50 | 0): ReturnType<typeof enrichStoreWithMocks>[];
export type MockPreset = 'losses_400' | 'losses_50' | 'empty';
export declare function generateByPreset(preset: MockPreset): ReturnType<typeof enrichStoreWithMocks>[];
//# sourceMappingURL=generateMockStores.d.ts.map