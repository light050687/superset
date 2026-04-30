import { VitalFew } from '../types';
export interface VitalFewSummaryProps {
    vitalFew: VitalFew;
    metricGenitive: string;
    metricUnit: string;
}
/** Одна строка: «N из M категорий дают X% {metricGenitive} — Y млн ₽». */
export default function VitalFewSummary({ vitalFew, metricGenitive, metricUnit, }: VitalFewSummaryProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VitalFewSummary.d.ts.map