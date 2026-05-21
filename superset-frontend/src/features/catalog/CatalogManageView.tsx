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
 * CatalogManageView — 4-колоночный Miller drill-down режим управления
 * каталогом. Рендерится внутри CatalogDrawer при tab='manage'.
 *
 * Функционал:
 *  - drill-down: Департаменты → Подразделы → Папки → Объекты
 *  - добавление / переименование / удаление папок через prompt
 *  - DnD: перетаскивание папок между уровнями и объектов между папками
 *  - переименование названий колонок (catColLabels, localStorage)
 *  - реальные имена объектов через SupersetClient (hook useCatalogObjectNames)
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import { listCatalogItems, updateCatalogFolder } from './api';
import type { CatalogDraft } from './useCatalogDraft';
import { CatalogConfirmModal } from './CatalogConfirmModal';
import { CatalogDeleteModal } from './CatalogDeleteModal';
import { CatalogPromptModal } from './CatalogPromptModal';
import {
  DndBody,
  DndRow,
  type DndPayload,
  type DropZone,
  type FolderLevel,
  type ItemDragPayload,
  dragKindOf,
  folderDragPayload,
  itemDragPayload,
} from './CatalogDndRow';
import type {
  CatalogFolderItem,
  CatalogFolderNode,
  CatalogObjectType,
} from './types';
import { objectKey, useCatalogObjectNames } from './useCatalogObjectNames';
import {
  deriveDefaultFolderName,
  genitivePlural,
  singularAccusative,
  useCatalogColumnLabels,
  type ColumnLabelKey,
} from './useCatalogColumnLabels';
import type { DrilledScope } from './useCatalogFolderItems';

/* Persisted selection (мокап catSel): юзер вернулся в «Управление» —
   видит те же выбранные департамент/подраздел/папку. */
const MANAGE_SEL_STORAGE_KEY = 'mrts-catalog-manage-sel';

interface ManageSelection {
  deptId: number | null;
  subId: number | null;
  folderId: number | null;
}

const EMPTY_SELECTION: ManageSelection = {
  deptId: null,
  subId: null,
  folderId: null,
};

function readSelection(): ManageSelection {
  try {
    const raw = window.localStorage.getItem(MANAGE_SEL_STORAGE_KEY);
    if (!raw) return { ...EMPTY_SELECTION };
    const parsed = JSON.parse(raw) as Partial<ManageSelection>;
    return {
      deptId: typeof parsed.deptId === 'number' ? parsed.deptId : null,
      subId: typeof parsed.subId === 'number' ? parsed.subId : null,
      folderId: typeof parsed.folderId === 'number' ? parsed.folderId : null,
    };
  } catch {
    return { ...EMPTY_SELECTION };
  }
}

