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
 * Календарь — full-size dialog по мокапу. Layout:
 *   ┌──────────────────────────────────────┬──────────────┐
 *   │ Header: Месяц YYYY · нав / tabs MWD  │ День · сводка│
 *   ├──────────────────────────────────────┤              │
 *   │ Грид 7×6 со событиями-чипами в днях  │ Список       │
 *   │                                      │ событий      │
 *   │                                      │ Фокус-слот   │
 *   ├──────────────────────────────────────┴──────────────┤
 *   │ Footer: quick-add + legend                          │
 *   └─────────────────────────────────────────────────────┘
 *
 * Без mock данных — events приходят из пропа (или []).
 * View: month/week/day переключаются вкладками.
 */
import { styled, t } from '@superset-ui/core';
import {
  type DragEvent as ReactDragEvent,
  type FC,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { DS2_VARS } from 'src/theme/ds2';
import {
  parseQuickAdd,
  useCalendarEvents,
  type CalendarEvent,
  type StoredCalendarEvent,
} from './useCalendarEvents';

/* ─── Public types ─── */

// Re-export для обратной совместимости с потребителями (Shell.tsx etc.)
// Real definition в useCalendarEvents.ts (избегаем circular dep).
export type { CalendarEvent } from './useCalendarEvents';

interface CalendarDropdownProps {
  /** Не используется в новой реализации — оставлен для совместимости. */
  anchor?: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Seed-события (применяются один раз при первой загрузке если в
   *  localStorage пользователя ничего нет). */
  events?: CalendarEvent[];
  /** ID текущего пользователя — для изоляции события в localStorage. */
  userId?: string | number;
}

type ViewMode = 'month' | 'week' | 'day';

/* ─── Constants ─── */

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTHS_RU_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/* Цвет для категории события. */
const CATEGORY_COLOR: Record<NonNullable<CalendarEvent['category']>, string> = {
  meeting: '#3B8BD9', // sky
  deadline: '#E87C3E', // tangerine
  report: '#16A34A', // up green
  personal: '#8B5CF6', // violet
};

/* ─── Layout ─── */

const Scrim = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.2s ${DS2_VARS.ease};
  z-index: 96;
`;

const Dialog = styled.aside<{ $open: boolean }>`
  position: fixed;
  bottom: ${DS2_VARS.drawerBottom};
  left: 50%;
  transform: translateX(-50%)
    translateY(${({ $open }) => ($open ? '0' : '20px')});
  /* Pixel-perfect parity мокап .dropdown.cal: 1000x603 (96vw x 90vh fallback). */
  width: min(96vw, 1000px);
  height: ${({ $open }) => ($open ? 'min(603px, 90vh)' : '0')};
  max-height: ${({ $open }) => ($open ? 'min(603px, 90vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  background: ${DS2_VARS.drawerBg};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 97;
  font-family: ${DS2_VARS.fontSans};
  transition:
    height 0.28s ${DS2_VARS.ease},
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};
`;

/* ─── Header ─── */

/* cal-head (мокап): 65px высота, sky-gradient bg, padding 14/16/12. */
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid ${DS2_VARS.g100};
  background: linear-gradient(135deg, rgba(59, 139, 217, 0.08), transparent);
`;

const HeaderLeft = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex-shrink: 1;
  min-width: 0;
`;

/* DS v2.0 fluid: --fs-subtitle (16-20) для заголовка месяца. */
const HeaderTitle = styled.button`
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-subtitle);
  font-weight: 700;
  color: ${DS2_VARS.ink};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 2px 6px;
  margin: -2px -6px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  width: fit-content;
  transition: background 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
  }

  svg {
    color: ${DS2_VARS.g500};
  }
`;

/* ─── cal-mo-pop: dropdown месяцев + год navigation ─── */

const MoPop = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 240px;
  padding: 10px;
  background: ${DS2_VARS.dropdownBg};
  backdrop-filter: ${DS2_VARS.dropdownFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dropdownFilter};
  border: 1px solid ${DS2_VARS.dropdownBorder};
  border-radius: ${DS2_VARS.dropdownRadius};
  box-shadow: ${DS2_VARS.dropdownShadow};
  z-index: 5;
  font-family: ${DS2_VARS.fontSans};
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const MoPopHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 8px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  margin-bottom: 6px;
`;

/* Год-label в шапке MoPop — кликабельный, переключает в year-grid mode. */
const MoPopYearBtn = styled.button`
  background: transparent;
  border: none;
  padding: 2px 6px;
  border-radius: 5px;
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-meta);
  font-weight: 600;
  color: ${DS2_VARS.ink};
  cursor: pointer;
  transition: background 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
    color: ${DS2_VARS.cSky};
  }
`;

const MoPopNav = styled.button`
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.ink};
    border-color: ${DS2_VARS.g300};
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;

const MoPopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
`;

