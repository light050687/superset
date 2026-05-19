import React from 'react';
import { FormatMeta } from './types';
interface LegendListProps {
    formats: FormatMeta[];
    hiddenFormats: Set<string>;
    onToggle: (id: string, solo: boolean) => void;
}
declare const LegendList: React.FC<LegendListProps>;
export default LegendList;
//# sourceMappingURL=Legend.d.ts.map