function writeSelection(sel: ManageSelection): void {
  try {
    if (sel.deptId === null && sel.subId === null && sel.folderId === null) {
      window.localStorage.removeItem(MANAGE_SEL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(MANAGE_SEL_STORAGE_KEY, JSON.stringify(sel));
    }
  } catch {
    // ignore
  }
}

interface CatalogManageViewProps {
  folders: CatalogFolderNode[];
  onChanged: () => Promise<void> | void;
  /** Текущий scope — управляет фильтрацией списка объектов в 4-й колонке.
   *  Синхронизирован с оверлейным drawer'ом через родительский компонент. */
  scope: DrilledScope;
  /** Draft-буфер: delete/move ops копятся до нажатия «Сохранить», а
   *  «Сбросить» отбрасывает их без сетевого вызова. Управляется
   *  CatalogDrawer'ом, чтобы кнопки Save/Reset в футере drawer'а могли
   *  делегировать commit/discard. */
  draft: CatalogDraft;
}

/* ─── Miller columns grid ─── */

const Grid = styled.div`
  display: grid;
  /* Мокап .drawer-body.cat-body: 1fr 1fr 1fr 1.2fr — 4-я колонка
     (Объекты) чуть шире, под длинные названия. */
  grid-template-columns: 1fr 1fr 1fr 1.2fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 0 22px 18px;
  /* Отключаем горизонтальный overflow — все колонки должны помещаться в
     ширину drawer'а. min-width: 0 на каждой Col обеспечивает shrink. */
  overflow-x: hidden;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  /* Scroll переезжает на Col (раньше был на ColBody). Почему это
     критично: Y-scrollbar резервирует ~15px справа у своего контейнера.
     Если scroll на ColBody — теряет 15px только body, ColHead остаётся
     полной ширины → AddBtn и Count оказываются на разных вертикалях.
     Переключение scroll на Col заставляет head и body оба терять
     одинаковый 15px gutter справа, и вертикаль count/AddBtn сходится
     автоматически через head-padding-right = body-padding-right +
     row-padding-right. */
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-color: ${DS2_VARS.g300} transparent;

  &::-webkit-scrollbar {
    width: 3px;
    height: 0;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  /* Мокап .mc-col: без внутреннего padding, только border-right
     (полу-прозрачный) между колонками. */
  border-right: 1px solid color-mix(in oklab, ${DS2_VARS.g100} 70%, transparent);

  &:last-child {
    border-right: none;
  }
`;

const ColHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  /* head.padding-right = body.padding-right + row.padding-right = 8+8 = 16.
     Гарантирует точное выравнивание AddBtn-right ↔ Count-right, потому
     что scroll переехал на Col — head и body теряют одинаковый gutter
     справа от Y-scrollbar'а. */
  padding: 10px 16px 8px;
  min-height: 32px;
  flex-shrink: 0;
  /* Без sticky/background — заголовок прозрачен, пропускает glass-фон
     drawer'а как было в оригинальном мокапе. При активном скролле
     колонки head уедет вверх (tradeoff ради корректного цвета). */
  border-bottom: 1px solid
    color-mix(in oklab, ${DS2_VARS.g100} 50%, transparent);
  font-size: 9.5px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
`;

/* Мокап: заголовок колонки кликабелен (редактирование имени через prompt).
   Hover — подсвечивается icon карандаша. */
const ColHeadLabel = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & > svg {
    width: 10px;
    height: 10px;
    opacity: 0;
    transition: opacity 0.12s ${DS2_VARS.ease};
    flex-shrink: 0;
  }

  &:hover {
    color: ${DS2_VARS.ink};
  }
  &:hover > svg {
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/* Мокап .mch-count: моно-цифра справа от label'а, перед add-btn.
   Не меняется при hover/selected состоянии колонки. */
const ColHeadCount = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  flex-shrink: 0;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  width: 20px;
  height: 20px;
  /* Мокап .mch-add: квадратная кнопка с мягкими углами (radius 5),
     не круглая. SVG 10×10 внутри. */
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.1s ${DS2_VARS.ease};

  &:hover:not(:disabled) {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: color-mix(in oklab, ${DS2_VARS.cSky} 10%, transparent);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: ${DS2_VARS.g100};
  }
  &:disabled:hover {
    border-color: ${DS2_VARS.g100};
    color: ${DS2_VARS.g500};
    background: none;
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;

const ColBody = styled.div<{ $dropActive?: boolean }>`
  flex: 1;
  /* Scroll теперь на Col, не на ColBody — body просто течёт в рамках
     col content-width'а. Так head и body «теряют» одинаковый gutter,
     и вертикали AddBtn ↔ Count совпадают. */
  padding: 6px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: ${({ $dropActive }) => ($dropActive ? '8px' : '0')};
  background: ${({ $dropActive }) =>
    $dropActive
      ? `color-mix(in oklab, ${DS2_VARS.cSky} 8%, transparent)`
      : 'transparent'};
  box-shadow: ${({ $dropActive }) =>
    $dropActive
      ? `inset 0 0 0 1px color-mix(in oklab, ${DS2_VARS.cSky} 35%, transparent)`
      : 'none'};
  transition:
    background 0.12s ${DS2_VARS.ease},
    box-shadow 0.12s ${DS2_VARS.ease};

  &::-webkit-scrollbar {
    width: 3px;
    height: 0;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const Row = styled.div<{
  $selected?: boolean;
  $dropZone?: DropZone | null;
  $dragging?: boolean;
  $pendingDelete?: boolean;
  /** Папка помечена как только что созданная в draft'е — подсветим
   *  лёгким ободком cSky (как «новая, ещё не сохранённая»). */
  $pendingCreate?: boolean;
}>`
  ${({ $pendingDelete }) =>
    $pendingDelete
      ? `
        opacity: 0.55;
        text-decoration: line-through;
        text-decoration-thickness: 1px;
        text-decoration-color: currentColor;
      `
      : ''}
  ${({ $pendingCreate }) =>
    $pendingCreate
      ? `
        box-shadow: inset 3px 0 0 color-mix(in oklab, var(--c-sky, #5CAAF0) 70%, transparent);
      `
      : ''}
  display: flex;
  align-items: center;
  gap: 8px;
  /* border-box нужен явно: Emotion без reset даёт content-box, и тогда
     width: 100% + padding 7/8 + border 1 раздувает row-а на 18px сверх
     контент-ширины ColBody, уводя Count-right за правую границу колонки
     и ломая выравнивание с AddBtn в ColHead. */
  box-sizing: border-box;
  width: 100%;
  /* Мокап .mc-row: padding 7/8, border 1px transparent (чтобы selected
     border-color не прыгал layout), border-radius 6. */
  padding: 7px 8px;
  border-radius: 6px;
  border: 1px solid
    ${({ $selected, $dropZone }) =>
      $dropZone === 'into'
        ? DS2_VARS.cSky
        : $selected
          ? `color-mix(in oklab, ${DS2_VARS.cSky} 40%, transparent)`
          : 'transparent'};
  cursor: pointer;
  user-select: none;
  transition: all 0.1s ${DS2_VARS.ease};
  background: ${({ $selected, $dropZone }) =>
    $dropZone === 'into'
      ? `color-mix(in oklab, ${DS2_VARS.cSky} 22%, transparent)`
      : $selected
        ? `color-mix(in oklab, ${DS2_VARS.cSky} 10%, transparent)`
        : 'transparent'};
  /* Default color — g700 (как в мокапе для неактивных строк). Hover
     переключает на ink; selected — на cSky. Meta/count наследуют через
     правила ниже. */
  color: ${({ $selected }) => ($selected ? DS2_VARS.cSky : DS2_VARS.g700)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  text-align: left;
  position: relative;
  box-shadow: ${({ $dropZone }) => {
    if ($dropZone === 'above') return `inset 0 2px 0 ${DS2_VARS.cSky}`;
    if ($dropZone === 'below') return `inset 0 -2px 0 ${DS2_VARS.cSky}`;
    if ($dropZone === 'into') {
      return `0 0 0 1px color-mix(in oklab, ${DS2_VARS.cSky} 50%, transparent)`;
    }
    return 'none';
  }};
  opacity: ${({ $dragging }) => ($dragging ? 0.35 : 1)};

  &:hover {
    background: ${({ $selected, $dropZone }) =>
      $dropZone === 'into'
        ? `color-mix(in oklab, ${DS2_VARS.cSky} 22%, transparent)`
        : $selected
          ? `color-mix(in oklab, ${DS2_VARS.cSky} 14%, transparent)`
          : `color-mix(in oklab, ${DS2_VARS.bg3} 70%, transparent)`};
    color: ${({ $selected }) => ($selected ? DS2_VARS.cSky : DS2_VARS.ink)};
  }

  /* Count / Actions swap (мокап .mcr-count / .mcr-actions): count видно по
     умолчанию, actions скрыты; при hover или .is-selected — swap. Правила
     живут на Row, чтобы надёжно сработать через & (без interpolation). */
  & .cat-count {
    transition:
      opacity 0.12s ${DS2_VARS.ease},
      transform 0.12s ${DS2_VARS.ease};
  }
  & .cat-actions {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ${DS2_VARS.ease};
  }
  &:hover .cat-count,
  &.is-selected .cat-count {
    opacity: 0;
    transform: translateX(3px);
  }
  &:hover .cat-actions,
  &.is-selected .cat-actions {
    opacity: 1;
    pointer-events: auto;
  }

  /* Selected state — meta и count тоже принимают sky-оттенок (мокап
     .mc-row.selected .mcr-meta/.mcr-count). */
  &.is-selected .cat-count {
    color: ${DS2_VARS.cSky};
  }
  &.is-selected .cat-actions button {
    color: color-mix(in oklab, ${DS2_VARS.cSky} 75%, transparent);
  }
  &.is-selected .cat-actions button:hover {
    color: ${DS2_VARS.cSky};
    background: color-mix(in oklab, ${DS2_VARS.cSky} 14%, transparent);
  }
  &.is-selected .cat-actions button.mcr-act-del:hover {
    color: ${DS2_VARS.dn};
    background: color-mix(in oklab, ${DS2_VARS.dn} 16%, transparent);
  }
`;

/* Мокап .mcr-dot: 6×6. */
const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

/* Мокап .mcr-ic: компактный квадрат 18×18, радиус 5, иконка 10×10.
   Tinted variant (для item-row) добавляет заливку цвета типа с 14%
   прозрачности; untinted — прозрачный фон поверх bg1 Col. */
const RowIcon = styled.span<{ $color: string; $tinted?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ $color }) => $color};
  background: ${({ $color, $tinted }) =>
    $tinted
      ? `color-mix(in oklab, ${$color} 14%, transparent)`
      : 'transparent'};

  svg {
    width: 10px;
    height: 10px;
  }
`;

/* Мокап .mcr-body: flex column, title + meta, overflow hidden. */
const RowBody = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const Name = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Наследуем color от Row — чтобы selected/hover-стили Row
     автоматически применялись к названию без дополнительных правил. */
  color: inherit;
`;

/* Мокап .mcr-meta — мелкий моно-текст под именем: «N эл.» для папок,
   «dept · 5ч» для объектов. Шрифт 10px, цвет g500; selected state
   тинтит sky через правило Row ниже. */
const MetaLine = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* Мокап .mcr-slot: min-width 42px, высота 20px, actions абсолютом
   внутри (inset:0), не выходят за границы колонки. */
const Slot = styled.span`
  position: relative;
  min-width: 42px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Count = styled.span`
  /* Count занимает те же 20×20, что и DelBtn, и центрирует цифру.
     Без этого "0" (width ~6px) и X-иконка (width 11px внутри 20px
     кнопки) имели бы разный визуальный центр: при hover крестик
     появлялся на 7px левее цифры. Теперь оба центрированы в общем
     20px слоте — смена через crossfade происходит точно в одной
     точке. */
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  line-height: 20px;
  color: ${DS2_VARS.g400};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
`;

/* Мокап .mcr-actions: inset:0 — покрывает весь Slot, кнопки внутри
   выравниваются по правому краю через justify-content: flex-end. */
const Actions = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
`;

/* Мокап .mcr-act: 20×20, radius 5, g500/transparent default, hover bg3.
   Используется как «Переименовать» (pencil). Selected-state через правило
   на родительском Row — крестик/pencil становятся sky-оттеночными. */
const ActBtn = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: ${DS2_VARS.g500};
  border-radius: 5px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
    color: ${DS2_VARS.ink};
  }

  svg {
    width: 11px;
    height: 11px;
  }
`;

/* Мокап .mcr-act-del: при hover красный (danger) — для кнопки удаления.
   Класс mcr-act-del нужен для селекторов на Row.is-selected (перекрытие
   hover'а под тему). */
const DelBtn = styled(ActBtn)`
  &:hover {
    color: ${DS2_VARS.dn};
    background: color-mix(in oklab, ${DS2_VARS.dn} 12%, transparent);
  }
`;

/* Breadcrumb (<dept-name> · ПОДРАЗДЕЛЫ) умышленно НЕ рендерим в col-head.
   Название родительского уровня уже видно в col слева — дублирование в
   заголовке переполняло колонку и вынуждало hack через overflow-x: hidden. */

/* Мокап .mc-empty: компактное empty-состояние с центр-aligned svg 18×18
   сверху и блочным strong + span под ним. Не использует flex/gap —
   вертикальный ритм создают margin'ы на детях, text-align=center
   выравнивает горизонтально. */
const Empty = styled.div`
  padding: 24px 14px;
  text-align: center;
  color: ${DS2_VARS.g500};
  font-size: 11px;
  line-height: 1.5;
  font-family: ${DS2_VARS.fontSans};

  svg {
    display: block;
    width: 18px;
    height: 18px;
    margin: 0 auto 8px;
    color: ${DS2_VARS.g400};
    opacity: 0.6;
  }

  strong {
    display: block;
    font-weight: 500;
    color: ${DS2_VARS.g600};
    margin-bottom: 2px;
  }

  /* Мокап: подсказка после <strong> — простая text-node, которая
     наследует font-size/family от .mc-empty. Чтобы не переиспользовать
     empty DOM с extra span, стилизуем span как inline text-node того же
     параграфа (без mono-шрифта). */
  span {
    display: block;
    font-size: inherit;
    color: inherit;
    font-family: inherit;
  }
`;

/* ─── SVG icons ─── */

const IconPlus = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 1v8M1 5h8" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path d="M2 10l1.5-.3 6-6L8 2l-6 6z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

const IconFolder = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <path d="M2 3h5l2 2h5v8H2z" />
  </svg>
);

const IconFolderSub = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <path d="M3 4l1-1h3l1 1h5v9H3z" />
  </svg>
);

const IconBox = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 8h6" />
  </svg>
);

/* Мокап: иконки по типу объекта. 16×16, strokeWidth 1.5. */
const IconTypeDashboard = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="1" y="1" width="14" height="14" rx="2" />
    <path d="M1 5h14M5 1v14" />
  </svg>
);

const IconTypeChart = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 14V2M2 14h12" />
    <path d="M5 11l2-3 2 2 3-5" />
  </svg>
);

const IconTypeGeo = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12" />
  </svg>
);

/* Мокап: цвета по типу для иконки-фонарика. */
function typeColorFor(
  objectType: CatalogObjectType,
  vizType?: string,
): { color: string; Icon: FC } {
  if (objectType === 'chart') {
    // Географические чарты выделяются teal (cTangerine-like)
    const isGeo =
      vizType &&
      (vizType.startsWith('deck_') ||
        vizType === 'map_box' ||
        vizType === 'country_map' ||
        vizType === 'world_map');
    if (isGeo) return { color: DS2_VARS.cTangerine, Icon: IconTypeGeo };
    return { color: DS2_VARS.cViolet, Icon: IconTypeChart };
  }
  // Dashboard — sky.
  return { color: DS2_VARS.cSky, Icon: IconTypeDashboard };
}

/* ─── Palette (DS 2.0) для новых папок ─── */

const PALETTE = [
  '#3B8BD9',
  '#E870C0',
  '#E87C3E',
  '#16A34A',
  '#8B5CF6',
  '#DC2626',
  '#CA8A04',
  '#CCB604',
];

function nextColor(count: number): string {
  return PALETTE[count % PALETTE.length];
}

/* ─── Component ─── */

export const CatalogManageView: FC<
  React.PropsWithChildren<CatalogManageViewProps>
> = ({ folders: baselineFolders, onChanged, scope, draft }) => {
  /* Derived state из draft: move-ops накладываются на baseline, удалённые
     папки помечаются через deletedFolderIds (но в списке остаются, чтобы
     UI мог показать их зачёркнутыми и разрешить Reset). */
  const { folders, deletedFolderIds, itemsInFolder } = useMemo(
    () => draft.applyDraft(baselineFolders),
    [baselineFolders, draft],
  );
  /* Init selection из localStorage — юзер вернулся в управление → те же
     выбранные папки. Запись в localStorage через useEffect ниже. */
  const initialSel = useMemo(() => readSelection(), []);
  const [deptId, setDeptIdState] = useState<number | null>(initialSel.deptId);
  const [subId, setSubIdState] = useState<number | null>(initialSel.subId);
  const [folderId, setFolderIdState] = useState<number | null>(
    initialSel.folderId,
  );

  const setDeptId = useCallback((v: number | null) => setDeptIdState(v), []);
  const setSubId = useCallback((v: number | null) => setSubIdState(v), []);
  const setFolderId = useCallback(
    (v: number | null) => setFolderIdState(v),
    [],
  );

  /* Любое изменение selection синхронизируется в localStorage. */
  useEffect(() => {
    writeSelection({ deptId, subId, folderId });
  }, [deptId, subId, folderId]);
  const [deleteTarget, setDeleteTarget] = useState<CatalogFolderNode | null>(
    null,
  );
  /* Объекты лежат на уровне папки (listCatalogItems возвращает прямые
     дети конкретной папки, не рекурсивно). Чтобы колонка «Подразделы»
     показывала объекты дефолтной папки (у которой нет под-структуры),
     грузим items для КАЖДОГО выбранного уровня отдельно. Пользователь
     видит: объекты депта сверху во 2-й колонке вместе с подразделами;
     объекты sub'а во 3-й колонке вместе с папками; объекты папки в 4-й. */
  const [deptItems, setDeptItems] = useState<CatalogFolderItem[]>([]);
  const [subItems, setSubItems] = useState<CatalogFolderItem[]>([]);
  const [folderItems, setFolderItems] = useState<CatalogFolderItem[]>([]);
  const [deptItemsLoading, setDeptItemsLoading] = useState(false);
  const [subItemsLoading, setSubItemsLoading] = useState(false);
  const [folderItemsLoading, setFolderItemsLoading] = useState(false);

  /* Confirm-modal state — для merge-операций (dept→dept, sub→sub) и
     других потенциально деструктивных действий в drag'n'drop. */
  interface ConfirmState {
    open: boolean;
    title: string;
    text: string;
    meta?: string[];
    checkLabel?: string;
    submitLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: (checked: boolean) => Promise<void> | void;
  }
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    text: '',
    onConfirm: () => undefined,
  });
  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  const { labels, rename: renameLabel } = useCatalogColumnLabels();

  const depts = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );
  const subs = useMemo(
    () => (deptId === null ? [] : folders.filter(f => f.parent_id === deptId)),
    [folders, deptId],
  );
  const subfolders = useMemo(
    () => (subId === null ? [] : folders.filter(f => f.parent_id === subId)),
    [folders, subId],
  );

  // Сброс selection если удалили выбранную папку
  useEffect(() => {
    if (deptId !== null && !depts.some(f => f.id === deptId)) {
      setDeptId(null);
      setSubId(null);
      setFolderId(null);
    }
  }, [depts, deptId]);
  useEffect(() => {
    if (subId !== null && !subs.some(f => f.id === subId)) {
      setSubId(null);
      setFolderId(null);
    }
  }, [subs, subId]);
  useEffect(() => {
    if (folderId !== null && !subfolders.some(f => f.id === folderId)) {
      setFolderId(null);
    }
  }, [subfolders, folderId]);

  useEffect(() => {
    if (deptId === null) {
      setDeptItems([]);
      return;
    }
    setDeptItemsLoading(true);
    listCatalogItems(deptId)
      .then(setDeptItems)
      .catch(() => setDeptItems([]))
      .finally(() => setDeptItemsLoading(false));
  }, [deptId]);

  useEffect(() => {
    if (subId === null) {
      setSubItems([]);
      return;
    }
    setSubItemsLoading(true);
    listCatalogItems(subId)
      .then(setSubItems)
      .catch(() => setSubItems([]))
      .finally(() => setSubItemsLoading(false));
  }, [subId]);

  useEffect(() => {
    if (folderId === null) {
      setFolderItems([]);
      return;
    }
    setFolderItemsLoading(true);
    listCatalogItems(folderId)
      .then(setFolderItems)
      .catch(() => setFolderItems([]))
      .finally(() => setFolderItemsLoading(false));
  }, [folderId]);

  /* Фильтр по scope — показываем только объекты текущего типа. */
  /* Применяем draft move-item ops к серверным items: убираем ушедшие,
     добавляем пришедшие (синтетические). Фильтруем по текущему scope. */
  const scopedDeptItems = useMemo(
    () =>
      (deptId === null ? [] : itemsInFolder(deptId, deptItems)).filter(
        it => it.object_type === scope,
      ),
    [deptId, deptItems, itemsInFolder, scope],
  );
  const scopedSubItems = useMemo(
    () =>
      (subId === null ? [] : itemsInFolder(subId, subItems)).filter(
        it => it.object_type === scope,
      ),
    [subId, subItems, itemsInFolder, scope],
  );
  const scopedFolderItems = useMemo(
    () =>
      (folderId === null ? [] : itemsInFolder(folderId, folderItems)).filter(
        it => it.object_type === scope,
      ),
    [folderId, folderItems, itemsInFolder, scope],
  );

  /* Названия объектов подгружаем для всех inline items — depts/subs/folders.
     Один кэш-хук покрывает все три уровня, поэтому мерджим списки. */
  const allScopedItems = useMemo(
    () => [...scopedDeptItems, ...scopedSubItems, ...scopedFolderItems],
    [scopedDeptItems, scopedSubItems, scopedFolderItems],
  );
  const objectNames = useCatalogObjectNames(allScopedItems);

  /* ─── Prompt modal state (мокап cat-modal): один state с таргетом
     операции, чтобы не плодить N одинаковых модалок. Текущая операция
     определяет что именно произойдёт при submit. */
  interface PromptState {
    open: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    defaultValue?: string;
    submitLabel?: string;
    onSubmit: (value: string) => Promise<void> | void;
  }
  const [promptState, setPromptState] = useState<PromptState>({
    open: false,
    title: '',
    onSubmit: () => undefined,
  });
  const closePrompt = useCallback(() => {
    setPromptState(prev => ({ ...prev, open: false }));
  }, []);

  /* ─── Rename column label ─── */
  const handleRenameColumn = useCallback(
    (key: ColumnLabelKey, current: string) => {
      setPromptState({
        open: true,
        title: t('Новое название колонки'),
        subtitle: t('Используйте множественное число (например, «Отделы»).'),
        defaultValue: current,
        submitLabel: t('Сохранить'),
        onSubmit: (value: string) => {
          renameLabel(key, value);
        },
      });
    },
    [renameLabel],
  );

  /* ─── Create folder ─── */
  /* Draft-режим: создание папки не шлёт POST, а кладётся в очередь с
     tempId. Папка сразу появляется в tree (видна юзеру), но коммитится
     только при нажатии «Сохранить». Scope берём из текущего UI-режима
     (dashboard/chart), чтобы новая папка попала в правильное срез. */
  const addFolder = useCallback(
    (parentId: number | null, columnKey: ColumnLabelKey) => {
      const columnLabel = labels[columnKey];
      setPromptState({
        open: true,
        title: t('Новый элемент «%s»', columnLabel),
        placeholder: t('Название'),
        submitLabel: t('Создать'),
        onSubmit: (value: string) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          draft.enqueueCreate(
            trimmed,
            parentId,
            scope,
            nextColor(folders.length),
          );
        },
      });
    },
    [folders.length, labels, scope, draft],
  );

  /* ─── Rename folder ─── */
  const renameFolder = useCallback(
    (folder: CatalogFolderNode) => {
      /* Дефолтную папку через UI не переименовать — её имя выводится из
         названия колонки «Департаменты». Кнопка «карандаш» для неё скрыта,
         так что сюда попасть можно только программно. Игнорируем. */
      if (folder.is_default) return;
      setPromptState({
        open: true,
        title: t('Переименовать'),
        subtitle: t('Текущее имя: <strong>%s</strong>', folder.name),
        defaultValue: folder.name,
        submitLabel: t('Сохранить'),
        onSubmit: (value: string) => {
          const trimmed = value.trim();
          if (!trimmed || trimmed === folder.name) return;
          /* Draft-режим: не шлём PUT, а кладём в очередь. Legacy-backfill
             scope при первом rename теряется в новой схеме — он применится
             только при коммите через отдельный механизм, если нужно. Для
             MVP пропускаем scope-backfill: при Save бэкенд просто переименует. */
          draft.enqueueRename(folder.id, trimmed);
        },
      });
    },
    [draft],
  );

  /* ─── Delete folder ─── */
  /* Считаем всех потомков и их item_count рекурсивно — нужно для модалки
     подтверждения, чтобы показать юзеру: «Всего вложенных папок: N, в
     них объектов: M». На flat-списке folders это BFS по parent_id. */
  const collectDescendants = useCallback(
    (rootId: number): { folderIds: number[]; itemCount: number } => {
      const folderIds: number[] = [];
      let itemCount = 0;
      const frontier: number[] = [rootId];
      while (frontier.length > 0) {
        const current = frontier.shift() as number;
        const children = folders.filter(f => f.parent_id === current);
        for (const child of children) {
          folderIds.push(child.id);
          itemCount += child.item_count;
          frontier.push(child.id);
        }
      }
      return { folderIds, itemCount };
    },
    [folders],
  );

  /* Определяем уровень папки в иерархии (1=dept, 2=sub, 3=folder) по
     цепочке parent_id. Flat-поиск достаточно дёшев для ≤100 папок. */
  const levelOf = useCallback(
    (target: CatalogFolderNode): FolderLevel => {
      if (target.parent_id === null) return 1;
      const parent = folders.find(f => f.id === target.parent_id);
      if (!parent || parent.parent_id === null) return 2;
      return 3;
    },
    [folders],
  );

  /* Имя папки-обёртки, выведенное из текущего label колонки уровня. При
     переименовании колонки в UI обёртка автоматически получит новое имя
     (например, «Департаменты» → «Организации» даёт «Без организаций»). */
  const wrapperNameForLevel = useCallback(
    (level: FolderLevel): string => {
      const labelKey: ColumnLabelKey =
        level === 1 ? 'dept' : level === 2 ? 'sub' : 'folder';
      return deriveDefaultFolderName(labels[labelKey]);
    },
    [labels],
  );

  /* Имя обёртки для конкретной удаляемой папки. Показывается в модалке
     как место назначения items/подпапок. Для root-папок совпадает с
     текущим именем is_default-папки — бэкенд сам приведёт её к новому
     wrapper_name, если отличается. Для не-root — sibling-обёртка. */
  const resolveWrapperName = useCallback(
    (target: CatalogFolderNode): string => wrapperNameForLevel(levelOf(target)),
    [levelOf, wrapperNameForLevel],
  );

  const handleDeleteConfirmed = async (cascade: boolean) => {
    if (!deleteTarget) return;
    const wrapperName = resolveWrapperName(deleteTarget);
    /* Draft-режим: не шлём DELETE на сервер, только ставим в очередь.
       Реальный DELETE уйдёт при клике «Сохранить» в футере drawer'а.
       «Сбросить» отбросит операцию и папка вернётся в tree. */
    draft.enqueueDelete(deleteTarget.id, cascade, wrapperName);
    setDeleteTarget(null);
  };

  /* Дополнительные данные для модалки (пересчёт на каждый рендер дешёвый —
     folders обычно < 100 записей, BFS по ним — O(n)). */
  const deleteModalData = useMemo(() => {
    if (!deleteTarget) return null;
    const directSubfolders = folders.filter(
      f => f.parent_id === deleteTarget.id,
    ).length;
    const { folderIds, itemCount } = collectDescendants(deleteTarget.id);
    return {
      itemCount: deleteTarget.item_count,
      subfolderCount: directSubfolders,
      descendantFolderCount: folderIds.length,
      descendantItemCount: itemCount,
      parentFolderName: resolveWrapperName(deleteTarget),
    };
  }, [deleteTarget, folders, collectDescendants, resolveWrapperName]);

  /* Автосинхронизация имени is_default-папки с label колонки
     «Департаменты». При переименовании (Департаменты → Организации)
     дефолтная папка автоматически становится «Без организаций» —
     пользователь не видит stale имени «Без департаментов» в
     drop-destination'ах, в модалках удаления и в выдаче tree.
     Срабатывает на каждое изменение labels.dept и сравнивает с
     текущим именем is_default; лишние PUT не отправляются. */
  useEffect(() => {
    const defaultFolder = folders.find(f => f.is_default);
    if (!defaultFolder) return;
    const expected = deriveDefaultFolderName(labels.dept);
    if (defaultFolder.name === expected) return;
    let cancelled = false;
    updateCatalogFolder(defaultFolder.id, { name: expected })
      .then(() => {
        if (cancelled) return;
        void onChanged();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [labels.dept, folders, onChanged]);

  /* ─── DnD через react-dnd ───
     Native HTML5 DnD (hand-rolled) не работает надёжно, потому что
     DndProvider (HTML5Backend) на уровне RootContextProviders перехватывает
     native drag events на document'е. Любые ondragstart/ondragover/ondrop
     вне react-dnd конфликтуют с backend'ом и событиями теряются. Поэтому
     DnD реализован через useDrag/useDrop (см. CatalogDndRow.tsx) —
     правильный интеграционный путь. */

  /* ─── Mutation helpers ─── */

  /* folderLevelOf и refreshAllLevels удалены как мёртвый код:
     - folderLevelOf — был для drag-payload, payload теперь формируется
       без уровня (резолвится в drop-handler через folders[].parent_id).
     - refreshAllLevels — устарел после draft-режима; baseline-refresh
       триггерится родителем через onChanged/onCommitted после Save. */

  /* Draft-режим: перенос объекта не шлёт запрос, а ставит в очередь.
     При фактическом Save → unassign(old) + assign(new). Reset — отбрасывает. */
  const moveItem = useCallback(
    (payload: ItemDragPayload, destFolderId: number) => {
      if (payload.fromFolderId === destFolderId) return;
      draft.enqueueMoveItem(
        payload.fromFolderId,
        destFolderId,
        payload.objectType,
        payload.objectId,
      );
    },
    [draft],
  );

  /* Draft-режим: перемещение папки (parent_id, position). */
  const moveFolder = useCallback(
    (folderId: number, newParentId: number | null, newPosition?: number) => {
      draft.enqueueMoveFolder(folderId, newParentId, newPosition);
    },
    [draft],
  );

  /* Reorder: перестановка папки внутри того же родителя. В draft-режиме
     просто накидываем move_folder ops с пересчитанными position; на
     Save они уйдут пакетно на бэкенд. */
  const reorderSiblings = useCallback(
    (
      srcId: number,
      targetId: number,
      zone: DropZone,
      parentId: number | null,
    ) => {
      if (srcId === targetId) return;
      const siblings = folders
        .filter(f => f.parent_id === parentId)
        .sort((a, b) => a.position - b.position || a.id - b.id);
      const without = siblings.filter(f => f.id !== srcId);
      const targetIdx = without.findIndex(f => f.id === targetId);
      if (targetIdx === -1) return;
      const insertAt = zone === 'above' ? targetIdx : targetIdx + 1;
      const src = folders.find(f => f.id === srcId);
      if (!src) return;
      const newOrder = [
        ...without.slice(0, insertAt),
        src,
        ...without.slice(insertAt),
      ];
      newOrder.forEach((f, idx) => {
        const newPos = idx * 10;
        if (f.position !== newPos) {
          draft.enqueueMoveFolder(f.id, parentId, newPos);
        }
      });
    },
    [folders, draft],
  );

  /* Merge папки: все дети src-папки переносятся в target, затем src удаляется.
     Используется для dept→dept и sub→sub merge. Показывает confirm-модалку. */
  const mergeFolders = useCallback(
    (srcId: number, targetId: number) => {
      const src = folders.find(f => f.id === srcId);
      const target = folders.find(f => f.id === targetId);
      if (!src || !target || src.id === target.id) return;
      if (src.is_default) return;
      const children = folders.filter(f => f.parent_id === srcId);
      const itemCount = src.item_count ?? 0;
      setConfirmState({
        open: true,
        title: t('Объединить'),
        text: t(
          'Всё содержимое <strong>%s</strong> переедет в <strong>%s</strong>, ' +
            'после чего исходник будет удалён.',
          src.name,
          target.is_default
            ? deriveDefaultFolderName(labels.dept)
            : target.name,
        ),
        meta: [
          t('Подпапок: %s', String(children.length)),
          t('Объектов: %s', String(itemCount)),
        ],
        submitLabel: t('Объединить'),
        variant: 'primary',
        onConfirm: async () => {
          /* Merge в draft-режиме: все операции ставятся в очередь.
             1. Дети src перевешиваются на target (move_folder ops).
             2. Items src переносятся в target (move_item ops).
             3. Сама src помечается к удалению (cascade=false — на момент
                Save её дети уже у target'а). wrapper_name передаём на
                случай, если из-за порядка play'а на бэкенде сработает
                fallback: бэкенд просто положит items в wrapper того же
                уровня, которое мы и так выбрали как target. */
          for (const child of children) {
            draft.enqueueMoveFolder(child.id, targetId);
          }
          try {
            const items = await listCatalogItems(srcId);
            for (const it of items) {
              draft.enqueueMoveItem(
                srcId,
                targetId,
                it.object_type,
                it.object_id,
              );
            }
          } catch {
            // Если items не загрузились, всё равно отправляем остальные ops.
          }
          draft.enqueueDelete(srcId, false, resolveWrapperName(src));
          if (deptId === srcId) {
            setDeptId(targetId);
            setSubId(null);
            setFolderId(null);
          }
          if (subId === srcId) setSubId(null);
          if (folderId === srcId) setFolderId(null);
        },
      });
    },
    [
      folders,
      labels.dept,
      deptId,
      subId,
      folderId,
      setDeptId,
      setSubId,
      setFolderId,
      draft,
      resolveWrapperName,
    ],
  );

  /* ─── Унифицированный drop handler для react-dnd ───

     Семантика drop'а зависит от ТРЁХ факторов:
       1. Тип тащимого (dragKind): dept | sub | folder | item
       2. Тип цели (targetKind): dept | sub | folder
       3. Зона внутри row'а (zone): above | into | below

     Матрица решений:
      ┌─────────────────┬──────────┬───────────────────┬──────────────────┐
      │ drag → target   │ зона     │ same parent?      │ действие         │
      ├─────────────────┼──────────┼───────────────────┼──────────────────┤
      │ item → любая    │ любая    │ —                 │ assign в target  │
      │ dept → dept     │ into     │ — (оба root)      │ merge            │
      │ dept → dept     │ abv/bel  │ — (оба root)      │ reorder          │
      │ sub  → dept     │ любая    │ —                 │ move в этот dept │
      │ sub  → sub      │ into     │ same parent       │ merge            │
      │ sub  → sub      │ into     │ diff parent       │ move в target    │
      │ sub  → sub      │ abv/bel  │ same parent       │ reorder          │
      │ sub  → sub      │ abv/bel  │ diff parent       │ move в target's  │
      │                 │          │                   │ parent           │
      │ folder → sub    │ любая    │ —                 │ move в этот sub  │
      │ folder → dept   │ любая    │ —                 │ move в этот dept │
      │                 │          │                   │ (становится sub) │
      │ folder → folder │ into     │ same parent       │ merge            │
      │ folder → folder │ into     │ diff parent       │ move в target    │
      │ folder → folder │ abv/bel  │ same parent       │ reorder          │
      │ folder → folder │ abv/bel  │ diff parent       │ move в target's  │
      │                 │          │                   │ parent           │
      └─────────────────┴──────────┴───────────────────┴──────────────────┘ */
  type TargetKind = 'dept' | 'sub' | 'folder';

  const handleDropOnRow = useCallback(
    async (
      payload: DndPayload,
      zone: DropZone,
      target: CatalogFolderNode,
      targetKind: TargetKind,
    ) => {
      /* ITEM ─── простейший кейс: всегда ассайн в target. */
      if (payload.kind === 'item') {
        await moveItem(payload, target.id);
        return;
      }

      const src = folders.find(f => f.id === payload.folderId);
      if (!src || src.id === target.id) return;

      const srcKind = dragKindOf(payload);
      const sameLevel = srcKind === targetKind;

      /* ZONE === 'into' ─── кладём ВНУТРЬ target'а.
           same-level same-type → merge (слияние содержимого)
           иначе → move (src становится child'ом target'а) */
      if (zone === 'into') {
        if (sameLevel) {
          mergeFolders(src.id, target.id);
        } else {
          await moveFolder(src.id, target.id);
        }
        return;
      }

      /* ZONE === 'above' | 'below' ─── вставить src как СОСЕДА target'а
         на конкретную позицию. reorderSiblings умеет и same-parent
         reorder, и cross-parent insert — в обоих случаях src окажется
         в parent'е target'а, сразу перед или после target'а. */
      await reorderSiblings(src.id, target.id, zone, target.parent_id);
    },
    [folders, mergeFolders, moveFolder, moveItem, reorderSiblings],
  );

  /* Drop на пустое body колонки (без конкретной строки-цели).
     parentId — куда ассайнить: для sub-body это deptId, для fol-body
     это subId, для items-body это folderId. */
  const handleDropOnBody = useCallback(
    async (payload: DndPayload, parentId: number) => {
      if (payload.kind === 'item') {
        await moveItem(payload, parentId);
        return;
      }
      const src = folders.find(f => f.id === payload.folderId);
      if (!src || src.parent_id === parentId) return;
      await moveFolder(src.id, parentId);
    },
    [folders, moveFolder, moveItem],
  );

  /* ─── Матрица acceptance ─── Любой кросс-level drop разрешаем, чтобы
     юзер мог свободно перетаскивать между колонками. Backend поддерживает
     произвольную вложенность через parent_id, поэтому dept→dept (merge),
     sub→dept (перенос sub), folder→sub (перенос folder), folder→dept
     (folder становится sub'ом этого dept'а) — все осмысленны. Запрещён
     только drag «вверх по дереву» (нельзя сделать родителя ребёнком
     своего потомка — это делается в handleDropOnRow). */

  const acceptAnyFolderOrItem = useCallback(
    (p: DndPayload) => p.kind === 'item' || p.kind === 'folder',
    [],
  );

  /* canDropInto возвращает true для ВСЕХ accepted — тогда зона «into»
     (середина row'а) подсвечивается sky-фоном. handleDropOnRow сам
     решит, что это значит (merge/move/assign). */
  const canDropIntoAnything = useCallback((_p: DndPayload) => true, []);

  /* Body-acceptors одинаковые — разрешаем любой folder/item, решение
     о том что делать принимается в handleDropOnBody с учётом
     текущего parent'а (deptId/subId/folderId). */
  const acceptBodyAny = acceptAnyFolderOrItem;

  const selectedDept = depts.find(f => f.id === deptId);
  const selectedSub = subs.find(f => f.id === subId);

  return (
    <>
      <Grid>
        {/* Col 1: Департаменты */}
        <Col>
          <ColHead>
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('dept', labels.dept)}
              title={t('Переименовать колонку')}
            >
              {labels.dept}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{depts.length}</ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => addFolder(null, 'dept')}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <ColBody $dropActive={false}>
            {depts.length === 0 ? (
              <Empty>
                <IconFolder />
                <strong>{t('Нет %s', genitivePlural(labels.dept))}</strong>
                <span>{t('Создайте первый через «+»')}</span>
              </Empty>
            ) : (
              depts.map(d => (
                <DndRow
                  key={d.id}
                  dragPayload={
                    d.is_default ? undefined : folderDragPayload(d.id, 1, null)
                  }
                  canAccept={acceptAnyFolderOrItem}
                  canDropInto={canDropIntoAnything}
                  onDrop={(payload, zone) =>
                    handleDropOnRow(payload, zone, d, 'dept')
                  }
                >
                  {({ isDragging, isOver, dropZone, ref }) => (
                    <Row
                      ref={ref}
                      className={deptId === d.id ? 'is-selected' : ''}
                      $selected={deptId === d.id}
                      $dropZone={isOver ? dropZone : null}
                      $dragging={isDragging}
                      $pendingDelete={deletedFolderIds.has(d.id)}
                      $pendingCreate={d.id < 0}
                      onClick={() => {
                        setDeptId(d.id);
                        setSubId(null);
                        setFolderId(null);
                      }}
                    >
                      <Dot $color={d.color ?? '#999999'} />
                      {/* Мокап .mcr-body: flex:1 обёртка вокруг имени, чтобы
                      Slot прижался к правому краю. Без неё Name с fixed
                      width оставил бы space между названием и count'ом. */}
                      <RowBody>
                        <Name>
                          {d.is_default
                            ? deriveDefaultFolderName(labels.dept)
                            : d.name}
                        </Name>
                      </RowBody>
                      <Slot>
                        <Count className="cat-count">{d.item_count}</Count>
                        {d.is_default ? null : (
                          <Actions className="cat-actions">
                            <ActBtn
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                renameFolder(d);
                              }}
                              aria-label={t('Переименовать')}
                            >
                              <IconEdit />
                            </ActBtn>
                            <DelBtn
                              type="button"
                              className="mcr-act-del"
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteTarget(d);
                              }}
                              aria-label={t('Удалить')}
                            >
                              <IconTrash />
                            </DelBtn>
                          </Actions>
                        )}
                      </Slot>
                    </Row>
                  )}
                </DndRow>
              ))
            )}
          </ColBody>
        </Col>

        {/* Col 2: Подразделы. Показывает подразделы выбранного департамента
            + объекты, которые лежат напрямую в департаменте (не в sub/folder).
            Благодаря этому если у департамента нет подструктуры, его объекты
            появляются именно здесь — где им логически и положено быть как
            «дети» выбранного департамента. */}
        <Col>
          <ColHead>
            {/* Имя выбранного департамента УЖЕ видно в col 1 слева, поэтому
                в col 2 head показываем только название колонки («Подразделы»)
                + счётчик + add-кнопку. Так header-строка не переполняется
                и не вызывает горизонтальный overflow. */}
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('sub', labels.sub)}
              title={t('Переименовать колонку')}
            >
              {labels.sub}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{subs.length + scopedDeptItems.length}</ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => deptId !== null && addFolder(deptId, 'sub')}
              disabled={deptId === null}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <DndBody
            canAccept={acceptBodyAny}
            onDrop={payload =>
              deptId !== null && handleDropOnBody(payload, deptId)
            }
          >
            {({ isOver: subBodyOver, ref: subBodyRef }) => (
              <ColBody ref={subBodyRef} $dropActive={subBodyOver}>
                {deptId === null ? (
                  <Empty>
                    <IconFolder />
                    <strong>
                      {t('Выберите %s', singularAccusative(labels.dept))}
                    </strong>
                    <span>
                      {t('Слева, чтобы открыть %s', labels.sub.toLowerCase())}
                    </span>
                  </Empty>
                ) : subs.length === 0 && scopedDeptItems.length === 0 ? (
                  <Empty>
                    <IconFolderSub />
                    <strong>{t('Нет %s', genitivePlural(labels.sub))}</strong>
                    <span>{t('Создайте первый через «+»')}</span>
                  </Empty>
                ) : (
                  <>
                    {subs.map(s => (
                      <DndRow
                        key={`sub-${s.id}`}
                        dragPayload={
                          s.is_default
                            ? undefined
                            : folderDragPayload(s.id, 2, s.parent_id)
                        }
                        canAccept={acceptAnyFolderOrItem}
                        canDropInto={canDropIntoAnything}
                        onDrop={(payload, zone) =>
                          handleDropOnRow(payload, zone, s, 'sub')
                        }
                      >
                        {({ isDragging, isOver, dropZone, ref }) => (
                          <Row
                            ref={ref}
                            className={subId === s.id ? 'is-selected' : ''}
                            $selected={subId === s.id}
                            $dropZone={isOver ? dropZone : null}
                            $dragging={isDragging}
                            $pendingDelete={deletedFolderIds.has(s.id)}
                            $pendingCreate={s.id < 0}
                            onClick={() => {
                              setSubId(s.id);
                              setFolderId(null);
                            }}
                          >
                            <RowIcon
                              $color={
                                s.color ?? selectedDept?.color ?? DS2_VARS.cSky
                              }
                            >
                              <IconFolderSub />
                            </RowIcon>
                            <RowBody>
                              <Name>
                                {s.is_default
                                  ? deriveDefaultFolderName(labels.dept)
                                  : s.name}
                              </Name>
                              {(() => {
                                const childFolders = folders.filter(
                                  x => x.parent_id === s.id,
                                ).length;
                                const totalItems = s.item_count ?? 0;
                                const total = childFolders + totalItems;
                                if (total === 0) return null;
                                return <MetaLine>{`${total} эл.`}</MetaLine>;
                              })()}
                            </RowBody>
                            <Slot>
                              <Count className="cat-count">
                                {s.item_count}
                              </Count>
                              {s.is_default ? null : (
                                <Actions className="cat-actions">
                                  <ActBtn
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      renameFolder(s);
                                    }}
                                    aria-label={t('Переименовать')}
                                  >
                                    <IconEdit />
                                  </ActBtn>
                                  <DelBtn
                                    type="button"
                                    className="mcr-act-del"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setDeleteTarget(s);
                                    }}
                                    aria-label={t('Удалить')}
                                  >
                                    <IconTrash />
                                  </DelBtn>
                                </Actions>
                              )}
                            </Slot>
                          </Row>
                        )}
                      </DndRow>
                    ))}

                    {/* Объекты, ассайнутые напрямую в департамент (folder_id=deptId) —
                    показываются ИНЛАЙН вместе с подразделами, на своём уровне.
                    Это ключевое требование: объект живёт там, где его создали. */}
                    {deptItemsLoading
                      ? null
                      : scopedDeptItems.map(it => {
                          const info =
                            objectNames[
                              objectKey(it.object_type, it.object_id)
                            ];
                          const { color, Icon } = typeColorFor(it.object_type);
                          return (
                            <DndRow
                              key={`dept-item-${it.id}`}
                              dragPayload={itemDragPayload(it)}
                            >
                              {({ isDragging, ref }) => (
                                <Row
                                  ref={ref}
                                  $dragging={isDragging}
                                  title={info?.title ?? ''}
                                >
                                  <RowIcon $color={color} $tinted>
                                    <Icon />
                                  </RowIcon>
                                  <RowBody>
                                    <Name>
                                      {info?.title ??
                                        `${it.object_type} #${it.object_id}`}
                                    </Name>
                                    {info?.subtitle ? (
                                      <MetaLine>{info.subtitle}</MetaLine>
                                    ) : null}
                                  </RowBody>
                                </Row>
                              )}
                            </DndRow>
                          );
                        })}
                  </>
                )}
              </ColBody>
            )}
          </DndBody>
        </Col>

        {/* Col 3: Папки. Показывает папки выбранного подраздела + объекты,
            лежащие напрямую в подразделе — тот же принцип «вложенности»,
            что и в колонке 2. */}
        <Col>
          <ColHead>
            {/* Имя подраздела уже видно в col 2 слева — в col 3 head
                показываем только имя колонки. */}
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('folder', labels.folder)}
              title={t('Переименовать колонку')}
            >
              {labels.folder}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>
              {subfolders.length + scopedSubItems.length}
            </ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => subId !== null && addFolder(subId, 'folder')}
              disabled={subId === null}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <DndBody
            canAccept={acceptBodyAny}
            onDrop={payload =>
              subId !== null && handleDropOnBody(payload, subId)
            }
          >
            {({ isOver: folBodyOver, ref: folBodyRef }) => (
              <ColBody ref={folBodyRef} $dropActive={folBodyOver}>
                {subId === null ? (
                  <Empty>
                    <IconFolderSub />
                    <strong>
                      {t('Выберите %s', singularAccusative(labels.sub))}
                    </strong>
                    <span>
                      {t(
                        'Чтобы увидеть %s и объекты',
                        labels.folder.toLowerCase(),
                      )}
                    </span>
                  </Empty>
                ) : subfolders.length === 0 && scopedSubItems.length === 0 ? (
                  <Empty>
                    <IconFolderSub />
                    <strong>
                      {t('Нет %s', genitivePlural(labels.folder))}
                    </strong>
                    <span>{t('Создайте первую через «+»')}</span>
                  </Empty>
                ) : (
                  <>
                    {subfolders.map(f => (
                      <DndRow
                        key={`folder-${f.id}`}
                        dragPayload={
                          f.is_default
                            ? undefined
                            : folderDragPayload(f.id, 3, f.parent_id)
                        }
                        canAccept={acceptAnyFolderOrItem}
                        canDropInto={canDropIntoAnything}
                        onDrop={(payload, zone) =>
                          handleDropOnRow(payload, zone, f, 'folder')
                        }
                      >
                        {({ isDragging, isOver, dropZone, ref }) => (
                          <Row
                            ref={ref}
                            className={folderId === f.id ? 'is-selected' : ''}
                            $selected={folderId === f.id}
                            $dropZone={isOver ? dropZone : null}
                            $dragging={isDragging}
                            $pendingDelete={deletedFolderIds.has(f.id)}
                            $pendingCreate={f.id < 0}
                            onClick={() => setFolderId(f.id)}
                          >
                            <RowIcon
                              $color={
                                f.color ??
                                selectedSub?.color ??
                                DS2_VARS.cTangerine
                              }
                            >
                              <IconFolder />
                            </RowIcon>
                            <RowBody>
                              <Name>
                                {f.is_default
                                  ? deriveDefaultFolderName(labels.dept)
                                  : f.name}
                              </Name>
                              {(f.item_count ?? 0) > 0 ? (
                                <MetaLine>{`${f.item_count} эл.`}</MetaLine>
                              ) : null}
                            </RowBody>
                            <Slot>
                              <Count className="cat-count">
                                {f.item_count}
                              </Count>
                              {f.is_default ? null : (
                                <Actions className="cat-actions">
                                  <ActBtn
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      renameFolder(f);
                                    }}
                                    aria-label={t('Переименовать')}
                                  >
                                    <IconEdit />
                                  </ActBtn>
                                  <DelBtn
                                    type="button"
                                    className="mcr-act-del"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setDeleteTarget(f);
                                    }}
                                    aria-label={t('Удалить')}
                                  >
                                    <IconTrash />
                                  </DelBtn>
                                </Actions>
                              )}
                            </Slot>
                          </Row>
                        )}
                      </DndRow>
                    ))}

                    {/* Loose items подраздела (folder_id=subId) — inline с папками. */}
                    {subItemsLoading
                      ? null
                      : scopedSubItems.map(it => {
                          const info =
                            objectNames[
                              objectKey(it.object_type, it.object_id)
                            ];
                          const { color, Icon } = typeColorFor(it.object_type);
                          return (
                            <DndRow
                              key={`sub-item-${it.id}`}
                              dragPayload={itemDragPayload(it)}
                            >
                              {({ isDragging, ref }) => (
                                <Row
                                  ref={ref}
                                  $dragging={isDragging}
                                  title={info?.title ?? ''}
                                >
                                  <RowIcon $color={color} $tinted>
                                    <Icon />
                                  </RowIcon>
                                  <RowBody>
                                    <Name>
                                      {info?.title ??
                                        `${it.object_type} #${it.object_id}`}
                                    </Name>
                                    {info?.subtitle ? (
                                      <MetaLine>{info.subtitle}</MetaLine>
                                    ) : null}
                                  </RowBody>
                                </Row>
                              )}
                            </DndRow>
                          );
                        })}
                  </>
                )}
              </ColBody>
            )}
          </DndBody>
        </Col>

        {/* Col 4: Объекты — показывает объекты выбранной папки (уровень 3).
            Объекты уровней 1 (депт) и 2 (подраздел) не дублируются здесь,
            они уже inline в колонках 2 и 3 соответственно. Так каждый
            объект живёт ровно в одном месте — в колонке своего уровня. */}
        <Col>
          <ColHead>
            {/* Мокап col 4: статический лейбл «Все объекты {подраздела|папки}».
                Не кликабельный (название не редактируется — это view-агрегатор). */}
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('items', labels.items)}
              title={t('Переименовать колонку')}
            >
              {labels.items}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{scopedFolderItems.length}</ColHeadCount>
            {/* Мокап: в col 4 add-btn disabled с X-иконкой и tooltip
                «Макс 3 уровня» — визуальный индикатор, что дальше
                добавлять некуда. Функционально — no-op. */}
            <AddBtn
              type="button"
              disabled
              title={t('Максимум 3 уровня')}
              aria-label={t('Максимум 3 уровня')}
            >
              <svg
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M2 2l6 6M2 8l6-6" />
              </svg>
            </AddBtn>
          </ColHead>
          <DndBody
            canAccept={acceptBodyAny}
            onDrop={payload =>
              folderId !== null && handleDropOnBody(payload, folderId)
            }
          >
            {({ isOver: itemsBodyOver, ref: itemsBodyRef }) => (
              <ColBody ref={itemsBodyRef} $dropActive={itemsBodyOver}>
                {folderId === null ? (
                  <Empty>
                    <IconBox />
                    <strong>
                      {t('Выберите %s', singularAccusative(labels.folder))}
                    </strong>
                    <span>{t('Чтобы увидеть объекты')}</span>
                  </Empty>
                ) : folderItemsLoading ? (
                  <Empty>
                    <IconBox />
                    <span>{t('Загрузка…')}</span>
                  </Empty>
                ) : scopedFolderItems.length === 0 ? (
                  <Empty>
                    <IconBox />
                    <strong>
                      {scope === 'dashboard'
                        ? t('Нет дашбордов')
                        : t('Нет чартов')}
                    </strong>
                    <span>{t('Перетащите сюда объекты')}</span>
                  </Empty>
                ) : (
                  scopedFolderItems.map(it => {
                    const info =
                      objectNames[objectKey(it.object_type, it.object_id)];
                    const { color, Icon } = typeColorFor(it.object_type);
                    return (
                      <DndRow
                        key={`folder-item-${it.id}`}
                        dragPayload={itemDragPayload(it)}
                      >
                        {({ isDragging, ref }) => (
                          <Row
                            ref={ref}
                            $dragging={isDragging}
                            title={info?.title ?? ''}
                          >
                            <RowIcon $color={color} $tinted>
                              <Icon />
                            </RowIcon>
                            <RowBody>
                              <Name>
                                {info?.title ??
                                  `${it.object_type} #${it.object_id}`}
                              </Name>
                              {info?.subtitle ? (
                                <MetaLine>{info.subtitle}</MetaLine>
                              ) : null}
                            </RowBody>
                          </Row>
                        )}
                      </DndRow>
                    );
                  })
                )}
              </ColBody>
            )}
          </DndBody>
        </Col>
      </Grid>

      <CatalogDeleteModal
        open={deleteTarget !== null}
        folderName={deleteTarget?.name ?? ''}
        itemCount={deleteModalData?.itemCount ?? 0}
        subfolderCount={deleteModalData?.subfolderCount ?? 0}
        descendantFolderCount={deleteModalData?.descendantFolderCount ?? 0}
        descendantItemCount={deleteModalData?.descendantItemCount ?? 0}
        parentFolderName={deleteModalData?.parentFolderName}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />

      <CatalogConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        text={confirmState.text}
        meta={confirmState.meta}
        checkLabel={confirmState.checkLabel}
        submitLabel={confirmState.submitLabel}
        variant={confirmState.variant}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
      />

      <CatalogPromptModal
        open={promptState.open}
        title={promptState.title}
        subtitle={promptState.subtitle}
        placeholder={promptState.placeholder}
        defaultValue={promptState.defaultValue}
        submitLabel={promptState.submitLabel}
        onClose={closePrompt}
        onSubmit={promptState.onSubmit}
      />
    </>
  );
};
