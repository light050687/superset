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
 * CentralPill — центральная капсула поиска и AI, точно по мокапу
 * analytics-floating-dock.html (#railAsk).
 *
 * Состояния:
 * - **Compact** (default): 44h × 280min-w, radius 999 (pill). Показывает
 *   только input + `⌘K` hint. Chip скрыт (мокап: `.ra-ctx-compact` всегда
 *   display:none в compact).
 * - **Focused** (click/focus): 84h × 560min-w, radius 20, margin-top:-40
 *   (pill «растёт» вверх из dock'а), border sky, ring + glass shadow.
 *   Показывает обе строки: top с input + kbd/send, bot с toolbar.
 * - **has-text** (есть текст в input): mic-иконка морфит в send-arrow
 *   (круглая sky-кнопка).
 *
 * Enter → onSubmit(query, {contextId, modelId}).
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  AiSettingsPopover,
  DEFAULT_AI_PARAMS,
  DEFAULT_AI_TOOLS,
  type AiToolsConfig,
} from './AiSettingsPopover';
import type {
  AiContext,
  AiModelDescriptor,
  AiModelId,
} from './CentralPillTypes';
import { ContextPopover } from './ContextPopover';
import { ModelPopover } from './ModelPopover';

interface CentralPillProps {
  contexts: readonly AiContext[];
  contextId: string;
  onContextChange: (ctx: AiContext) => void;
  modelId: AiModelId;
  onModelChange: (model: AiModelDescriptor) => void;
  onSubmit: (
    query: string,
    meta: { contextId: string; modelId: AiModelId },
  ) => void;
  onFocusChange?: (focused: boolean) => void;
  /** Принудительно держать pill расширенным (используется когда открыт
   *  AI overlay — тогда строка не должна сворачиваться при кликах вне). */
  keepExpanded?: boolean;
}

/**
 * Контейнер pill. Вертикальный flex (top row + bot row).
 * В compact — видна только top row, height 44, radius 999 (pill).
 * В focused — видны обе, height 84, radius 20, pill «вырастает» вверх
 *   (margin-top:-40), min-width 560, border sky.
 *
 * Expanded-state управляется через CSS-селектор `&.is-focused` OR
 * нативный `:focus-within`. React устанавливает класс `is-focused` когда
 * открыт один из popover'ов (ctx/model) — это заставляет pill оставаться
 * расширенной пока popover открыт (без класса pill бы схлопнулась при
 * переходе focus с input на popover).
 */
/**
 * Pixel-perfect parity с мокапом `.rail-ask` (analytics-floating-dock.html):
 * - compact: bg --pill-bg (полупрозрачный, виден стеклянный dock сквозь pill),
 *   border --g200, radius 999;
 * - hover compact: bg --pill-bg-hover, border --g300;
 * - focused: bg --pill-bg-focused, border --pill-focus-border (sky-mix 55%),
 *   radius 20, height 84, margin-top -40, shadow --pill-focus-shadow.
 */
const Pill = styled.div<{ $expanded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  /* Мокап использует глобальный box-sizing: border-box → height 44 ВКЛЮЧАЕТ
     border. Без этого pill получался 46 (44 + 2×1px border). */
  box-sizing: border-box;
  height: ${({ $expanded }) => ($expanded ? '64px' : '32px')};
  min-width: ${({ $expanded }) => ($expanded ? '582px' : '291px')};
  padding: 0;
  margin: ${({ $expanded }) => ($expanded ? '-32px 4px 0' : '0 4px')};
  background: ${({ $expanded }) =>
    $expanded ? DS2_VARS.pillBgFocused : DS2_VARS.pillBg};
  border: 1px solid
    ${({ $expanded }) => ($expanded ? DS2_VARS.pillFocusBorder : DS2_VARS.g200)};
  /* DS 2.0: card radius 10px (было 14, юзер просил убрать сильные
     закругления, сверившись с дизайн-документом). */
  border-radius: 10px;
  box-shadow: ${({ $expanded }) =>
    $expanded ? DS2_VARS.pillFocusShadow : 'none'};
  overflow: hidden;
  /* Vertical center в dock'е (родитель RailNav имеет align-items:
     center). Expanded pill grow вверх через margin-top: -32 — pill
     остаётся «прижат низом», просто его top уходит выше dock TOP. */
  align-self: ${({ $expanded }) => ($expanded ? 'flex-end' : 'center')};
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-interactive);
  cursor: ${({ $expanded }) => ($expanded ? 'default' : 'text')};
  transition:
    height 0.22s ${DS2_VARS.ease},
    min-width 0.22s ${DS2_VARS.ease},
    margin 0.22s ${DS2_VARS.ease},
    border-radius 0.22s ${DS2_VARS.ease},
    border-color 0.18s ${DS2_VARS.ease},
    background 0.18s ${DS2_VARS.ease},
    box-shadow 0.18s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $expanded }) =>
      $expanded ? DS2_VARS.pillBgFocused : DS2_VARS.pillBgHover};
    border-color: ${({ $expanded }) =>
      $expanded ? DS2_VARS.pillFocusBorder : DS2_VARS.g300};
  }
