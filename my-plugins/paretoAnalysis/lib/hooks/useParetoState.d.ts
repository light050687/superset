import { Dispatch } from 'react';
import { ParetoState, SeriesKind, Unit, Zone } from '../types';
export type ParetoAction = {
    type: 'setThreshold';
    value: number;
} | {
    type: 'setUnit';
    value: Unit;
} | {
    type: 'toggleTopA';
} | {
    type: 'togglePrev';
} | {
    type: 'toggleZone';
    zone: Zone;
} | {
    type: 'toggleSelected';
    id: string;
} | {
    type: 'setSeries';
    kind: SeriesKind;
    visible: boolean;
} | {
    type: 'openDrill';
    id: string;
} | {
    type: 'closeDrill';
} | {
    type: 'resetFilters';
};
export declare function initParetoState(defaultThreshold: number): ParetoState;
export declare function useParetoState(defaultThreshold: number): [ParetoState, Dispatch<ParetoAction>];
//# sourceMappingURL=useParetoState.d.ts.map