export declare const ROOT_CLASS = "velocity-diverging";
export declare const KEYFRAMES_CSS = "\n@keyframes vd-dd-fade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}\n@keyframes vd-tt-fade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}\n@keyframes vd-m-fade{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}\n@keyframes vd-overlay-in{from{opacity:0}to{opacity:1}}\n@keyframes vd-skeleton-pulse{0%{opacity:.12}50%{opacity:.22}100%{opacity:.12}}\n@keyframes vd-fade-in{from{opacity:0}to{opacity:1}}\n";
/**
 * Корневой контейнер с переменными DS 2.0.
 * width / height — приходят из Superset ChartProps.
 */
export declare const VelocityRoot: import("@emotion/styled").StyledComponent<{
    theme?: import("@emotion/react").Theme;
    as?: React.ElementType;
} & {
    width: number;
    height: number;
}, import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, {}>;
/**
 * Tooltip и Modal — рендерятся в portal (document.body), поэтому
 * у них отдельные styled-корни с инжекцией тех же переменных DS 2.0.
 */
export declare const TooltipRoot: import("@emotion/styled").StyledComponent<{
    theme?: import("@emotion/react").Theme;
    as?: React.ElementType;
}, import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, {}>;
export declare const ModalOverlay: import("@emotion/styled").StyledComponent<{
    theme?: import("@emotion/react").Theme;
    as?: React.ElementType;
}, import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, {}>;
//# sourceMappingURL=styles.d.ts.map