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
 * CentralPill — морфирующая капсула поиск+AI внутри FloatingDock.
 *
 * Состояния:
 * - compact (default): 280×44, одна строка «[chip] input [↑]»
 * - expanded (focus):  420×100, две строки
 *     Row 1: «[chip] input [↑]»
 *     Row 2: «[+] [Haiku 4.5 ▾] [voice] [⚙]»
 *
 * Submit (Enter или клик по ↑) вызывает onSubmit(query) — родитель (Shell)
 * открывает AI overlay с этим query как seed.
 *
 * Контекст — выбор «в рамках чего работает ИИ» (Общий / конкретный дашборд).
 * Его значение просто прокидывается через onSubmit как метаданные (строка);
 * физически внедрение в query делает родитель — мы знаем только ID.
 *
 * Cmd+K по-прежнему открывает CommandPalette глобально (хоткей ловится в
 * Shell.tsx) — пилюля ничего про него не знает.
 */
import { css, styled, t } from '@superset-ui/core';
import {
  type FC,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { AiContext, AiModelDescriptor, AiModelId } from './CentralPillTypes';
import { ContextPopover } from './ContextPopover';
import { ModelPopover } from './ModelPopover';

interface CentralPillProps {
  /** Список доступных контекстов AI (минимум DEFAULT_AI_CONTEXT). */
  contexts: readonly AiContext[];
  /** Текущий выбранный контекст — id. */
  contextId: string;
  onContextChange: (ctx: AiContext) => void;
  /** Текущая модель. */
  modelId: AiModelId;
  onModelChange: (model: AiModelDescriptor) => void;
  /** Отправка запроса — вызывается при Enter или клике по ↑. */
  onSubmit: (query: string, meta: { contextId: string; modelId: AiModelId }) => void;
  /** Необязательный hook на focus/blur (для аналитики или подсветки dock'а). */
  onFocusChange?: (focused: boolean) => void;
}

const Pill = styled.div<{ $expanded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: ${({ $expanded }) =>
    $expanded ? DS2_VARS.pillExpandedW : DS2_VARS.pillCompactW};
  height: ${({ $expanded }) =>
    $expanded ? DS2_VARS.pillExpandedH : DS2_VARS.pillCompactH};
  padding: ${({ $expanded }) =>
    $expanded ? `${DS2_SPACE.s2}px` : `${DS2_SPACE.s1}px ${DS2_SPACE.s2}px`};
  background: ${DS2_VARS.glassBgElev};
  border: 1px solid
    ${({ $expanded }) => ($expanded ? DS2_VARS.cSky : DS2_VARS.glassBorder)};
  border-radius: ${DS2_VARS.rPill};
  box-shadow: ${({ $expanded }) =>
    $expanded ? DS2_VARS.glassShadowElev : 'none'};
  transition:
    width 0.2s ${DS2_VARS.ease},
    height 0.2s ${DS2_VARS.ease},
    padding 0.2s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease},
    box-shadow 0.2s ${DS2_VARS.ease};

  @media (max-width: 767px) {
    /* Compact fallback на узких экранах — MobileNav рендерится вместо Dock,
       но если пилюля попала в MobileNav — не расширяем выше compact. */
    width: ${DS2_VARS.pillCompactW};
    height: ${DS2_VARS.pillCompactH};
  }
`;

const InputRow = styled.form`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  flex: 1;
  min-width: 0;
`;

const ContextChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  max-width: 120px;
  padding: 3px 8px;
  background: ${DS2_VARS.g100};
  border: 1px solid transparent;
  border-radius: ${DS2_VARS.rControl};
  color: ${DS2_VARS.g700};
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g200};
    border-color: ${DS2_VARS.g300};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const ContextDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ContextLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 ${DS2_SPACE.s1}px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  color: ${DS2_VARS.ink};

  &::placeholder {
    color: ${DS2_VARS.g400};
  }
`;

const SendBtn = styled.button<{ $visible: boolean }>`
  width: 28px;
  height: 28px;
  padding: 0;
  background: ${DS2_VARS.cSky};
  border: none;
  border-radius: 50%;
  color: ${DS2_VARS.s};
  cursor: pointer;
  flex-shrink: 0;
  display: ${({ $visible }) => ($visible ? 'inline-flex' : 'none')};
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ${DS2_VARS.ease};

  &:hover {
    transform: scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    background: ${DS2_VARS.g300};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const KbdHint = styled.span<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'inline-flex' : 'none')};
  align-items: center;
  gap: 2px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  padding: 2px 6px;
  background: ${DS2_VARS.g100};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 3px;
  flex-shrink: 0;
`;

const ToolsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  padding-top: ${DS2_SPACE.s1}px;
  margin-top: ${DS2_SPACE.s1}px;
  border-top: 1px solid ${DS2_VARS.g100};
  animation: ${css`
    centralPillFadeUp 0.18s ${DS2_VARS.ease}
  `};

  @keyframes centralPillFadeUp {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
`;

const ToolBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  padding: 3px 8px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: ${DS2_VARS.rControl};
  color: ${DS2_VARS.g600};
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
    border-color: ${DS2_VARS.g300};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ToolSpacer = styled.div`
  flex: 1;
`;

const IconPlus: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M6 2v8M2 6h8" />
  </svg>
);

const IconMic: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="4.5" y="1.5" width="3" height="6" rx="1.5" />
    <path d="M2.5 5.5v.5a3.5 3.5 0 007 0v-.5M6 9v2" />
  </svg>
);

const IconGear: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="6" cy="6" r="1.8" />
    <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.5 2.5l1 1M8.5 8.5l1 1M2.5 9.5l1-1M8.5 3.5l1-1" />
  </svg>
);

const IconArrowUp: FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M7 11V3M3 7l4-4 4 4" />
  </svg>
);

const IconChevronDown: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 5l3 3 3-3" />
  </svg>
);

export const CentralPill: FC<CentralPillProps> = ({
  contexts,
  contextId,
  onContextChange,
  modelId,
  onModelChange,
  onSubmit,
  onFocusChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const contextBtnRef = useRef<HTMLButtonElement>(null);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const expanded = focused || query.length > 0 || contextOpen || modelOpen;

  const current = contexts.find(c => c.id === contextId) ?? contexts[0];
  const currentModel =
    modelId === 'opus-4.7'
      ? 'Opus 4.7'
      : modelId === 'sonnet-4.6'
      ? 'Sonnet 4.6'
      : 'Haiku 4.5';

  const handleFocus = useCallback(() => {
    setFocused(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const doSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSubmit(trimmed, { contextId, modelId });
    setQuery('');
    inputRef.current?.blur();
  }, [query, contextId, modelId, onSubmit]);

  const handleFormSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      doSubmit();
    },
    [doSubmit],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
      }
    },
    [],
  );

  const handleContextToggle = useCallback(() => {
    setContextOpen(prev => !prev);
    setModelOpen(false);
  }, []);

  const handleModelToggle = useCallback(() => {
    setModelOpen(prev => !prev);
    setContextOpen(false);
  }, []);

  const canSubmit = query.trim().length > 0;

  return (
    <>
      <Pill $expanded={expanded} role="search" aria-label={t('Поиск и ИИ')}>
        <InputRow onSubmit={handleFormSubmit}>
          <ContextChip
            ref={contextBtnRef}
            type="button"
            onClick={handleContextToggle}
            aria-haspopup="listbox"
            aria-expanded={contextOpen}
            title={current.hint ?? current.label}
          >
            <ContextDot $color={current.colorVar} />
            <ContextLabel>{current.label}</ContextLabel>
          </ContextChip>

          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={t('Спросите о данных…')}
            aria-label={t('Запрос ИИ или поиск')}
          />

          <KbdHint $visible={!expanded}>{t('⌘K')}</KbdHint>

          <SendBtn
            type="submit"
            $visible={canSubmit}
            disabled={!canSubmit}
            aria-label={t('Отправить запрос')}
            title={t('Enter')}
          >
            <IconArrowUp />
          </SendBtn>
        </InputRow>

        {expanded ? (
          <ToolsRow>
            <ToolBtn
              type="button"
              aria-label={t('Прикрепить контекст')}
              title={t('Прикрепить (скоро)')}
            >
              <IconPlus />
            </ToolBtn>

            <ToolBtn
              ref={modelBtnRef}
              type="button"
              onClick={handleModelToggle}
              aria-haspopup="listbox"
              aria-expanded={modelOpen}
              title={t('Выбрать модель')}
            >
              {currentModel}
              <IconChevronDown />
            </ToolBtn>

            <ToolSpacer />

            <ToolBtn
              type="button"
              aria-label={t('Голосовой ввод')}
              title={t('Голос (скоро)')}
            >
              <IconMic />
            </ToolBtn>

            <ToolBtn
              type="button"
              aria-label={t('Настройки ИИ')}
              title={t('Настройки ИИ')}
            >
              <IconGear />
            </ToolBtn>
          </ToolsRow>
        ) : null}
      </Pill>

      <ContextPopover
        anchor={contextBtnRef.current}
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        contexts={contexts}
        currentContextId={contextId}
        onSelect={onContextChange}
      />

      <ModelPopover
        anchor={modelBtnRef.current}
        open={modelOpen}
        onClose={() => setModelOpen(false)}
        currentModelId={modelId}
        onSelect={onModelChange}
      />
    </>
  );
};
