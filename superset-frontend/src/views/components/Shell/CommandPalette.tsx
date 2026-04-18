/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Command Palette (Ctrl+K) — глобальный поиск по Superset:
 * дашборды, чарты, датасеты + быстрые действия + проброс в ИИ.
 */
import { styled, SupersetClient, t } from '@superset-ui/core';
import {
  type FC,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useHistory } from 'react-router-dom';
import rison from 'rison';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Открыть ИИ-режим. Если не задан — Tab-шорткат скрыт. */
  onAskAi?: (query: string) => void;
}

interface PaletteRow {
  key: string;
  label: string;
  url?: string;
  action?: () => void;
  kind: 'dashboard' | 'chart' | 'dataset' | 'action' | 'ai';
  subtitle?: string;
  hotkey?: string;
}

const KIND_LABELS: Record<PaletteRow['kind'], string> = {
  dashboard: 'Дашборд',
  chart: 'Диаграмма',
  dataset: 'Датасет',
  action: 'Действие',
  ai: 'ИИ',
};

const KIND_COLORS: Record<PaletteRow['kind'], string> = {
  dashboard: DS2_VARS.cSky,
  chart: DS2_VARS.cViolet,
  dataset: DS2_VARS.cTangerine,
  action: DS2_VARS.g500,
  ai: DS2_VARS.up,
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${DS2_VARS.glassScrim};
  /* Над floating dock (101), под AI overlay (100) + dropdowns (110).
     Command Palette вызывается глобально Ctrl+K и не должен перекрываться
     другими overlay-ями — ставим промежуточный z-index 105. */
  z-index: 105;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  font-family: ${DS2_VARS.fontSans};
`;

const Panel = styled.div`
  width: 560px;
  max-width: calc(100% - 32px);
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.glassFilter};
  -webkit-backdrop-filter: ${DS2_VARS.glassFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rGlass};
  overflow: hidden;
  box-shadow: ${DS2_VARS.glassShadowElev};
  display: flex;
  flex-direction: column;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: 0 ${DS2_SPACE.s4}px;
  border-bottom: 1px solid ${DS2_VARS.g100};

  input {
    flex: 1;
    height: 50px;
    background: transparent;
    border: none;
    outline: none;
    font-family: ${DS2_VARS.fontSans};
    font-size: 15px;
    color: ${DS2_VARS.ink};
  }

  input::placeholder {
    color: ${DS2_VARS.g400};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${DS2_VARS.g400};
    flex-shrink: 0;
  }
`;

const EscChip = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  background: ${DS2_VARS.g100};
  border: 1px solid ${DS2_VARS.g200};
  padding: 2px 6px;
  border-radius: 3px;
`;

const ResultsBox = styled.div`
  max-height: 340px;
  overflow-y: auto;
  padding: ${DS2_SPACE.s1}px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const GroupLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s2}px ${DS2_SPACE.s1}px;
`;

const Row = styled.div<{ $selected: boolean; $accent?: string }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  border-radius: ${DS2_RADIUS.control}px;
  font-size: 13px;
  color: ${({ $accent }) => $accent ?? DS2_VARS.g700};
  cursor: pointer;
  background: ${({ $selected }) =>
    $selected ? DS2_VARS.g100 : 'transparent'};
  transition: background 0.08s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }
`;

const KindTag = styled.span<{ $accent: string }>`
  margin-left: auto;
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${({ $accent }) => `${$accent}22`};
  color: ${({ $accent }) => $accent};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Footer = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s4}px;
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s4}px;
  border-top: 1px solid ${DS2_VARS.g100};
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
`;

const Kbd = styled.kbd`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  background: ${DS2_VARS.g100};
  border: 1px solid ${DS2_VARS.g200};
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 4px;
`;

const SearchIcon: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="7" cy="7" r="4" />
    <path d="M10 10l3.5 3.5" />
  </svg>
);

function detectQuestion(text: string): boolean {
  return /[?]|как |сколько |покажи |построй |создай |найди /i.test(text);
}

async function searchApi(
  query: string,
): Promise<{
  dashboards: PaletteRow[];
  charts: PaletteRow[];
  datasets: PaletteRow[];
}> {
  const q = query.trim();
  if (q.length < 2) return { dashboards: [], charts: [], datasets: [] };

  const mkRison = (col: string) =>
    rison.encode({
      filters: [{ col, opr: 'ct', value: q }],
      page_size: 5,
    });

  try {
    const [dashRes, chartRes, dsRes] = await Promise.allSettled([
      SupersetClient.get({
        endpoint: `/api/v1/dashboard/?q=${mkRison('dashboard_title')}`,
      }),
      SupersetClient.get({
        endpoint: `/api/v1/chart/?q=${mkRison('slice_name')}`,
      }),
      SupersetClient.get({
        endpoint: `/api/v1/dataset/?q=${mkRison('table_name')}`,
      }),
    ]);

    const extract = <T,>(
      res: PromiseSettledResult<{ json: unknown }>,
    ): T[] => {
      if (res.status !== 'fulfilled') return [];
      const body = res.value.json as { result?: T[] };
      return body.result ?? [];
    };

    type DashRow = { id: number; dashboard_title: string; url: string };
    type ChartRow = { id: number; slice_name: string; url: string };
    type DsRow = { id: number; table_name: string; explore_url?: string };

    return {
      dashboards: extract<DashRow>(dashRes).map(r => ({
        key: `dash-${r.id}`,
        label: r.dashboard_title,
        url: r.url,
        kind: 'dashboard',
      })),
      charts: extract<ChartRow>(chartRes).map(r => ({
        key: `chart-${r.id}`,
        label: r.slice_name,
        url: r.url,
        kind: 'chart',
      })),
      datasets: extract<DsRow>(dsRes).map(r => ({
        key: `ds-${r.id}`,
        label: r.table_name,
        url: r.explore_url ?? `/explore/?datasource_id=${r.id}&datasource_type=table`,
        kind: 'dataset',
      })),
    };
  } catch {
    return { dashboards: [], charts: [], datasets: [] };
  }
}

function buildDefaultActions(askAi?: () => void): PaletteRow[] {
  const rows: PaletteRow[] = [
    {
      key: 'home',
      label: t('Главная'),
      url: '/superset/welcome/',
      kind: 'action',
    },
    {
      key: 'sqllab',
      label: t('Открыть SQL Lab'),
      url: '/sqllab/',
      kind: 'action',
    },
    {
      key: 'new-dashboard',
      label: t('Создать дашборд'),
      url: '/dashboard/new/',
      kind: 'action',
    },
    {
      key: 'new-chart',
      label: t('Создать диаграмму'),
      url: '/chart/add',
      kind: 'action',
    },
    {
      key: 'settings',
      label: t('Настройки'),
      url: '/userinfoview/userinfo/',
      kind: 'action',
    },
  ];
  if (askAi) {
    rows.unshift({
      key: 'ask-ai',
      label: t('Спросить ИИ-аналитика'),
      action: askAi,
      kind: 'ai',
      hotkey: 'Tab',
    });
  }
  return rows;
}

interface GroupedRows {
  label: string;
  rows: PaletteRow[];
}

export const CommandPalette: FC<CommandPaletteProps> = ({
  open,
  onClose,
  onAskAi,
}) => {
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [resultRows, setResultRows] = useState<PaletteRow[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResultRows([]);
    setSelected(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Debounce-поиск.
  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setResultRows([]);
      return undefined;
    }
    const handle = window.setTimeout(async () => {
      const { dashboards, charts, datasets } = await searchApi(q);
      setResultRows([...dashboards, ...charts, ...datasets]);
      setSelected(0);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  const defaultActions = useMemo(
    () => buildDefaultActions(onAskAi ? () => onAskAi(query) : undefined),
    [onAskAi, query],
  );

  const grouped = useMemo<GroupedRows[]>(() => {
    const q = query.trim();
    if (q.length < 2) {
      return [{ label: t('Быстрые действия'), rows: defaultActions }];
    }
    const groups: GroupedRows[] = [];
    if (onAskAi && detectQuestion(q)) {
      groups.push({
        label: t('ИИ-аналитик'),
        rows: [
          {
            key: 'ask-ai-query',
            label: t('Спросить ИИ: «%s»', q),
            action: () => onAskAi(q),
            kind: 'ai',
          },
        ],
      });
    }
    const dashboards = resultRows.filter(r => r.kind === 'dashboard');
    const charts = resultRows.filter(r => r.kind === 'chart');
    const datasets = resultRows.filter(r => r.kind === 'dataset');
    if (dashboards.length)
      groups.push({ label: t('Дашборды'), rows: dashboards });
    if (charts.length) groups.push({ label: t('Диаграммы'), rows: charts });
    if (datasets.length)
      groups.push({ label: t('Датасеты'), rows: datasets });
    if (groups.length === 0 && !onAskAi) {
      groups.push({
        label: t('Ничего не найдено'),
        rows: [],
      });
    }
    return groups;
  }, [query, resultRows, defaultActions, onAskAi]);

  // Плоский массив для keyboard-навигации.
  const flatRows = useMemo(() => grouped.flatMap(g => g.rows), [grouped]);

  const activate = useCallback(
    (row: PaletteRow) => {
      if (row.action) {
        row.action();
      } else if (row.url) {
        history.push(row.url);
      }
      onClose();
    },
    [history, onClose],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (onAskAi) {
        onAskAi(query);
        onClose();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = flatRows[selected];
      if (row) activate(row);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(prev => Math.min(prev + 1, Math.max(flatRows.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(prev => Math.max(prev - 1, 0));
    }
  };

  if (!open) return null;

  let counter = -1;

  return createPortal(
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-label={t('Командная палитра')}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Panel>
        <InputRow>
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('Поиск, навигация или вопрос ИИ…')}
            value={query}
            autoComplete="off"
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <EscChip>ESC</EscChip>
        </InputRow>
        <ResultsBox>
          {grouped.map(group => (
            <div key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.rows.length === 0 ? (
                <Row $selected={false}>
                  <span style={{ color: DS2_VARS.g500 }}>—</span>
                </Row>
              ) : (
                group.rows.map(row => {
                  counter += 1;
                  const isSel = counter === selected;
                  return (
                    <Row
                      key={row.key}
                      $selected={isSel}
                      $accent={row.kind === 'ai' ? DS2_VARS.cSky : undefined}
                      onMouseEnter={() => setSelected(counter)}
                      onClick={() => activate(row)}
                    >
                      <span>{row.label}</span>
                      {row.hotkey ? (
                        <Kbd style={{ marginLeft: 'auto' }}>{row.hotkey}</Kbd>
                      ) : (
                        <KindTag $accent={KIND_COLORS[row.kind]}>
                          {KIND_LABELS[row.kind]}
                        </KindTag>
                      )}
                    </Row>
                  );
                })
              )}
            </div>
          ))}
        </ResultsBox>
        <Footer>
          <span>
            <Kbd>↑↓</Kbd>
            {t('навигация')}
          </span>
          <span>
            <Kbd>↵</Kbd>
            {t('выбор')}
          </span>
          {onAskAi ? (
            <span>
              <Kbd>Tab</Kbd>
              {t('спросить ИИ')}
            </span>
          ) : null}
        </Footer>
      </Panel>
    </Overlay>,
    document.body,
  );
};
