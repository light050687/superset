/**
 * Метаданные статусов магазина/сегмента.
 * Цвета определяются через ключ токена (см. DsTokens), не хардкодятся.
 */
export const STATUSES = {
    ok: {
        label: 'Норма',
        description: 'Оба показателя в норме',
        colorKey: 'up',
        rank: 1,
    },
    writeoff: {
        label: 'Списания',
        description: 'Высокие списания',
        colorKey: 'tangerine',
        rank: 2,
    },
    shrinkage: {
        label: 'Недостачи',
        description: 'Высокие недостачи',
        colorKey: 'sky',
        rank: 3,
    },
    critical: {
        label: 'Критически',
        description: 'Обе проблемы',
        colorKey: 'dn',
        rank: 4,
    },
};
/**
 * Вычисляет статус по дельте к плану.
 * Если любая из метрик превышает план более чем на 15%, статус "плохой".
 */
export function deriveStatus({ writeoff, shrinkage, planWriteoff, planShrinkage, }) {
    const dW = writeoff - planWriteoff;
    const dS = shrinkage - planShrinkage;
    const badW = dW > Math.max(planWriteoff, 0.01) * 0.15;
    const badS = dS > Math.max(planShrinkage, 0.01) * 0.15;
    if (badW && badS)
        return 'critical';
    if (badW)
        return 'writeoff';
    if (badS)
        return 'shrinkage';
    return 'ok';
}
//# sourceMappingURL=statusRules.js.map