`;

/** Top row (always visible): input + kbd-hint / send-button. */
const RowTop = styled.form`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  height: 32px;
  padding: 0 5px 0 11px;
  flex-shrink: 0;
`;

/** Bottom row (visible only when pill focused). Использует CSS-селектор
 *  родителя через ссылку `& ${RowBot}` — но такие component-селекторы
 *  требуют emotion babel-plugin, которого у нас нет. Поэтому:
 *  - RowBot по умолчанию display:none
 *  - Pill в :focus-within / .is-focused задаёт `& > [data-row="bot"]`
 *    selector на data-attribute, который CSS знает.
 */
const RowBot = styled.div<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  height: 32px;
  padding: 0 6px;
  border-top: 1px solid ${DS2_VARS.g100};
`;

const RbLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  flex: 1;
  min-width: 0;
`;

const RbRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  color: ${DS2_VARS.ink};

  &::placeholder {
    color: ${DS2_VARS.g500};
  }
`;

/** Context chip (только в bot row, expanded). */
const CtxChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 6px;
  background: ${DS2_VARS.bg};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 999px;
  color: ${DS2_VARS.g600};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.g300};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 7px;
    height: 7px;
    color: ${DS2_VARS.g500};
    flex-shrink: 0;
  }
`;

const CtxDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const CtxLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

/** Общая toolbar-кнопка (28×28, прозрачная) — attach, gear. */
const TbBtn = styled.button`
  width: 22px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 11px;
    height: 11px;
  }
`;

const TbDivider = styled.span`
  width: 1px;
  height: 14px;
  background: ${DS2_VARS.g200};
  margin: 0 2px;
  opacity: 0.7;
  flex-shrink: 0;
`;

/**
 * Mic button. При has-text морфит в sky circle send-arrow.
 * (Мокап: `.rail-ask.has-text .rb-mic` становится sky circle 30×30.)
 */
const MicBtn = styled.button<{ $hasText: boolean }>`
  width: ${({ $hasText }) => ($hasText ? '24px' : '22px')};
  height: ${({ $hasText }) => ($hasText ? '24px' : '22px')};
  padding: 0;
  background: ${({ $hasText }) => ($hasText ? DS2_VARS.cSky : 'transparent')};
  border: none;
  border-radius: ${({ $hasText }) => ($hasText ? '50%' : '6px')};
  color: ${({ $hasText }) => ($hasText ? '#0C0D10' : DS2_VARS.g500)};
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    border-radius 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $hasText }) => ($hasText ? '#7ABCF5' : DS2_VARS.g100)};
    color: ${({ $hasText }) => ($hasText ? '#0C0D10' : DS2_VARS.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: ${({ $hasText }) => ($hasText ? '12px' : '11px')};
    height: ${({ $hasText }) => ($hasText ? '12px' : '11px')};
  }
`;

/** Model-picker pill: [name][mode][▾]. */
const ModelBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 21px;
  padding: 0 8px;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: ${DS2_VARS.g600};
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 500;
  flex-shrink: 0;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 8px;
    height: 8px;
    color: ${DS2_VARS.g500};
  }
`;

const MName = styled.span`
  font-weight: 600;
  color: ${DS2_VARS.ink};
`;

const MMode = styled.span`
  color: ${DS2_VARS.g500};
`;

/* ─── SVG icons (из мокапа) ─── */

const IconPlus: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const IconMic: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <rect x="6" y="2" width="4" height="8" rx="2" />
    <path d="M3 8a5 5 0 0010 0M8 13v2" />
  </svg>
);

const IconSend: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 13V3.5M3.8 7.7L8 3.5L12.2 7.7" />
  </svg>
);

const IconGear: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" />
  </svg>
);

const IconChevronDown: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 4l3 3 3-3" />
  </svg>
);

