import {
  StateCenter,
  StateTitle,
  StateSub,
  SkeletonBlock,
} from '../styles/styled';
import { DataState } from '../types';

export interface EmptyStateProps {
  state: Exclude<DataState, 'populated'>;
}

/** Загрузочные/пустые/ошибочные состояния по DS 2.0. */
export default function EmptyState({ state }: EmptyStateProps) {
  if (state === 'loading') {
    return (
      <StateCenter role="status" aria-live="polite">
        <SkeletonBlock w="40%" h="14px" />
        <SkeletonBlock w="70%" h="220px" />
        <SkeletonBlock w="50%" h="12px" />
        <StateSub>Загрузка данных…</StateSub>
      </StateCenter>
    );
  }
  if (state === 'error') {
    return (
      <StateCenter role="alert">
        <StateTitle>Не удалось загрузить данные</StateTitle>
        <StateSub>Попробуйте обновить дашборд или проверьте настройки графика.</StateSub>
      </StateCenter>
    );
  }
  if (state === 'stale') {
    return (
      <StateCenter>
        <StateTitle>Данные устарели</StateTitle>
        <StateSub>Показаны кэшированные значения — обновите источник.</StateSub>
      </StateCenter>
    );
  }
  if (state === 'partial') {
    return (
      <StateCenter>
        <StateTitle>Частичные данные</StateTitle>
        <StateSub>Не все категории загрузились, часть графика может отсутствовать.</StateSub>
      </StateCenter>
    );
  }
  return (
    <StateCenter>
      <StateTitle>Нет данных</StateTitle>
      <StateSub>Настройте размерность и метрику в редакторе графика.</StateSub>
    </StateCenter>
  );
}
