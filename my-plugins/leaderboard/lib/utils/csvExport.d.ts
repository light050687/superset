import type { Store } from '../types';
export declare function buildCsvRow(s: Store, idx: number): (string | number)[];
export declare function toCsv(stores: Store[]): string;
export declare function defaultCsvFileName(now?: Date): string;
export declare function downloadCsv(stores: Store[], fileName?: string): void;
//# sourceMappingURL=csvExport.d.ts.map