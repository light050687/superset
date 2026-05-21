import { FC, useRef } from 'react';
import type { ChoroplethState, PaletteKey, LegendItem } from './types';
import { PALETTES } from './constants';
import {
  DataSection,
  UploadBtn,
  DataFilename,
  ConfigRow,
  ConfigLabel,
  ConfigSelect,
  PaletteRow,
  PaletteSwatch,
  ClearBtn,
  LegendWrapper,
  LegendItemRow,
  LegendColor,
} from './styles';

const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[];

interface ChoroplethSectionProps {
  state: ChoroplethState | null;
  legendItems: LegendItem[];
  onFileSelected: (file: File) => void;
  onKeyFieldChange: (field: string) => void;
  onValueFieldChange: (field: string) => void;
  onPaletteChange: (palette: PaletteKey) => void;
  onOpacityChange: (opacity: number) => void;
  onClear: () => void;
}

const ChoroplethSection: FC<
  React.PropsWithChildren<ChoroplethSectionProps>
> = ({
  state,
  legendItems,
  onFileSelected,
  onKeyFieldChange,
  onValueFieldChange,
  onPaletteChange,
  onOpacityChange,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      e.target.value = '';
    }
  };

  return (
    <DataSection>
      <UploadBtn
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Загрузить файл данных (CSV или JSON)"
      >
        📊 Загрузить CSV / JSON
      </UploadBtn>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.geojson"
        onChange={handleChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />

      {state && (
        <div style={{ paddingTop: 8 }}>
          {state.filename && <DataFilename>{state.filename}</DataFilename>}

          <ConfigRow>
            <ConfigLabel htmlFor="geo-key-select">Ключ региона</ConfigLabel>
            <ConfigSelect
              id="geo-key-select"
              value={state.keyField}
              onChange={e => onKeyFieldChange(e.target.value)}
            >
              {state.columns.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </ConfigSelect>
          </ConfigRow>

          <ConfigRow>
            <ConfigLabel htmlFor="geo-value-select">Метрика</ConfigLabel>
            <ConfigSelect
              id="geo-value-select"
              value={state.valueField}
              onChange={e => onValueFieldChange(e.target.value)}
            >
              {state.columns.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </ConfigSelect>
          </ConfigRow>

          <ConfigRow>
            <ConfigLabel>Палитра</ConfigLabel>
            <PaletteRow role="radiogroup" aria-label="Цветовая палитра">
              {PALETTE_KEYS.map(key => {
                const pal = PALETTES[key];
                return (
                  <PaletteSwatch
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={key === state.palette}
                    aria-label={`Палитра ${pal.name}`}
                    title={pal.name}
                    isActive={key === state.palette}
                    gradient={`linear-gradient(90deg, ${pal.colors[0]}, ${pal.colors[4]})`}
                    onClick={() => onPaletteChange(key)}
                  />
                );
              })}
            </PaletteRow>
          </ConfigRow>

          <ConfigRow>
            <ConfigLabel htmlFor="geo-opacity">
              Прозрачность: {Math.round(state.opacity * 100)}%
            </ConfigLabel>
            <input
              id="geo-opacity"
              type="range"
              min={10}
              max={100}
              value={Math.round(state.opacity * 100)}
              onChange={e => onOpacityChange(Number(e.target.value) / 100)}
              aria-label="Прозрачность"
              style={{ width: '100%' }}
            />
          </ConfigRow>

          {legendItems.length > 0 && (
            <LegendWrapper role="list" aria-label="Легенда">
              {legendItems.map((item, i) => (
                <LegendItemRow key={i} role="listitem">
                  <LegendColor color={item.color} aria-hidden="true" />
                  <span>{item.label}</span>
                </LegendItemRow>
              ))}
            </LegendWrapper>
          )}

          <ClearBtn type="button" onClick={onClear}>
            Очистить данные
          </ClearBtn>
        </div>
      )}
    </DataSection>
  );
};

export default ChoroplethSection;
