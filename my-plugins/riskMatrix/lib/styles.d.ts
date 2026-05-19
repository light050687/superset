/**
 * Emotion-компоненты Scatter · Risk Matrix.
 * Все цвета идут через CSS-переменные (--bg, --s, --ink, --gN, --c-*, --up/dn/wn),
 * которые устанавливаются в CardRoot через data-theme.
 */
import { ThemeTokens } from './themeTokens';
/** Глобальные keyframes инжектируются через <style>-тег в компоненте. */
export declare const KEYFRAMES_CSS = "\n  @keyframes sr-tt-fade { from { opacity: 0; transform: translateY(-2px) } to { opacity: 1; transform: translateY(0) } }\n  @keyframes sr-dd-fade { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: translateY(0) } }\n  @keyframes sr-m-fade { from { opacity: 0 } to { opacity: 1 } }\n  @keyframes sr-m-pop  { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }\n  @keyframes sr-skel-pulse { 0%, 100% { opacity: 0.45 } 50% { opacity: 0.85 } }\n";
/** CSS-переменные DS 2.0 — ставятся на корневом элементе через data-theme */
export declare const themeVars: (t: ThemeTokens) => any;
/**
 * Обёртка для portal-рендера (tooltip / drill-modals) в document.body.
 * Прокидывает CSS-переменные темы — иначе var(--g100) etc. внутри portal'a
 * будут unset (они объявлены только на CardRoot). НЕ создаёт containing
 * block (нет transform / container-type) — поэтому position:fixed внутри
 * работает относительно viewport, а не CardRoot.
 */
export declare const PortalRoot: any;
export declare const CardRoot: any;
export declare const PartialBadge: any;
export declare const StaleBar: any;
export declare const CardHead: any;
export declare const TitleBlock: any;
export declare const CardTitle: any;
export declare const CardSubtitle: any;
export declare const Controls: any;
export declare const Toolbar: any;
export declare const TbBtn: any;
export declare const TbDivider: any;
export declare const SelectDdWrap: any;
export declare const SelectDd: any;
export declare const SelectDdItem: any;
export declare const SearchWrap: any;
export declare const SearchInput: any;
export declare const SearchSelectBtn: any;
export declare const ChartArea: any;
export declare const ChartSvg: any;
export declare const SelectionOverlay: any;
export declare const QuadAnnot: any;
export declare const Legend: any;
export declare const LegendItem: any;
export declare const Footer: any;
/**
 * Popup при ховере на «кучу» магазинов (overlap >1 в радиусе курсора).
 * Кликабельный (pointer-events: auto), в отличие от Tooltip.
 * Click по строке = cross-filter, Ctrl+Click = детализация магазина.
 */
export declare const OverlapList: any;
export declare const Tooltip: any;
export declare const ModalBg: any;
export declare const Modal: any;
export declare const BulletRow: any;
export declare const StoreRow: any;
export declare const Skeleton: any;
export declare const EmptyBlock: any;
//# sourceMappingURL=styles.d.ts.map