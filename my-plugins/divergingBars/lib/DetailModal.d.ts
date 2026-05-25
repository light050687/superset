import type { ComparisonMode, MetricMode, Store } from './types';
/** Пропс-палитра из VelocityDiverging.tsx — только нужные поля. */
interface DetailPalette {
    up: string;
    dn: string;
    g50: string;
    g100: string;
    g200: string;
    g500: string;
    g600: string;
    g700: string;
    s: string;
    ink: string;
    fontText: string;
    fontMono: string;
}
interface DetailModalProps {
    store: Store;
    metric: MetricMode;
    /** Текущий режим сравнения — для подписи «Сравнение с …» в шапке. */
    comparisonMode: ComparisonMode;
    theme: 'light' | 'dark';
    palette: DetailPalette;
    onClose: () => void;
}
declare const DetailModal: React.FC<DetailModalProps>;
export default DetailModal;
//# sourceMappingURL=DetailModal.d.ts.map