const MoPopCell = styled.button<{ $active?: boolean; $current?: boolean }>`
  height: 28px;
  padding: 0 4px;
  border-radius: 6px;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.12)' : 'transparent'};
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.cSky : 'transparent')};
  color: ${({ $active, $current }) =>
    $active || $current ? DS2_VARS.cSky : DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-micro);
  font-weight: ${({ $active, $current }) => ($active || $current ? 600 : 500)};
  cursor: pointer;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
  }
`;

const HeaderSub = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const Tabs = styled.div`
  display: inline-flex;
  background: ${DS2_VARS.bg3};
  padding: 2px;
  border-radius: 7px;
  gap: 2px;
  flex-shrink: 0;
`;

const Tab = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) =>
    $active ? DS2_VARS.glassBgElev : 'transparent'};
  border: none;
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-micro);
  font-weight: 500;
  color: ${({ $active }) => ($active ? DS2_VARS.ink : DS2_VARS.g500)};
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.g200 : 'transparent')};
  transition: all 0.12s ${DS2_VARS.ease};
  white-space: nowrap;

  &:hover {
    color: ${DS2_VARS.ink};
  }
`;

const NavBtn = styled.button`
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${DS2_VARS.g500};
  padding: 0;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.ink};
    border-color: ${DS2_VARS.g300};
  }
`;

/* cal-today-btn (мокап): sky-border + sky-dim bg, dot внутри. */
const TodayDot = styled.button`
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  padding: 0;
  border-radius: 50%;
  background: rgba(59, 139, 217, 0.12);
  border: 1px solid rgba(59, 139, 217, 0.45);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${DS2_VARS.cSky};
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    background: rgba(59, 139, 217, 0.2);
    border-color: ${DS2_VARS.cSky};
  }

  &::after {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${DS2_VARS.cSky};
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }
`;

/* ─── Body 2-col grid ─── */

/* Pixel-perfect parity мокап `.cal-body`: 582px (грид) / 416px (день).
   На узких экранах падаем в `1.4fr 1fr` чтобы сохранить пропорции. */
const Body = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 582fr) minmax(0, 416fr);
  grid-template-rows: 1fr;
  gap: 0;
  min-height: 0;
  overflow: hidden;
`;

const CalCol = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid ${DS2_VARS.g100};
`;

const DayCol = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

/* ─── Calendar grid ─── */

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 12px 16px 8px;
  flex-shrink: 0;
`;

const WeekDay = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  padding: 4px;
`;

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, minmax(62px, 1fr));
  padding: 0 16px 12px;
  gap: 2px;
  min-height: 0;
`;

/* cal-day: min-height 62 (мокап). Today → sky border, selected → sky bg+border.
   Weekend → g500 цвет числа. Out-of-month → g400 + opacity 0.45. */
const Cell = styled.button<{
  $isCurrentMonth?: boolean;
  $isToday?: boolean;
  $isSelected?: boolean;
  $isWeekend?: boolean;
  $isDragOver?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: 62px;
  background: ${({ $isSelected, $isDragOver }) =>
    $isDragOver
      ? 'rgba(220, 38, 38, 0.10)'
      : $isSelected
        ? 'rgba(59, 139, 217, 0.10)'
        : 'transparent'};
  border: 1px solid
    ${({ $isSelected, $isToday, $isDragOver }) =>
      $isDragOver
        ? DS2_VARS.dn
        : $isSelected
          ? DS2_VARS.cSky
          : $isToday
            ? DS2_VARS.cSky
            : 'transparent'};
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  text-align: left;
  font-family: ${DS2_VARS.fontSans};
  color: ${({ $isCurrentMonth, $isWeekend }) =>
    !$isCurrentMonth
      ? DS2_VARS.g400
      : $isWeekend
        ? DS2_VARS.g500
        : DS2_VARS.ink};
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.45)};
  overflow: hidden;
  transition:
    background 0.1s ${DS2_VARS.ease},
    border-color 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? 'rgba(59, 139, 217, 0.14)' : DS2_VARS.bg3};
  }
`;

const DayNumber = styled.span<{
  $isToday?: boolean;
  $isCurrentMonth?: boolean;
}>`
  font-size: var(--fs-meta);
  font-weight: ${({ $isToday }) => ($isToday ? 700 : 500)};
  color: ${({ $isToday, $isCurrentMonth }) =>
    $isToday && $isCurrentMonth ? DS2_VARS.cSky : 'inherit'};
  margin-bottom: 2px;
  flex-shrink: 0;
`;

const EventChips = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
`;

const EventChip = styled.div<{ $color: string }>`
  font-size: var(--fs-micro);
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.ink};
  background: ${({ $color }) =>
    `color-mix(in oklab, ${$color} 18%, transparent)`};
  border-left: 2px solid ${({ $color }) => $color};
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ─── Day details column ─── */

const DayHead = styled.div`
  padding: 16px 18px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid ${DS2_VARS.g100};
`;

const DayHeadTitle = styled.div`
  font-size: var(--fs-body);
  font-weight: 700;
  color: ${DS2_VARS.ink};
