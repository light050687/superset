import { useReducer } from 'react';
function clampThreshold(v) {
    if (!Number.isFinite(v))
        return 80;
    return Math.min(95, Math.max(50, Math.round(v / 5) * 5));
}
export function initParetoState(defaultThreshold) {
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
function reducer(state, action) {
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
export function useParetoState(defaultThreshold) {
    return useReducer(reducer, defaultThreshold, initParetoState);
}
//# sourceMappingURL=useParetoState.js.map