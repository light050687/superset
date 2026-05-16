import type { ReactNode } from 'react';
export interface InfoHintProps {
    ariaLabel: string;
    children: ReactNode;
    closeOnEscape?: boolean;
    /** Заголовок окна. DS §02: 14px UPPERCASE. Default — «Управление чартом». */
    title?: string;
}
export interface InfoHintHandle {
    isOpen: () => boolean;
    open: () => void;
    close: () => void;
}
export declare const InfoHint: import("react").ForwardRefExoticComponent<InfoHintProps & import("react").RefAttributes<InfoHintHandle>>;
//# sourceMappingURL=InfoHint.d.ts.map