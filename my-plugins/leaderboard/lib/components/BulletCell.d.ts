import type { DsTokens } from '../themeTokens';
interface Props {
    value: number;
    plan: number;
    globalMax: number;
    tokens: DsTokens;
}
/**
 * Bullet chart с plan-маркером (столбец "Уровень потерь").
 * Цвет заливки определяется по дельте value-plan и правилу invertGood=true
 * (рост списаний это плохо).
 */
declare function BulletCellInner({ value, plan, globalMax, tokens }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof BulletCellInner>;
export default _default;
//# sourceMappingURL=BulletCell.d.ts.map