`;

const DayHeadSub = styled.div`
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  margin-top: 2px;
`;

const Timeline = styled.div`
  height: 4px;
  background: ${DS2_VARS.g100};
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  margin: 12px 0 4px;
`;

const TimelineSeg = styled.span<{ $color: string; $w: number }>`
  background: ${({ $color }) => $color};
  width: ${({ $w }) => $w}%;
`;

const DayBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const EventRow = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
  }
`;

const EventTime = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const EventBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const EventTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-meta);
  font-weight: 500;
  color: ${DS2_VARS.ink};
`;

const EventDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const EventMeta = styled.div`
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const OnlineBadge = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-nano);
  font-weight: 700;
  color: ${DS2_VARS.g500};
  background: ${DS2_VARS.bg3};
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Empty = styled.div`
  padding: 32px 12px;
  text-align: center;
  color: ${DS2_VARS.g500};
  font-size: var(--fs-meta);
  font-family: ${DS2_VARS.fontSans};
`;

/* Фокус-слот (мокап): компактный grid icon | (title + meta), не stretch. */
const FocusSlot = styled.div`
  margin: 4px 0 12px;
  padding: 10px 12px;
  border: 1px solid rgba(22, 163, 74, 0.35);
  background: rgba(22, 163, 74, 0.08);
  border-radius: 8px;
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: 8px;
`;

const FocusSlotIcon = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.18);
  color: ${DS2_VARS.up};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FocusSlotBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const FocusSlotTitle = styled.div`
  font-size: var(--fs-meta);
  font-weight: 600;
  color: ${DS2_VARS.up};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FocusSlotMeta = styled.div`
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
`;

/* ─── Footer ─── */

const Footer = styled.div`
  padding: 10px 16px 12px;
  border-top: 1px solid ${DS2_VARS.g100};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* QuickAdd (мокап): + icon слева внутри input, return-icon справа.
   Submit на Enter — отдельной кнопки нет. */
const QuickAddRow = styled.form`
  position: relative;
  display: flex;
  align-items: center;
`;

const QuickAddInput = styled.input`
  flex: 1;
  height: 34px;
  padding: 0 36px 0 32px;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 8px;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  outline: none;

  &::placeholder {
    color: ${DS2_VARS.g500};
  }

  &:focus {
    border-color: ${DS2_VARS.cSky};
  }
`;

const QuickAddPlusIcon = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${DS2_VARS.g500};
  pointer-events: none;
  display: inline-flex;
`;

const QuickAddReturnHint = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 22px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 5px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.cSky};
    border-color: ${DS2_VARS.cSky};
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  font-size: var(--fs-meta);
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

/* ─── Week / Day view ─── */

/* Week — sticky header (7 дней) + grid 7 cols × 24 часа.
   Day — single column timeline (24 часа). Высота ячейки часа 36px →
   суммарно 864px скролла. */

const HOUR_HEIGHT = 36;
const HOURS_DAY_START = 8; // показываем с 8:00 (compact view)
const HOURS_DAY_END = 22; // до 22:00
const VISIBLE_HOURS = HOURS_DAY_END - HOURS_DAY_START;

const WeekRoot = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const WeekStickyHead = styled.div`
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
  border-bottom: 1px solid ${DS2_VARS.g100};
  background: ${DS2_VARS.drawerBg};
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: ${DS2_VARS.dropdownFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dropdownFilter};
`;

const WeekDayHeadCell = styled.button<{
  $isToday?: boolean;
  $isSelected?: boolean;
}>`
  background: transparent;
  border: none;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  color: ${({ $isSelected, $isToday }) =>
    $isSelected || $isToday ? DS2_VARS.cSky : DS2_VARS.ink};

  &:hover {
    background: ${DS2_VARS.bg3};
  }
`;

const WeekDayHeadDow = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${DS2_VARS.g500};
`;

const WeekDayHeadNum = styled.span<{ $isToday?: boolean }>`
  font-size: var(--fs-interactive);
  font-weight: ${({ $isToday }) => ($isToday ? 700 : 500)};
`;

const WeekScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 3px;
  }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
  position: relative;
`;

const HourLabelsCol = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${DS2_VARS.g100};
`;

const HourLabel = styled.div`
  height: ${HOUR_HEIGHT}px;
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
  padding: 2px 6px 0;
  text-align: right;
`;

const DayColumn = styled.div<{ $isDragOver?: boolean }>`
  position: relative;
  border-right: 1px solid ${DS2_VARS.g100};
  background: ${({ $isDragOver }) =>
    $isDragOver ? 'rgba(220, 38, 38, 0.08)' : 'transparent'};

  &:last-child {
    border-right: none;
  }
`;

const HourSlot = styled.div`
  height: ${HOUR_HEIGHT}px;
  border-bottom: 1px dashed ${DS2_VARS.g100};
`;

