import { ChartProps } from '@superset-ui/core';
import type { RankedStoresTransformedProps } from '../types';
/**
 * Превращает queriesData[0].data → массив Store.
 *
 * 1. Если mockModeEnabled — возвращаем сгенерированный набор по пресету,
 *    игнорируя реальные queriesData.
 * 2. Иначе читаем строки по mapping (camel+snake), приводим типы,
 *    enrichStoreWithMocks дополняет tree/trend/distributions мок-полями.
 */
export default function transformProps(chartProps: ChartProps): RankedStoresTransformedProps;
//# sourceMappingURL=transformProps.d.ts.map