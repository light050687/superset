import {
  BreadcrumbRow,
  BreadcrumbBtn,
  BreadcrumbCur,
  BreadcrumbSel,
} from '../styles/styled';
import { ComputedParetoItem, ParetoState } from '../types';
import { zoneLabel } from '../utils/zoneColors';

export interface BreadcrumbProps {
  state: ParetoState;
  items: ComputedParetoItem[];
  /** Дефолтная подпись, когда активных фильтров нет. */
  defaultCaption?: string;
  onReset: () => void;
}

export default function Breadcrumb({
  state,
  items,
  defaultCaption = 'Все категории',
  onReset,
}: BreadcrumbProps) {
  if (state.selectedId) {
    const it = items.find(p => p.id === state.selectedId);
    if (it) {
      return (
        <BreadcrumbRow>
          <BreadcrumbBtn
            type="button"
            aria-label="Снять фильтр"
            title="Снять (Esc)"
            onClick={onReset}
          >
            ◂
          </BreadcrumbBtn>
          <BreadcrumbCur>Фильтр:</BreadcrumbCur>
          <BreadcrumbSel>{it.name}</BreadcrumbSel>
        </BreadcrumbRow>
      );
    }
  }

  if (state.zoneFilter) {
    const count = items.filter(p => p.zone === state.zoneFilter).length;
    return (
      <BreadcrumbRow>
        <BreadcrumbBtn
          type="button"
          aria-label="Снять фильтр"
          title="Снять (Esc)"
          onClick={onReset}
        >
          ◂
        </BreadcrumbBtn>
        <BreadcrumbCur>Зона:</BreadcrumbCur>
        <BreadcrumbSel>{zoneLabel(state.zoneFilter)}</BreadcrumbSel>
        <BreadcrumbCur>· {count} категорий</BreadcrumbCur>
      </BreadcrumbRow>
    );
  }

  // Default state (нет активных фильтров) — ничего не рендерим, лишний шум.
  // subtitleText «за период» уже передаёт контекст. defaultCaption оставлен в
  // API на случай явного override снаружи (не равен дефолту).
  if (defaultCaption !== 'Все категории') {
    return (
      <BreadcrumbRow>
        <BreadcrumbCur>{defaultCaption}</BreadcrumbCur>
      </BreadcrumbRow>
    );
  }
  return null;
}
