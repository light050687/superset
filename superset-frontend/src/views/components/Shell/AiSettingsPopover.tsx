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
 * AiSettingsPopover — popover настроек AI (клик по gear-кнопке в
 * CentralPill → row-bot). Точно по мокапу `.ai-pop#aiSettingsPop`:
 *   - секции с ai-pop-head: «Инструменты», «Параметры»
 *   - toggles (switches) с on/off класс
 *   - read-only параметры справа (значения температуры, языка, глубины)
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

export interface AiToolsConfig {
  /** «🔍 Веб-поиск» toggle. */
  webSearch: boolean;
  /** «📊 Визуализация графиков» toggle. */
  charts: boolean;
  /** «🧮 Расчёты по данным» toggle. */
  calculations: boolean;
  /** «💾 SQL-запросы к БД» toggle. */
  sql: boolean;
}

export interface AiParams {
  temperature: number;
  thinkingDepth: 'auto' | 'deep' | 'fast';
  language: 'RU' | 'EN';
}

interface AiSettingsPopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  tools: AiToolsConfig;
  onToolsChange: (tools: AiToolsConfig) => void;
  params: AiParams;
}

export const DEFAULT_AI_TOOLS: AiToolsConfig = {
  webSearch: true,
  charts: true,
  calculations: true,
  sql: false,
};

export const DEFAULT_AI_PARAMS: AiParams = {
  temperature: 0.3,
  thinkingDepth: 'auto',
  language: 'RU',
};

/* Popover: blur(28) saturate(160) + popoverShadow + padding 10 — мокап. */
const Popover = styled.div`
  position: fixed;
  min-width: 280px;
  max-width: 320px;
  padding: 10px;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.popoverFilter};
  -webkit-backdrop-filter: ${DS2_VARS.popoverFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rGlass};
  box-shadow: ${DS2_VARS.popoverShadow};
  z-index: 110;
  font-family: ${DS2_VARS.fontSans};
`;

const Head = styled.div`
  font-size: var(--fs-micro);
  font-weight: 600;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 10px 8px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: var(--fs-meta);
  color: ${DS2_VARS.g600};
`;

const RowLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${DS2_VARS.g700};
`;

const RowValue = styled.span`
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
`;

const Switch = styled.button<{ $on: boolean }>`
  width: 28px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: ${({ $on }) => ($on ? DS2_VARS.cSky : DS2_VARS.g200)};
  position: relative;
  cursor: pointer;
  transition: background 0.12s ${DS2_VARS.ease};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '14px' : '2px')};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.12s ${DS2_VARS.ease};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const Sep = styled.div`
  height: 1px;
  background: ${DS2_VARS.g100};
  margin: ${DS2_SPACE.s1}px 2px;
`;

interface Position {
  top: number;
  left: number;
}

function computePosition(
  anchor: HTMLElement,
  width: number,
  height: number,
): Position {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const gap = 10;
  const anchorCenterX = rect.left + rect.width / 2;
  const rawLeft = anchorCenterX - width / 2;
  const left = Math.max(8, Math.min(rawLeft, viewportW - width - 8));
  const above = rect.top - height - gap;
  const top = above >= 8 ? above : rect.bottom + gap;
  return { top, left };
}

export const AiSettingsPopover: FC<React.PropsWithChildren<AiSettingsPopoverProps>> = ({
  anchor,
  open,
  onClose,
  tools,
  onToolsChange,
  params,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ top: 12, left: 12 });

  useLayoutEffect(() => {
    if (!open || !anchor || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    setPos(computePosition(anchor, box.width, box.height));
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        anchor &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  const setTool = (key: keyof AiToolsConfig, value: boolean) =>
    onToolsChange({ ...tools, [key]: value });

  const depthLabel = (() => {
    switch (params.thinkingDepth) {
      case 'deep':
        return t('глубоко');
      case 'fast':
        return t('быстро');
      default:
        return t('авто');
    }
  })();

  return createPortal(
    <Popover
      ref={ref}
      role="dialog"
      aria-label={t('Настройки ИИ-ассистента')}
      data-ai-popover="settings"
      style={{ top: pos.top, left: pos.left }}
    >
      <Head>{t('Инструменты')}</Head>
      <Row>
        <RowLabel>{t('🔍 Веб-поиск')}</RowLabel>
        <Switch
          type="button"
          $on={tools.webSearch}
          onClick={() => setTool('webSearch', !tools.webSearch)}
          aria-label={t('Веб-поиск')}
          aria-pressed={tools.webSearch}
        />
      </Row>
      <Row>
        <RowLabel>{t('📊 Визуализация графиков')}</RowLabel>
        <Switch
          type="button"
          $on={tools.charts}
          onClick={() => setTool('charts', !tools.charts)}
          aria-label={t('Визуализация графиков')}
          aria-pressed={tools.charts}
        />
      </Row>
      <Row>
        <RowLabel>{t('🧮 Расчёты по данным')}</RowLabel>
        <Switch
          type="button"
          $on={tools.calculations}
          onClick={() => setTool('calculations', !tools.calculations)}
          aria-label={t('Расчёты по данным')}
          aria-pressed={tools.calculations}
        />
      </Row>
      <Row>
        <RowLabel>{t('💾 SQL-запросы к БД')}</RowLabel>
        <Switch
          type="button"
          $on={tools.sql}
          onClick={() => setTool('sql', !tools.sql)}
          aria-label={t('SQL-запросы')}
          aria-pressed={tools.sql}
        />
      </Row>

      <Sep />

      <Head>{t('Параметры')}</Head>
      <Row>
        <RowLabel>{t('Температура')}</RowLabel>
        <RowValue>{params.temperature.toFixed(1)}</RowValue>
      </Row>
      <Row>
        <RowLabel>{t('Глубина мышления')}</RowLabel>
        <RowValue>{depthLabel}</RowValue>
      </Row>
      <Row>
        <RowLabel>{t('Язык ответа')}</RowLabel>
        <RowValue>{params.language}</RowValue>
      </Row>
    </Popover>,
    document.body,
  );
};
