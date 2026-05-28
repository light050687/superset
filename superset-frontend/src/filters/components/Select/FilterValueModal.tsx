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
 * FilterValueModal — модальная замена floating-dropdown'а AntD Select'а
 * для filter_select плагина в Kanban drawer'е.
 *
 * Почему модалка, а не popover:
 *  1) Floating dropdown портально вылетает в document.body — Shell-drawer
 *     ловит клик как «outside» и закрывает drawer (см. issue #3).
 *  2) Список значений может быть длинным (50+ опций) — модалка с
 *     поиском комфортнее, чем узкая дропдаун-полоса.
 *  3) Single-card-driven UX в Kanban → консистентность с DateFilter
 *     Modal, которая уже работает по тому же паттерну.
 *
 * Не покрывает (пока):
 *  - creatable (allowNewOptions) — type-to-add нового значения
 *  - sortComparator — custom-сортировка опций
 *  - serverSide search (searchAllOptions) — search в текущем data set'е
 *  Если потребуется — добавим в следующей итерации.
 */
import { css, styled, t } from '@superset-ui/core';
import { Checkbox, Input, Loading, Modal } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface FilterValueOption {
  value: any;
  label: ReactNode;
  isNewOption?: boolean;
}

export interface FilterValueModalSelectProps {
  options: FilterValueOption[];
  value: any[] | null | undefined;
  multiSelect: boolean;
  onChange: (next: any[]) => void;
  /** Лейбл-подсказка показывается на trigger'е когда value пустой,
   *  и как title модалки. Обычно «3 варианта» / «Выберите значение». */
  placeholder?: string;
  /** Имя фильтра — в заголовке модалки для контекста. */
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  isRefreshing?: boolean;
}

/* ---------- styled ---------- */

const Trigger = styled.button<{ $disabled: boolean }>`
  ${({ theme, $disabled }) => css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit}px;
    background: ${theme.colorBgContainer};
    border: 1px solid ${theme.colorBorder};
    border-radius: ${theme.borderRadius}px;
    padding: ${theme.sizeUnit}px ${theme.sizeUnit * 2}px;
    min-height: ${theme.sizeUnit * 8}px;
    color: ${theme.colorText};
    text-align: left;
    cursor: ${$disabled ? 'not-allowed' : 'pointer'};
    opacity: ${$disabled ? 0.5 : 1};
    transition: border-color 120ms ease;
    &:hover:not(:disabled) {
      border-color: ${theme.colorPrimaryBorder};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `}
`;

const TriggerLabel = styled.span<{ $placeholder: boolean }>`
  ${({ theme, $placeholder }) => css`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${$placeholder ? theme.colorTextPlaceholder : theme.colorText};
  `}
`;

const ActionsRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
    margin-top: ${theme.sizeUnit * 2}px;
    margin-bottom: ${theme.sizeUnit}px;
    padding-left: ${theme.sizeUnit / 2}px;
  `}
`;

const Hint = styled.span`
  ${({ theme }) => css`
    color: ${theme.colorTextTertiary};
    font-size: ${theme.fontSizeSM}px;
    margin-left: auto;
  `}
`;

const OptionsList = styled.div`
  ${({ theme }) => css`
    max-height: 320px;
    overflow-y: auto;
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadius}px;
    margin-top: ${theme.sizeUnit}px;
    scrollbar-width: thin;
    scrollbar-color: var(--g300) transparent;
    &::-webkit-scrollbar {
      width: 10px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--g300);
      border-radius: 5px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
  `}
`;

const OptionRow = styled.button<{ $selected: boolean }>`
  ${({ theme, $selected }) => css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
    padding: ${theme.sizeUnit * 1.5}px ${theme.sizeUnit * 2}px;
    background: ${$selected ? theme.colorPrimaryBg : 'transparent'};
    border: 0;
    border-bottom: 1px solid ${theme.colorBorderSecondary};
    color: ${theme.colorText};
    text-align: left;
    cursor: pointer;
    transition: background 100ms ease;
    &:last-child {
      border-bottom: 0;
    }
    &:hover {
      background: ${$selected
        ? theme.colorPrimaryBgHover
        : theme.colorBgTextHover};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: -2px;
    }
  `}
`;

const CheckBox = styled.span<{ $checked: boolean }>`
  ${({ theme, $checked }) => css`
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border: 1px solid ${$checked ? theme.colorPrimary : theme.colorBorder};
    border-radius: 3px;
    background: ${$checked ? theme.colorPrimary : 'transparent'};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${theme.colorWhite};
    font-size: var(--fs-micro);
    transition:
      background 100ms ease,
      border-color 100ms ease;
  `}
`;

const Empty = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit * 4}px;
    color: ${theme.colorTextSecondary};
    text-align: center;
    font-size: ${theme.fontSizeSM}px;
  `}
`;

/* ---------- helpers ---------- */

