import type { Horizon, MetricMode, Store } from './types';
/** Пропс-палитра из VelocityDiverging.tsx — только нужные поля. */
interface DetailPalette {
    up: string;
    dn: string;
    g200: string;
    g50: string;
    g500: string;
    g600: string;
    fontMono: string;
}
interface DetailModalProps {
    store: Store;
    metric: MetricMode;
    horizon: Horizon;
    theme: 'light' | 'dark';
    palette: DetailPalette;
    onClose: () => void;
}
declare const DetailModal: React.FC<DetailModalProps>;
export default DetailModal;
//# sourceMappingURL=DetailModal.d.ts.map