/* Event-блок внутри дня week/day view. Положение и высота — по времени. */
const TimeEventBlock = styled.div<{
  $color: string;
  $top: number;
  $height: number;
}>`
  position: absolute;
  left: 4px;
  right: 4px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => $height}px;
  min-height: 18px;
  background: ${({ $color }) =>
    `color-mix(in oklab, ${$color} 18%, transparent)`};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 4px;
  padding: 3px 6px;
  font-size: var(--fs-micro);
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
  cursor: grab;
  overflow: hidden;
  transition: opacity 0.12s ${DS2_VARS.ease};

  &:active {
    cursor: grabbing;
  }

  &[draggable='true']:active {
    opacity: 0.5;
  }
`;

const TimeEventTitle = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimeEventMeta = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-micro);
  color: ${DS2_VARS.g500};
`;

/* EventRow — обёртка с hover-state. DeleteBtnFloat появляется на hover
   через CSS attribute-селектор (data-delete-btn), без babel-плагина. */
const EventRowHoverHost = styled.div`
  position: relative;

  &:hover [data-delete-btn] {
    opacity: 1;
  }
`;

/* Удалить кнопка для EventRow в day-details column. */
const DeleteBtnFloat = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: ${DS2_VARS.g400};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.dnBg};
    color: ${DS2_VARS.dn};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

/* ─── Icons ─── */

const IconChevron: FC<
  React.PropsWithChildren<{ dir: 'left' | 'right' | 'down'; size?: number }>
> = ({ dir, size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    style={{ flexShrink: 0 }}
  >
    {dir === 'left' && <path d="M7.5 2L3.5 6l4 4" />}
    {dir === 'right' && <path d="M4.5 2L8.5 6l-4 4" />}
    {dir === 'down' && <path d="M3 5l3 3 3-3" />}
  </svg>
);

const IconClose: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    style={{ flexShrink: 0 }}
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

const IconClock: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    style={{ flexShrink: 0 }}
  >
    <circle cx="6" cy="6" r="4.5" />
    <path d="M6 4v2.5l1.5 1" />
  </svg>
);

const IconTrash: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    style={{ flexShrink: 0 }}
  >
    <path d="M2.5 4h9M5.5 2h3M3.5 4l.6 8a1 1 0 0 0 1 1h3.8a1 1 0 0 0 1-1l.6-8M6 6.5v4M8 6.5v4" />
  </svg>
);

const IconPlusInput: FC<React.PropsWithChildren<unknown>> = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M7 2.5v9M2.5 7h9" />
  </svg>
);

/* ─── Helpers ─── */

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 6-week grid for month view starting Monday. */
function buildMonthGrid(viewDate: Date): Date[] {
  const first = startOfMonth(viewDate);
  // День недели первого числа (1 = Mon, 7 = Sun)
  const dow = first.getDay() || 7;
  const start = new Date(first);
  start.setDate(first.getDate() - (dow - 1));
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    );
  }
  return cells;
}

function durationMinutes(t1?: string, t2?: string): number {
  if (!t1 || !t2) return 0;
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
}

function formatDuration(mins: number): string {
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}ч ${m}м`;
  if (h) return `${h}ч`;
  return `${m}м`;
}

/** Неделя из 7 дат (Пн → Вс) для week view. */
function buildWeekDates(viewDate: Date): Date[] {
  const d = new Date(viewDate);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
  }
  return days;
}