function toArray(v: any[] | null | undefined): any[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/* ---------- component ---------- */

export const FilterValueModalSelect: FC<FilterValueModalSelectProps> = ({
  options,
  value,
  multiSelect,
  onChange,
  placeholder,
  title,
  disabled = false,
  loading = false,
  isRefreshing = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<any[]>(toArray(value));
  /* lastClickedIdx — индекс последнего кликнутого option'а (в filtered-
     порядке). Используется для shift-click range-select: юзер кликает
     один option, затем shift+click на другом — все опции между ними
     добавляются в draft. Сбрасывается при изменении search. */
  const lastClickedIdxRef = useRef<number | null>(null);

  /* Синхронизация draft с внешним value при открытии модалки:
     если юзер закрыл modal (cancel), а потом снова открыл, draft
     должен показывать текущий committed value, а не последнюю
     неприменённую правку. */
  useEffect(() => {
    if (open) {
      setDraft(toArray(value));
      lastClickedIdxRef.current = null;
    }
  }, [open, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => {
      const labelStr =
        typeof o.label === 'string' ? o.label : String(o.value ?? '');
      return labelStr.toLowerCase().includes(q);
    });
  }, [options, search]);

  /* При смене search ranges сбрасываем — индексы в новом filtered
     уже другие, anchor невалиден. */
  useEffect(() => {
    lastClickedIdxRef.current = null;
  }, [search]);

  const isSelected = (v: any) => draft.some(d => d === v);

  const toggleAt = (idx: number, shiftKey: boolean) => {
    const opt = filtered[idx];
    if (!opt) return;
    const v = opt.value;

    if (!multiSelect) {
      onChange([v]);
      setOpen(false);
      return;
    }

    if (shiftKey && lastClickedIdxRef.current !== null) {
      /* Range-select: добавляем в draft все опции от last-clicked-idx
         до текущего idx (включительно). Если что-то уже выбрано —
         оставляем; range-action всегда ADD'итивная, не toggle. Это
         match'ит привычное поведение из Gmail/Finder/etc. */
      const start = Math.min(lastClickedIdxRef.current, idx);
      const end = Math.max(lastClickedIdxRef.current, idx);
      const rangeValues = filtered.slice(start, end + 1).map(o => o.value);
      const merged = Array.from(new Set([...draft, ...rangeValues]));
      setDraft(merged);
    } else {
      /* Обычный toggle. */
      setDraft(
        draft.some(d => d === v) ? draft.filter(d => d !== v) : [...draft, v],
      );
    }
    lastClickedIdxRef.current = idx;
  };

  /* Combined select-all checkbox: checked когда все выбраны;
     indeterminate когда часть выбрана; unchecked когда ничего.
     Click toggles между all-selected и cleared. */
  const allChecked = options.length > 0 && draft.length === options.length;
  const someChecked = draft.length > 0 && draft.length < options.length;

  const toggleAll = () => {
    if (allChecked) {
      setDraft([]);
    } else {
      setDraft(options.map(o => o.value));
    }
    lastClickedIdxRef.current = null;
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const cancel = () => {
    setOpen(false);
    setSearch('');
  };

  /* Trigger display:
       0           → placeholder
       1           → актуальный label
       N == total  → «Выбрано всё» (пользователь видит сразу, без счётчика)
       2..N-1      → «Множественный выбор (N)» */
  const triggerLabel = useMemo(() => {
    const arr = toArray(value);
    if (arr.length === 0) return placeholder ?? t('Выберите значение');
    if (arr.length === 1) {
      const found = options.find(o => o.value === arr[0]);
      if (found) {
        return typeof found.label === 'string'
          ? found.label
          : String(found.value);
      }
      return String(arr[0]);
    }
    if (options.length > 0 && arr.length === options.length) {
      return t('Выбрано всё');
    }
    return t('Множественный выбор (%s)', arr.length);
  }, [value, options, placeholder]);

  const arrValue = toArray(value);
  const isPlaceholder = arrValue.length === 0;

  return (
    <>
      <Trigger
        type="button"
        $disabled={disabled}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {isRefreshing ? (
          <Loading position="inline-centered" />
        ) : (
          <TriggerLabel $placeholder={isPlaceholder}>
            {triggerLabel}
          </TriggerLabel>
        )}
      </Trigger>

      <Modal
        show={open}
        onHide={cancel}
        title={title || placeholder || t('Выбор значений')}
        primaryButtonName={t('Применить')}
        onHandledPrimaryAction={apply}
        width={520}
        centered
        destroyOnHidden
        name="filter-value-modal"
      >
        <Input
          autoFocus
          allowClear
          size="middle"
          placeholder={t('Поиск...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          prefix={<Icons.SearchOutlined iconSize="s" />}
        />
        {multiSelect && (
          <ActionsRow>
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={toggleAll}
            >
              {t('Выбрать все (%s)', options.length)}
            </Checkbox>
            <Hint>{t('Shift+клик — диапазон')}</Hint>
          </ActionsRow>
        )}
        {loading ? (
          <Loading position="inline-centered" />
        ) : filtered.length === 0 ? (
          <Empty>{t('Нет результатов')}</Empty>
        ) : (
          <OptionsList>
            {filtered.map((o, idx) => (
              <OptionRow
                key={String(o.value)}
                type="button"
                $selected={isSelected(o.value)}
                onClick={(e: ReactMouseEvent<HTMLButtonElement>) =>
                  toggleAt(idx, e.shiftKey)
                }
              >
                {multiSelect && (
                  <CheckBox $checked={isSelected(o.value)}>
                    {isSelected(o.value) ? '✓' : ''}
                  </CheckBox>
                )}
                <span>{o.label}</span>
              </OptionRow>
            ))}
          </OptionsList>
        )}
      </Modal>
    </>
  );
};

export default FilterValueModalSelect;
