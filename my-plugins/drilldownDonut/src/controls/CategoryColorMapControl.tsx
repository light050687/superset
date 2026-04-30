import { useCallback, useMemo } from 'react';
import { styled, useTheme } from '@superset-ui/core';
import { Input, Select, Button } from '@superset-ui/core/components';
import { AccentKey, ACCENT_PALETTE, CategoryColorOverride } from '../types';
import { LIGHT_TOKENS, DARK_TOKENS, Tokens } from '../themeTokens';
import { isDarkTheme } from '../utils/isDarkTheme';

/**
 * Кастомный Superset-control: редактор списка «категория → accent».
 *
 * Superset отдаёт `value: CategoryColorOverride[]` и `onChange(next)`
 * через props. Используем Ant Design v5 компоненты из
 * `@superset-ui/core/components` (они бренд-согласованы с Superset) плюс
 * useTheme() — значения светлой/тёмной темы берутся из DS 2.0 токенов.
 */

export interface CategoryColorMapControlProps {
  value?: CategoryColorOverride[];
  onChange?: (value: CategoryColorOverride[]) => void;
  label?: string;
  description?: string;
}

/* ── Стили через useTheme (reactive) ── */

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
`;

const RowBox = styled.div`
  display: grid;
  grid-template-columns: 1fr 180px 32px;
  gap: 8px;
  align-items: center;
`;

const SwatchRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const Swatch = styled.span<{ color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
`;

const HelpText = styled.div<{ tone: 'muted' | 'warn' }>`
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 11px;
  color: ${({ tone, theme }) => {
    const dark = isDarkTheme(
      (theme as unknown as { colorBgContainer?: string })?.colorBgContainer,
    );
    const tokens: Tokens = dark ? DARK_TOKENS : LIGHT_TOKENS;
    return tone === 'muted' ? tokens.g500 : tokens.wn;
  }};
  font-style: ${({ tone }) => (tone === 'muted' ? 'italic' : 'normal')};
`;

function CategoryColorMapControl(
  props: CategoryColorMapControlProps,
): JSX.Element {
  const { value, onChange } = props;
  const rows: CategoryColorOverride[] = Array.isArray(value) ? value : [];

  // Реактивно получаем токены по текущей теме Superset
  const theme = useTheme() as unknown as { colorBgContainer?: string };
  const tokens: Tokens = isDarkTheme(theme?.colorBgContainer)
    ? DARK_TOKENS
    : LIGHT_TOKENS;

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.name.trim().toLowerCase();
      if (!k) return;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const dups = new Set<string>();
    counts.forEach((count, k) => {
      if (count > 1) dups.add(k);
    });
    return dups;
  }, [rows]);

  const updateRow = useCallback(
    (idx: number, patch: Partial<CategoryColorOverride>): void => {
      const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      onChange?.(next);
    },
    [rows, onChange],
  );

  const addRow = useCallback((): void => {
    const used = new Set(rows.map((r) => r.accent));
    const nextAccent: AccentKey =
      ACCENT_PALETTE.find((a) => !used.has(a)) ?? 'cSky';
    onChange?.([...rows, { name: '', accent: nextAccent }]);
  }, [rows, onChange]);

  const removeRow = useCallback(
    (idx: number): void => {
      onChange?.(rows.filter((_, i) => i !== idx));
    },
    [rows, onChange],
  );

  const accentOptions = useMemo(
    () =>
      ACCENT_PALETTE.map((a) => ({
        value: a,
        label: (
          <SwatchRow>
            <Swatch color={tokens[a]} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
              {a}
            </span>
          </SwatchRow>
        ),
      })),
    [tokens],
  );

  const hasDuplicates = duplicateNames.size > 0;

  return (
    <Wrap>
      {rows.length === 0 && (
        <HelpText tone="muted">
          Нет переопределений — категории получат цвета из автопалитры по порядку.
        </HelpText>
      )}
      {rows.map((row, idx) => {
        const key = row.name.trim().toLowerCase();
        const isDup = key !== '' && duplicateNames.has(key);
        return (
          <RowBox key={idx}>
            <Input
              size="small"
              placeholder="Имя категории (например «Списания»)"
              value={row.name}
              status={isDup ? 'warning' : undefined}
              onChange={(e) => updateRow(idx, { name: e.target.value })}
              aria-label={`Имя категории ${idx + 1}`}
            />
            <Select
              value={row.accent}
              options={accentOptions}
              onChange={(v) => updateRow(idx, { accent: v as AccentKey })}
              ariaLabel={`Цвет категории ${idx + 1}`}
            />
            <Button
              size="small"
              type="text"
              danger
              onClick={() => removeRow(idx)}
              aria-label={`Удалить строку ${idx + 1}`}
              title="Удалить"
            >
              ×
            </Button>
          </RowBox>
        );
      })}
      {hasDuplicates && (
        <HelpText tone="warn">
          Дубли имён будут проигнорированы — первое вхождение выигрывает.
        </HelpText>
      )}
      <Button size="small" type="dashed" onClick={addRow}>
        + Добавить категорию
      </Button>
    </Wrap>
  );
}

export default CategoryColorMapControl;