/** Time → Y-смещение в week/day view (px). */
function timeToTop(time?: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  const offsetH = Math.max(0, h - HOURS_DAY_START);
  return offsetH * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

/** Высота блока события в week/day view (px). */
function timeToHeight(time?: string, endTime?: string): number {
  const dur = durationMinutes(time, endTime);
  if (dur <= 0) return 24; // по умолчанию 24px (≈40 минут визуально)
  return Math.max(18, (dur / 60) * HOUR_HEIGHT);
}

/* ─── Component ─── */

export const CalendarDropdown: FC<
  React.PropsWithChildren<CalendarDropdownProps>
> = ({ open, onClose, events: seedEvents, userId }) => {
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [moPopOpen, setMoPopOpen] = useState(false);
  const [moPopMode, setMoPopMode] = useState<'months' | 'years'>('months');
  const [moPopYear, setMoPopYear] = useState<number>(() =>
    new Date().getFullYear(),
  );
  // Старт диапазона в year-grid (12 лет). Пересчитывается каждый раз
  // при переключении в years mode.
  const [moPopYearBase, setMoPopYearBase] = useState<number>(
    () => Math.floor(new Date().getFullYear() / 12) * 12,
  );
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // CRUD-хранилище событий (localStorage scoped по userId).
  const { events, addEvent, removeEvent, moveEvent } = useCalendarEvents(
    userId,
    seedEvents,
  );

  // Esc: year-grid → months → закрыть picker → закрыть диалог.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (moPopOpen) {
        if (moPopMode === 'years') {
          setMoPopMode('months');
        } else {
          setMoPopOpen(false);
        }
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, moPopOpen, moPopMode]);

  // Click-outside закрывает month-picker и сбрасывает mode.
  useEffect(() => {
    if (!moPopOpen) return undefined;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-cal-mo-pop]')) return;
      if (target.closest('[data-cal-mo-trigger]')) return;
      setMoPopOpen(false);
      setMoPopMode('months');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moPopOpen]);

  const monthCells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const weekDates = useMemo(() => buildWeekDates(viewDate), [viewDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, StoredCalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const selectedKey = dateKey(selectedDate);
  const dayEvents = eventsByDate.get(selectedKey) ?? [];

  const totalMinutes = useMemo(
    () =>
      dayEvents.reduce(
        (acc, ev) => acc + durationMinutes(ev.time, ev.endTime),
        0,
      ),
    [dayEvents],
  );

  const today = new Date();

  /** Смещает viewDate И selectedDate на указанное число дней (для week/day). */
  const shiftDays = useCallback((delta: number) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + delta);
      return d;
    });
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + delta);
      return d;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (view === 'month') {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      return;
    }
    shiftDays(view === 'week' ? -7 : -1);
  }, [view, shiftDays]);

  const goNext = useCallback(() => {
    if (view === 'month') {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      return;
    }
    shiftDays(view === 'week' ? 7 : 1);
  }, [view, shiftDays]);

  const goToday = useCallback(() => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  }, []);

  const handleQuickAdd = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const parsed = parseQuickAdd(quickAddText, selectedDate);
      if (!parsed) {
        setQuickAddError(
          t('Не удалось распознать. Пример: «Завтра 15:00 созвон»'),
        );
        return;
      }
      const created = addEvent(parsed);
      setQuickAddText('');
      setQuickAddError(null);
      // Перепрыгнем на день созданного события (UX feedback).
      const [y, mo, d] = created.date.split('-').map(Number);
      const target = new Date(y, mo - 1, d);
      setSelectedDate(target);
      setViewDate(target);
    },
    [quickAddText, selectedDate, addEvent],
  );

  const handleDragStart = useCallback(
    (eventId: string) => (e: ReactDragEvent<HTMLElement>) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', eventId);
      setDraggedEventId(eventId);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedEventId(null);
    setDragOverKey(null);
  }, []);

  const handleDropOnDate = useCallback(
    (targetKey: string) => (e: ReactDragEvent<HTMLElement>) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain') || draggedEventId;
      if (id) moveEvent(id, targetKey);
      setDragOverKey(null);
      setDraggedEventId(null);
    },
    [moveEvent, draggedEventId],
  );

  const headerSubText = `${WEEKDAYS_RU[(selectedDate.getDay() || 7) - 1]}, ${selectedDate.getDate()} ${MONTHS_RU_GEN[selectedDate.getMonth()]}${
    view === 'week' ? ` · неделя ${Math.ceil(selectedDate.getDate() / 7)}` : ''
  }`;

  const dialog = (
    <>
      <Scrim $open={open} onClick={onClose} />
      <Dialog
        $open={open}
        role="dialog"
        aria-modal="true"
        aria-label={t('Календарь')}
      >
        <Header>
          <HeaderLeft>
            <HeaderTitle
              type="button"
              data-cal-mo-trigger="true"
              onClick={() => {
                const y = viewDate.getFullYear();
                setMoPopYear(y);
                setMoPopYearBase(Math.floor(y / 12) * 12);
                setMoPopMode('months');
                setMoPopOpen(prev => !prev);
              }}
              aria-haspopup="dialog"
              aria-expanded={moPopOpen}
            >
              {MONTHS_RU[viewDate.getMonth()]} {viewDate.getFullYear()}
              <IconChevron dir="down" />
            </HeaderTitle>
            <HeaderSub>{headerSubText}</HeaderSub>
            <MoPop
              $open={moPopOpen}
              data-cal-mo-pop="true"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label={
                moPopMode === 'months' ? t('Выбор месяца') : t('Выбор года')
              }
            >
              <MoPopHead>
                <MoPopNav
                  type="button"
                  onClick={() => {
                    if (moPopMode === 'months') {
                      setMoPopYear(prev => prev - 1);
                    } else {
                      setMoPopYearBase(prev => prev - 12);
                    }
                  }}
                  aria-label={
                    moPopMode === 'months'
                      ? t('Предыдущий год')
                      : t('Предыдущие 12 лет')
                  }
                >
                  <IconChevron dir="left" />
                </MoPopNav>
                {moPopMode === 'months' ? (
                  <MoPopYearBtn
                    type="button"
                    onClick={() => {
                      setMoPopYearBase(Math.floor(moPopYear / 12) * 12);
                      setMoPopMode('years');
                    }}
                    aria-label={t('Выбрать год')}
                  >
                    {moPopYear}
                  </MoPopYearBtn>
                ) : (
                  <MoPopYearBtn
                    type="button"
                    onClick={() => setMoPopMode('months')}
                    aria-label={t('К выбору месяца')}
                  >
                    {moPopYearBase}–{moPopYearBase + 11}
                  </MoPopYearBtn>
                )}
                <MoPopNav
                  type="button"
                  onClick={() => {
                    if (moPopMode === 'months') {
                      setMoPopYear(prev => prev + 1);
                    } else {
                      setMoPopYearBase(prev => prev + 12);
                    }
                  }}
                  aria-label={
                    moPopMode === 'months'
                      ? t('Следующий год')
                      : t('Следующие 12 лет')
                  }
                >
                  <IconChevron dir="right" />
                </MoPopNav>
              </MoPopHead>
              {moPopMode === 'months' ? (
                <MoPopGrid>
                  {MONTHS_RU.map((m, idx) => {
                    const isActive =
                      moPopYear === viewDate.getFullYear() &&
                      idx === viewDate.getMonth();
                    const isCurrent =
                      moPopYear === today.getFullYear() &&
                      idx === today.getMonth();
                    return (
                      <MoPopCell
                        key={m}
                        type="button"
                        $active={isActive}
                        $current={isCurrent && !isActive}
                        onClick={() => {
                          setViewDate(new Date(moPopYear, idx, 1));
                          setMoPopOpen(false);
                        }}
                      >
                        {m.slice(0, 3)}
                      </MoPopCell>
                    );
                  })}
                </MoPopGrid>
              ) : (
                <MoPopGrid>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = moPopYearBase + i;
                    const isActive = y === viewDate.getFullYear();
                    const isCurrent = y === today.getFullYear() && !isActive;
                    return (
                      <MoPopCell
                        key={y}
                        type="button"
                        $active={isActive}
                        $current={isCurrent}
                        onClick={() => {
                          setMoPopYear(y);
                          setMoPopMode('months');
                        }}
                      >
                        {y}
                      </MoPopCell>
                    );
                  })}
                </MoPopGrid>
              )}
            </MoPop>
          </HeaderLeft>
          <HeaderRight>
            <Tabs role="tablist" aria-label={t('Режим календаря')}>
              <Tab
                type="button"
                $active={view === 'month'}
                onClick={() => setView('month')}
              >
                {t('Месяц')}
              </Tab>
              <Tab
                type="button"
                $active={view === 'week'}
                onClick={() => setView('week')}
              >
                {t('Неделя')}
              </Tab>
              <Tab
                type="button"
                $active={view === 'day'}
                onClick={() => setView('day')}
              >
                {t('День')}
              </Tab>
            </Tabs>
            <NavBtn
              type="button"
              onClick={goPrev}
              aria-label={t('Предыдущий период')}
            >
              <IconChevron dir="left" />
            </NavBtn>
            <TodayDot
              type="button"
              onClick={goToday}
              aria-label={t('К сегодняшнему дню')}
              title={t('Сегодня')}
            />
            <NavBtn
              type="button"
              onClick={goNext}
              aria-label={t('Следующий период')}
            >
              <IconChevron dir="right" />
            </NavBtn>
            <CloseBtn
              type="button"
              onClick={onClose}
              aria-label={t('Закрыть')}
              title={t('Esc')}
            >
              <IconClose />
            </CloseBtn>
          </HeaderRight>
        </Header>

        <Body>
          <CalCol>
            {view === 'month' ? (
              <>
                <WeekHeader>
                  {WEEKDAYS_RU.map(d => (
                    <WeekDay key={d}>{d}</WeekDay>
                  ))}
                </WeekHeader>
                <Grid>
                  {monthCells.map(d => {
                    const key = dateKey(d);
                    const evs = eventsByDate.get(key) ?? [];
                    const dow = d.getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                    return (
                      <Cell
                        key={key}
                        type="button"
                        $isCurrentMonth={isCurrentMonth}
                        $isToday={isSameDay(d, today)}
                        $isSelected={isSameDay(d, selectedDate)}
                        $isWeekend={isWeekend}
                        $isDragOver={dragOverKey === key}
                        onClick={() => setSelectedDate(d)}
                        onDragOver={e => {
                          e.preventDefault();
                          setDragOverKey(key);
                        }}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={handleDropOnDate(key)}
                      >
                        <DayNumber
                          $isToday={isSameDay(d, today)}
                          $isCurrentMonth={isCurrentMonth}
                        >
                          {d.getDate()}
                        </DayNumber>
                        {evs.length > 0 ? (
                          <EventChips>
                            {evs.slice(0, 3).map(ev => (
                              <EventChip
                                key={ev.id}
                                $color={
                                  CATEGORY_COLOR[ev.category ?? 'meeting'] ??
                                  DS2_VARS.cSky
                                }
                                draggable
                                onDragStart={handleDragStart(ev.id)}
                                onDragEnd={handleDragEnd}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDate(d);
                                }}
                              >
                                {ev.time ? `${ev.time} ` : ''}
                                {ev.title}
                              </EventChip>
                            ))}
                            {evs.length > 3 ? (
                              <EventChip $color={DS2_VARS.g400}>
                                +{evs.length - 3}
                              </EventChip>
                            ) : null}
                          </EventChips>
                        ) : null}
                      </Cell>
                    );
                  })}
                </Grid>
              </>
            ) : view === 'week' ? (
              <WeekRoot>
                <WeekStickyHead>
                  <span />
                  {weekDates.map(d => (
                    <WeekDayHeadCell
                      key={dateKey(d)}
                      type="button"
                      $isToday={isSameDay(d, today)}
                      $isSelected={isSameDay(d, selectedDate)}
                      onClick={() => setSelectedDate(d)}
                    >
                      <WeekDayHeadDow>
                        {WEEKDAYS_RU[(d.getDay() || 7) - 1]}
                      </WeekDayHeadDow>
                      <WeekDayHeadNum $isToday={isSameDay(d, today)}>
                        {d.getDate()}
                      </WeekDayHeadNum>
                    </WeekDayHeadCell>
                  ))}
                </WeekStickyHead>
                <WeekScroll>
                  <WeekGrid>
                    <HourLabelsCol>
                      {Array.from({ length: VISIBLE_HOURS }).map((_, i) => (
                        <HourLabel key={i}>
                          {String(HOURS_DAY_START + i).padStart(2, '0')}:00
                        </HourLabel>
                      ))}
                    </HourLabelsCol>
                    {weekDates.map(d => {
                      const key = dateKey(d);
                      const evs = eventsByDate.get(key) ?? [];
                      return (
                        <DayColumn
                          key={key}
                          $isDragOver={dragOverKey === key}
                          onDragOver={e => {
                            e.preventDefault();
                            setDragOverKey(key);
                          }}
                          onDragLeave={() => setDragOverKey(null)}
                          onDrop={handleDropOnDate(key)}
                          onClick={() => setSelectedDate(d)}
                        >
                          {Array.from({ length: VISIBLE_HOURS }).map((_, i) => (
                            <HourSlot key={i} />
                          ))}
                          {evs.map(ev => {
                            const color =
                              CATEGORY_COLOR[ev.category ?? 'meeting'] ??
                              DS2_VARS.cSky;
                            return (
                              <TimeEventBlock
                                key={ev.id}
                                $color={color}
                                $top={timeToTop(ev.time)}
                                $height={timeToHeight(ev.time, ev.endTime)}
                                draggable
                                onDragStart={handleDragStart(ev.id)}
                                onDragEnd={handleDragEnd}
                                title={ev.title}
                              >
                                <TimeEventTitle>{ev.title}</TimeEventTitle>
                                {ev.time ? (
                                  <TimeEventMeta>
                                    {ev.time}
                                    {ev.endTime ? `–${ev.endTime}` : ''}
                                  </TimeEventMeta>
                                ) : null}
                              </TimeEventBlock>
                            );
                          })}
                        </DayColumn>
                      );
                    })}
                  </WeekGrid>
                </WeekScroll>
              </WeekRoot>
            ) : (
              <WeekRoot>
                <WeekScroll>
                  <WeekGrid style={{ gridTemplateColumns: '48px 1fr' }}>
                    <HourLabelsCol>
                      {Array.from({ length: VISIBLE_HOURS }).map((_, i) => (
                        <HourLabel key={i}>
                          {String(HOURS_DAY_START + i).padStart(2, '0')}:00
                        </HourLabel>
                      ))}
                    </HourLabelsCol>
                    <DayColumn
                      $isDragOver={dragOverKey === selectedKey}
                      onDragOver={e => {
                        e.preventDefault();
                        setDragOverKey(selectedKey);
                      }}
                      onDragLeave={() => setDragOverKey(null)}
                      onDrop={handleDropOnDate(selectedKey)}
                    >
                      {Array.from({ length: VISIBLE_HOURS }).map((_, i) => (
                        <HourSlot key={i} />
                      ))}
                      {dayEvents.map(ev => {
                        const color =
                          CATEGORY_COLOR[ev.category ?? 'meeting'] ??
                          DS2_VARS.cSky;
                        return (
                          <TimeEventBlock
                            key={ev.id}
                            $color={color}
                            $top={timeToTop(ev.time)}
                            $height={timeToHeight(ev.time, ev.endTime)}
                            draggable
                            onDragStart={handleDragStart(ev.id)}
                            onDragEnd={handleDragEnd}
                            title={ev.title}
                          >
                            <TimeEventTitle>{ev.title}</TimeEventTitle>
                            {ev.time ? (
                              <TimeEventMeta>
                                {ev.time}
                                {ev.endTime ? `–${ev.endTime}` : ''}
                              </TimeEventMeta>
                            ) : null}
                          </TimeEventBlock>
                        );
                      })}
                    </DayColumn>
                  </WeekGrid>
                </WeekScroll>
              </WeekRoot>
            )}
          </CalCol>

          <DayCol>
            <DayHead>
              <DayHeadTitle>
                {selectedDate.getDate()}{' '}
                {MONTHS_RU_GEN[selectedDate.getMonth()]},{' '}
                {WEEKDAYS_RU[(selectedDate.getDay() || 7) - 1].toLowerCase()}
              </DayHeadTitle>
              <DayHeadSub>
                {dayEvents.length === 0
                  ? t('Событий нет')
                  : t(
                      '%s события · %s встреч',
                      String(dayEvents.length),
                      formatDuration(totalMinutes),
                    )}
              </DayHeadSub>
              {dayEvents.length > 0 && totalMinutes > 0 ? (
                <Timeline>
                  {dayEvents.map(ev => {
                    const dur = durationMinutes(ev.time, ev.endTime);
                    const w = totalMinutes ? (dur / totalMinutes) * 100 : 0;
                    return (
                      <TimelineSeg
                        key={ev.id}
                        $color={
                          CATEGORY_COLOR[ev.category ?? 'meeting'] ??
                          DS2_VARS.cSky
                        }
                        $w={w}
                      />
                    );
                  })}
                </Timeline>
              ) : null}
            </DayHead>

            <DayBody>
              {dayEvents.length === 0 ? (
                <Empty>{t('Событий на этот день нет')}</Empty>
              ) : (
                dayEvents.map(ev => (
                  <EventRowHoverHost key={ev.id}>
                    <EventRow
                      draggable
                      onDragStart={handleDragStart(ev.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <EventTime>
                        <span>{ev.time ?? '—'}</span>
                        {ev.endTime ? <span>{ev.endTime}</span> : null}
                      </EventTime>
                      <EventBody>
                        <EventTitle>
                          <EventDot
                            $color={
                              CATEGORY_COLOR[ev.category ?? 'meeting'] ??
                              DS2_VARS.cSky
                            }
                          />
                          {ev.title}
                        </EventTitle>
                        <EventMeta>
                          {ev.online ? <OnlineBadge>online</OnlineBadge> : null}
                          {ev.attendees ? (
                            <span>
                              {ev.attendees} {t('чел.')}
                            </span>
                          ) : null}
                        </EventMeta>
                      </EventBody>
                    </EventRow>
                    <DeleteBtnFloat
                      type="button"
                      data-delete-btn="true"
                      onClick={() => removeEvent(ev.id)}
                      aria-label={t('Удалить событие')}
                      title={t('Удалить')}
                    >
                      <IconTrash />
                    </DeleteBtnFloat>
                  </EventRowHoverHost>
                ))
              )}
            </DayBody>

            {/* Focus-slot (мокап): показываем когда нет событий ИЛИ есть
                окно >2ч между ними. Сейчас — упрощённо при пустом дне. */}
            {dayEvents.length === 0 ? (
              <div style={{ padding: '0 18px 14px' }}>
                <FocusSlot>
                  <FocusSlotIcon>
                    <IconClock />
                  </FocusSlotIcon>
                  <FocusSlotBody>
                    <FocusSlotTitle>{t('Фокус-слот')}</FocusSlotTitle>
                    <FocusSlotMeta>{t('Весь день свободен')}</FocusSlotMeta>
                  </FocusSlotBody>
                </FocusSlot>
              </div>
            ) : null}
          </DayCol>
        </Body>

        <Footer>
          <QuickAddRow onSubmit={handleQuickAdd}>
            <QuickAddPlusIcon aria-hidden>
              <IconPlusInput />
            </QuickAddPlusIcon>
            <QuickAddInput
              type="text"
              placeholder={t('Завтра 15:00 созвон с командой')}
              value={quickAddText}
              onChange={e => {
                setQuickAddText(e.target.value);
                if (quickAddError) setQuickAddError(null);
              }}
              aria-invalid={Boolean(quickAddError)}
              aria-describedby={
                quickAddError ? 'cal-quickadd-error' : undefined
              }
            />
            <QuickAddReturnHint
              type="submit"
              aria-label={t('Добавить событие (Enter)')}
              title={t('Enter')}
            >
              ↵
            </QuickAddReturnHint>
          </QuickAddRow>
          {quickAddError ? (
            <div
              id="cal-quickadd-error"
              role="alert"
              style={{
                fontSize: 10.5,
                color: DS2_VARS.dn,
                fontFamily: DS2_VARS.fontMono,
              }}
            >
              {quickAddError}
            </div>
          ) : null}
          <Legend>
            <LegendItem>
              <LegendDot $color={CATEGORY_COLOR.meeting} />
              {t('Встречи')}
            </LegendItem>
            <LegendItem>
              <LegendDot $color={CATEGORY_COLOR.deadline} />
              {t('Дедлайны')}
            </LegendItem>
            <LegendItem>
              <LegendDot $color={CATEGORY_COLOR.report} />
              {t('Отчёты')}
            </LegendItem>
            <LegendItem>
              <LegendDot $color={CATEGORY_COLOR.personal} />
              {t('Личное')}
            </LegendItem>
          </Legend>
        </Footer>
      </Dialog>
    </>
  );

  return createPortal(dialog, document.body);
};
