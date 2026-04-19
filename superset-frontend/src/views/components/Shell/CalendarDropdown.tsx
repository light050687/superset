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
 * Календарь — dropdown справа от rail-кнопки «Календарь».
 * Показывает месяц с подсвеченным «сегодня», события сегодня внизу.
 * События пока из пропсов (локальные); в будущем — из API (Airflow/Alerts).
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

export interface CalendarEvent {
  /** ISO-дата начала события (или просто YYYY-MM-DD). */
  date: string;
  /** Время как humanized «10:00». */
  time?: string;
  title: string;
  /** Цвет DS 2.0: --c-tangerine / --c-sky / --up / --dn / --wn. */
  colorVar?: string;
}

interface CalendarDropdownProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  events?: CalendarEvent[];
}

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
] as const;

const WEEKDAYS_RU_LABEL = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

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
] as const;

const WEEKDAYS_RU_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;

/* Pixel-perfect parity .dropdown.cal: blur 24 sat 160, radius 18, тень 30px 80px. */
const Dropdown = styled.div`
  background: ${DS2_VARS.dropdownBg};
  backdrop-filter: ${DS2_VARS.dropdownFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dropdownFilter};
  border: 1px solid ${DS2_VARS.dropdownBorder};
  border-radius: ${DS2_VARS.dropdownRadius};
  padding: 0;
  min-width: 300px;
  max-width: 340px;
  box-shadow: ${DS2_VARS.dropdownShadow};
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
  /* Над floating dock (101) и scrim (99), но под AI overlay (100). */
  z-index: 110;
  overflow: hidden;
`;

const Head = styled.div`
  padding: ${DS2_SPACE.s3}px ${DS2_SPACE.s3}px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${DS2_SPACE.s2}px;
`;

const Month = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${DS2_VARS.ink};
`;

const TodayLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  margin-top: 2px;
`;

const NavBtn = styled.button`
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${DS2_VARS.g400};
    color: ${DS2_VARS.ink};
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

const Grid = styled.div`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
`;

const GridInner = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
  font-size: 10px;
`;

const DayHeader = styled.div`
  color: ${DS2_VARS.g500};
  padding: 4px 0;
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
`;

const DayCell = styled.div<{ $today?: boolean; $hasEvent?: boolean; $muted?: boolean }>`
  padding: 6px 0;
  border-radius: 4px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontMono};
  font-variant-numeric: tabular-nums;
  background: ${({ $today }) => ($today ? DS2_VARS.cSky : 'transparent')};
  color: ${({ $today, $hasEvent, $muted }) => {
    if ($today) return DS2_VARS.s;
    if ($muted) return DS2_VARS.g300;
    if ($hasEvent) return DS2_VARS.ink;
    return DS2_VARS.g500;
  }};
  font-weight: ${({ $today }) => ($today ? 700 : 400)};
  position: relative;

  &:hover {
    background: ${({ $today }) =>
      $today ? DS2_VARS.cSky : DS2_VARS.g100};
  }
`;

const EventDot = styled.span`
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${DS2_VARS.cTangerine};
  margin: 1px auto 0;
`;

const Section = styled.div`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s1}px;
  border-top: 1px solid ${DS2_VARS.g100};
`;

const SectionLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
`;

const EventRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  border-radius: ${DS2_RADIUS.control}px;
  font-size: 11px;
  color: ${DS2_VARS.g700};
  cursor: pointer;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }
`;

const EventColorDot = styled.span<{ $color: string }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const EmptyRow = styled.div`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
  font-size: 11px;
  color: ${DS2_VARS.g500};
`;

const IconLeft: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M10 3l-5 5 5 5" />
  </svg>
);

const IconRight: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M6 3l5 5-5 5" />
  </svg>
);

interface Position {
  top: number;
  left: number;
}

/**
 * Позиционируем dropdown НАД anchor-кнопкой в floating dock.
 * Раньше dropdown был справа от вертикального rail; сейчас — выше горизонтального
 * дока, центрированный по X anchor-кнопке, со smart-клампом по viewport.
 */
