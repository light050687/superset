import { VitalFewLine } from '../styles/styled';
import { VitalFew } from '../types';
import { formatMetricValue } from '../utils/paretoFormat';

const nf1 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface VitalFewSummaryProps {
  vitalFew: VitalFew;
  metricGenitive: string;
  metricUnit: string;
}

/** Одна строка: «N из M категорий дают X% {metricGenitive} — Y млн ₽». */
export default function VitalFewSummary({
  vitalFew,
  metricGenitive,
  metricUnit,
}: VitalFewSummaryProps) {
  if (vitalFew.countA === 0) return null;
  return (
    <VitalFewLine aria-live="polite">
      <span className="mark" aria-hidden />
      <span>
        <b>{vitalFew.countA}</b> из <b>{vitalFew.total}</b> категорий дают{' '}
        <b className="dn">{nf1.format(vitalFew.cumPctA)}%</b> {metricGenitive} —{' '}
        <b>{formatMetricValue(vitalFew.sumA, metricUnit)}</b>
      </span>
    </VitalFewLine>
  );
}
