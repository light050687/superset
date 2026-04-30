import { memo } from 'react';
import { IconButton } from '../styles';
import { downloadCsv } from '../utils/csvExport';
import type { Store } from '../types';

interface Props {
  stores: Store[];
}

function CsvExportButtonInner({ stores }: Props) {
  return (
    <IconButton
      type="button"
      title="Экспорт в CSV"
      aria-label="Экспорт в CSV"
      onClick={() => downloadCsv(stores)}
    >
      <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" />
      </svg>
    </IconButton>
  );
}

export default memo(CsvExportButtonInner);