export const CentralPill: FC<React.PropsWithChildren<CentralPillProps>> = ({
  contexts,
  contextId,
  onContextChange,
  modelId,
  onModelChange,
  onSubmit,
  onFocusChange,
  keepExpanded = false,
}) => {
  const pillRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctxBtnRef = useRef<HTMLButtonElement>(null);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const gearBtnRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiTools, setAiTools] = useState<AiToolsConfig>(DEFAULT_AI_TOOLS);

  /**
   * Click-outside handler — схлопывает pill когда клик вне pill и вне
   * открытого popover. Подписывается только когда pill expanded (focused
   * ИЛИ popover открыт). При `keepExpanded=true` (открыт AI overlay) —
   * outside click игнорируется, строка остаётся расширенной пока overlay
   * не закроют или не кликнут по другой rail-иконке.
   */
  const expandedNow = focused || ctxOpen || modelOpen;
  useEffect(() => {
    if (!expandedNow || keepExpanded) return undefined;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const pill = pillRef.current;
      if (pill && pill.contains(target)) return;
      // Popover рендерится через portal в body — проверка class на родителях.
      let el: Node | null = target;
      while (el && el !== document.body) {
        if (
          el instanceof HTMLElement &&
          (el.getAttribute('role') === 'listbox' ||
            el.hasAttribute('data-ai-popover'))
        ) {
          return;
        }
        el = el.parentNode;
      }
      setFocused(false);
      onFocusChange?.(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [expandedNow, onFocusChange, keepExpanded]);

  // Синхронизация focused со внешним keepExpanded:
  //  - keepExpanded=true (открыт AI overlay) → pill expanded
  //  - keepExpanded=false (overlay закрылся) → pill возвращается в compact
  useEffect(() => {
    if (keepExpanded) {
      setFocused(true);
      onFocusChange?.(true);
    } else {
      setFocused(false);
      onFocusChange?.(false);
      inputRef.current?.blur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepExpanded]);

  const hasText = query.trim().length > 0;
  // Pill expanded когда focus на input ИЛИ открыт любой popover ИЛИ
  // принудительно через keepExpanded (активен AI overlay).
  const expanded =
    focused || ctxOpen || modelOpen || settingsOpen || keepExpanded;

  const current = contexts.find(c => c.id === contextId) ?? contexts[0];
  const modelLabel =
    modelId === 'opus-4.7'
      ? 'Opus 4.7'
      : modelId === 'sonnet-4.6'
        ? 'Sonnet 4.6'
        : 'Haiku 4.5';
  const modelMode = modelId === 'opus-4.7' ? 'Extended' : 'Default';

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

  const handlePillClick = useCallback(() => {
    // Клик по pill расширяет её и фокусирует input.
    setFocused(true);
    onFocusChange?.(true);
    inputRef.current?.focus();
  }, [onFocusChange]);

  return (
    <>
      <Pill
        ref={pillRef}
        $expanded={expanded}
        role="search"
        aria-label={t('Поиск и ИИ')}
        onClick={handlePillClick}
      >
        <RowTop onSubmit={handleFormSubmit}>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('Спросить ИИ или найти…')}
            aria-label={t('Запрос ИИ или поиск')}
          />
          {/* Compact + has-text: send-кнопка в top-row для быстрого submit без
              разворачивания pill. По мокапу `.ra-kbd` отсутствует. */}
          {!expanded && hasText ? (
            <MicBtn
              type="submit"
              $hasText
              aria-label={t('Отправить')}
              title={t('Enter')}
            >
              <IconSend />
            </MicBtn>
          ) : null}
        </RowTop>

        <RowBot
          $visible={expanded}
          onClick={e => e.stopPropagation()}
          role="toolbar"
          aria-label={t('Инструменты ИИ')}
        >
          <RbLeft>
            <TbBtn
              type="button"
              aria-label={t('Прикрепить')}
              title={t('Прикрепить')}
            >
              <IconPlus />
            </TbBtn>
            <TbDivider />
            <CtxChip
              ref={ctxBtnRef}
              type="button"
              onClick={() => setCtxOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={ctxOpen}
              title={current.hint ?? current.label}
            >
              <CtxDot $color={current.colorVar} />
              <CtxLabel>{current.label}</CtxLabel>
              <IconChevronDown />
            </CtxChip>
          </RbLeft>

          <RbRight>
            <ModelBtn
              ref={modelBtnRef}
              type="button"
              onClick={() => setModelOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={modelOpen}
              title={t('Модель')}
            >
              <MName>{modelLabel}</MName>
              <MMode>{modelMode}</MMode>
              <IconChevronDown />
            </ModelBtn>
            <MicBtn
              type="button"
              $hasText={hasText}
              onClick={() => (hasText ? doSubmit() : undefined)}
              aria-label={hasText ? t('Отправить') : t('Голосовой ввод')}
              title={hasText ? t('Enter') : t('Голосовой ввод')}
            >
              {hasText ? <IconSend /> : <IconMic />}
            </MicBtn>
            <TbBtn
              ref={gearBtnRef}
              type="button"
              onClick={() => setSettingsOpen(prev => !prev)}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              aria-label={t('Настройки ИИ')}
              title={t('Настройки ИИ')}
            >
              <IconGear />
            </TbBtn>
          </RbRight>
        </RowBot>
      </Pill>

      <ContextPopover
        anchor={ctxBtnRef.current}
        open={ctxOpen}
        onClose={() => setCtxOpen(false)}
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

      <AiSettingsPopover
        anchor={gearBtnRef.current}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tools={aiTools}
        onToolsChange={setAiTools}
        params={DEFAULT_AI_PARAMS}
      />
    </>
  );
};
