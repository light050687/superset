import type { DsTokens } from '../themeTokens';
interface Props {
    writeoff: number;
    shrinkage: number;
    planWriteoff: number;
    planShrinkage: number;
    maxWriteoff: number;
    maxShrinkage: number;
    tokens: DsTokens;
}
/** Стекованные bullets: СП (tangerine) + НД (sky) с планом. */
declare function DualBulletInner({ writeoff, shrinkage, planWriteoff, planShrinkage, maxWriteoff, maxShrinkage, tokens, }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DualBulletInner>;
export default _default;
//# sourceMappingURL=DualBulletCell.d.ts.map