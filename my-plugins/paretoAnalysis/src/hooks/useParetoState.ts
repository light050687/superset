import { useReducer, Dispatch } from 'react';
import { ParetoState, SeriesKind, Unit, Zone } from '../types';

export type ParetoAction =
  | { type: 'setThreshold'; value: number }
  | { type: 'setUnit'; value: Unit }
  | { type: 'toggleTopA' }
  | { type: 'togglePrev' }
  | { type: 'toggleZone'; zone: Zone }
  | { type: 'toggleSelected'; id: string }
  | { type: 'setSeries'; kind: SeriesKind; visible: boolean }
  | { type: 'openDrill'; id: string }
  | { type: 'closeDrill' }
  | { type: 'resetFilters' };

function clampThreshold(v: number): number {
  if (!Number.isFinite(v)) return 80;
  return Math.min(95, Math.max(50, Math.round(v / 5) * 5));
}

export function initParetoState(defaultThreshold: number): ParetoState {
  return {
    threshold: clampThreshold(defaultThreshold),
    unit: 'rub',
    topAOnly: false,
    prevOverlay: false,
    zoneFilter: null,
    selectedId: null,
    seriesVisible: { bars: true, line: true },
    drillId: null,
  };
}

function reducer(state: ParetoState, action: ParetoAction): ParetoState {
  switch (action.type) {
    case 'setThreshold':
      return { ...state, threshold: clampThreshold(action.value) };
    case 'setUnit':
      return { ...state, unit: action.value };
    case 'toggleTopA':
      return { ...state, topAOnly: !state.topAOnly };
    case 'togglePrev':
      return { ...state, prevOverlay: !state.prevOverlay };
    case 'toggleZone': {
      const next = state.zoneFilter === action.zone ? null : action.zone;
      return { ...state, zoneFilter: next, selectedId: null };
    }
    case 'toggleSelected': {
      const next = state.selectedId === action.id ? null : action.id;
      return { ...state, selectedId: next, zoneFilter: null };
    }
    case 'setSeries':
      return {
        ...state,
        seriesVisible: {
          ...state.seriesVisible,
          [action.kind]: action.visible,
        },
      };
    case 'openDrill':
      return { ...state, drillId: action.id };
    case 'closeDrill':
      return { ...state, drillId: null };
    case 'resetFilters':
      return { ...state, zoneFilter: null, selectedId: null };
    default:
      return state;
  }
}

export function useParetoState(
  defaultThreshold: number,
): [ParetoState, Dispatch<ParetoAction>] {
  return useReducer(reducer, defaultThreshold, initParetoState);
}