function computePosition(
  anchor: HTMLElement,
  menuWidth: number,
  menuHeight: number,
): Position {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const gap = 12;
  const anchorCenterX = rect.left + rect.width / 2;
  const rawLeft = anchorCenterX - menuWidth / 2;
  const left = Math.max(8, Math.min(rawLeft, viewportW - menuWidth - 8));
  // Поднимаем меню над якорем; если не влезает сверху — фолбэк под якорь.
  const above = rect.top - menuHeight - gap;
  const top = above >= 8 ? above : rect.bottom + gap;
  return { top, left };
}

/** Преобразует JS getDay() (0=Вс) в индекс колонки (0=Пн, 6=Вс). */
function mondayFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const startIdx = mondayFirstIndex(firstDay.getDay());

  const cells: {
    day: number;
    inCurrentMonth: boolean;
    date: Date;
  }[] = [];

  // Предыдущий месяц (до первого числа текущего)
  for (let i = startIdx - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    cells.push({
      day,
      inCurrentMonth: false,
      date: new Date(year, month - 1, day),
    });
  }

  // Текущий месяц
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      day: d,
      inCurrentMonth: true,
      date: new Date(year, month, d),
    });
  }

  // Следующий месяц — дополняем до 6 недель × 7 дней = 42 ячейки
  let next = 1;
  while (cells.length < 42) {
    cells.push({
      day: next,
      inCurrentMonth: false,
      date: new Date(year, month + 1, next),
    });
    next += 1;
  }

  return cells;
}

function sameYMD(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const CalendarDropdown: FC<CalendarDropdownProps> = ({
  anchor,
  open,
  onClose,
  events = [],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ top: 12, left: 64 });
  const [cursor, setCursor] = useState<Date>(() => new Date());

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

  const today = useMemo(() => new Date(), []);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(e.date.slice(0, 10)));
    return set;
  }, [events]);

  const todayEvents = useMemo(() => {
    const todayKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.date.slice(0, 10) === todayKey);
  }, [events, today]);

  const todayLabel = `${WEEKDAYS_RU_SHORT[today.getDay()]}, ${today.getDate()} ${
    MONTHS_RU_GEN[today.getMonth()]
  }`;

  if (!open) return null;

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return createPortal(
    <Dropdown
      ref={ref}
      role="dialog"
      aria-label={t('Календарь')}
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
    >
      <Head>
        <div>
          <Month>
            {MONTHS_RU[month]} {year}
          </Month>
          <TodayLabel>{todayLabel}</TodayLabel>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavBtn
            type="button"
            onClick={goPrev}
            aria-label={t('Предыдущий месяц')}
          >
            <IconLeft />
          </NavBtn>
          <NavBtn type="button" onClick={goNext} aria-label={t('Следующий месяц')}>
            <IconRight />
          </NavBtn>
        </div>
      </Head>
      <Grid>
        <GridInner>
          {WEEKDAYS_RU_LABEL.map(w => (
            <DayHeader key={w}>{w}</DayHeader>
          ))}
          {cells.map((cell, idx) => {
            const isToday = cell.inCurrentMonth && sameYMD(cell.date, today);
            const dateKey = `${cell.date.getFullYear()}-${String(
              cell.date.getMonth() + 1,
            ).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
            const hasEvent = cell.inCurrentMonth && eventDates.has(dateKey);
            return (
              <DayCell
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                $today={isToday}
                $hasEvent={hasEvent}
                $muted={!cell.inCurrentMonth}
                aria-label={`${cell.day} ${MONTHS_RU_GEN[cell.date.getMonth()]}`}
                aria-selected={isToday ? true : undefined}
              >
                {cell.day}
                {hasEvent && !isToday ? <EventDot /> : null}
              </DayCell>
            );
          })}
        </GridInner>
      </Grid>
      <Section>
        <SectionLabel>{t('Сегодня')}</SectionLabel>
        {todayEvents.length === 0 ? (
          <EmptyRow>{t('Событий сегодня нет')}</EmptyRow>
        ) : (
          todayEvents.map((e, i) => (
            <EventRow
              // eslint-disable-next-line react/no-array-index-key
              key={`${e.title}-${i}`}
              role="button"
              tabIndex={0}
            >
              <EventColorDot $color={e.colorVar ?? DS2_VARS.cSky} />
              <span>
                {e.time ? `${e.time} · ` : ''}
                {e.title}
              </span>
            </EventRow>
          ))
        )}
      </Section>
    </Dropdown>,
    document.body,
  );
};
