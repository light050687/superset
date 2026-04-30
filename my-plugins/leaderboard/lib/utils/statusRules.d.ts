import type { StatusCode, StatusMeta } from '../types';
/**
 * Метаданные статусов магазина/сегмента.
 * Цвета определяются через ключ токена (см. DsTokens), не хардкодятся.
 */
export declare const STATUSES: Record<StatusCode, StatusMeta>;
export interface DeriveStatusInput {
    writeoff: number;
    shrinkage: number;
    planWriteoff: number;
    planShrinkage: number;
}
/**
 * Вычисляет статус по дельте к плану.
 * Если любая из метрик превышает план более чем на 15%, статус "плохой".
 */
export declare function deriveStatus({ writeoff, shrinkage, planWriteoff, planShrinkage, }: DeriveStatusInput): StatusCode;
//# sourceMappingURL=statusRules.d.ts.map