/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * AdvancedFrame — UI для since/until границ "расширенного" фильтра.
 * Раньше — два text-input'а, в которые юзер вручную писал выражения
 * вроде `DATEADD(DATETIME("now"), -7, day)`. Сейчас — UI-controls
 * для 6 режимов: Конкретная дата, Сейчас/Сегодня, Относительно,
 * Начало периода, Последний день, Праздник. Для каждого режима
 * генерируется соответствующее expression-выражение.
 *
 * Парсинг существующего value: regex-detection функции в начале
 * строки → выставление mode + sub-state. Если парсится неоднозначно
 * — fallback на «Конкретная дата».
 */
import { SEPARATOR, t } from '@superset-ui/core';
import {
  Col,
  DatePicker,
  Icons,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
} from '@superset-ui/core/components';
import { type Dayjs } from 'dayjs';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import {
  DAYJS_FORMAT,
  dttmToDayjs,
} from 'src/explore/components/controls/DateFilterControl/utils';
import DateFunctionTooltip from './DateFunctionTooltip';

/* ===== Types & options ===== */

type Anchor = 'now' | 'today';
type Unit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';
type Mode =
  | 'specific' // DATETIME via DatePicker
  | 'anchor' // DATETIME("now") | DATETIME("today")
  | 'relative' // DATEADD(DATETIME(anchor), n, unit)
  | 'startof' // DATETRUNC(DATETIME(anchor), unit)
  | 'lastof' // LASTDAY(DATETIME(anchor), unit)
  | 'holiday'; // HOLIDAY(name [, DATETIME(...) [, country]])

interface SideState {
  mode: Mode;
  /** ISO datetime for 'specific' mode */
  iso?: string;
  /** 'now'|'today' anchor for anchor/relative/startof/lastof */
  anchor?: Anchor;
  /** integer offset for 'relative' */
  n?: number;
  /** unit for relative/startof/lastof */
  unit?: Unit;
  /** holiday name */
  holidayName?: string;
  /** optional country code (e.g. 'RU') */
  holidayCountry?: string;
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'specific', label: t('Конкретная дата') },
  { value: 'anchor', label: t('Сейчас / Сегодня') },
  { value: 'relative', label: t('Относительно') },
  { value: 'startof', label: t('Начало периода') },
  { value: 'lastof', label: t('Последний день') },
  { value: 'holiday', label: t('Праздник') },
];

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'second', label: t('Секунда') },
  { value: 'minute', label: t('Минута') },
  { value: 'hour', label: t('Час') },
  { value: 'day', label: t('День') },
  { value: 'week', label: t('Неделя') },
  { value: 'month', label: t('Месяц') },
  { value: 'quarter', label: t('Квартал') },
  { value: 'year', label: t('Год') },
];

/* Для DATETRUNC/LASTDAY допустимы только грубые единицы. */
const TRUNC_UNITS: Unit[] = ['year', 'quarter', 'month', 'week'];
const LASTOF_UNITS: Unit[] = ['year', 'month', 'week'];

const ANCHOR_OPTIONS: { value: Anchor; label: string }[] = [
  { value: 'now', label: t('Сейчас') },
  { value: 'today', label: t('Сегодня') },
];

/* ===== Parsing & encoding ===== */

/** "DATETIME("now")" → 'now'. "DATETIME("today")" → 'today'. Else undefined. */
function parseAnchor(s: string): Anchor | undefined {
  const m = s.match(/^datetime\(\s*["']?(now|today)["']?\s*\)$/i);
  if (m) return m[1].toLowerCase() as Anchor;
  return undefined;
}

function parseAdvancedValue(s: string | undefined): SideState {
  const fallback: SideState = {
    mode: 'specific',
    iso: '',
    anchor: 'today',
    n: 7,
    unit: 'day',
    holidayName: '',
  };
  if (!s) return fallback;
  const trimmed = s.trim();
  if (!trimmed) return fallback;

  /* anchor */
  const a = parseAnchor(trimmed);
  if (a) return { ...fallback, mode: 'anchor', anchor: a };

  /* relative: DATEADD(DATETIME(anchor|iso), N, unit) */
  const relMatch = trimmed.match(
    /^dateadd\(\s*(.+?)\s*,\s*(-?\d+)\s*,\s*(\w+)\s*\)$/i,
  );
  if (relMatch) {
    const inner = relMatch[1];
    const n = parseInt(relMatch[2], 10);
    const unit = relMatch[3].toLowerCase() as Unit;
    const anchor = parseAnchor(inner) ?? 'today';
    return {
      ...fallback,
      mode: 'relative',
      anchor,
      n: Math.abs(n) * (n < 0 ? -1 : 1),
      unit,
    };
  }

  /* startof / lastof */
  const truncMatch = trimmed.match(/^datetrunc\(\s*(.+?)\s*,\s*(\w+)\s*\)$/i);
  if (truncMatch) {
    const anchor = parseAnchor(truncMatch[1]) ?? 'today';
    return {
      ...fallback,
      mode: 'startof',
      anchor,
      unit: truncMatch[2].toLowerCase() as Unit,
    };
  }
  const lastMatch = trimmed.match(/^lastday\(\s*(.+?)\s*,\s*(\w+)\s*\)$/i);
  if (lastMatch) {
    const anchor = parseAnchor(lastMatch[1]) ?? 'today';
    return {
      ...fallback,
      mode: 'lastof',
      anchor,
      unit: lastMatch[2].toLowerCase() as Unit,
    };
  }

  /* holiday: HOLIDAY("name" [, DATETIME(...), "country"]) */
  const holMatch = trimmed.match(
    /^holiday\(\s*["']([^"']+)["']\s*(?:,[^)]+)?\)$/i,
  );
  if (holMatch) {
    return { ...fallback, mode: 'holiday', holidayName: holMatch[1] };
  }

  /* ISO date — specific */
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return { ...fallback, mode: 'specific', iso: trimmed };
  }

  return fallback;
}

function encodeAdvancedValue(state: SideState): string {
  const anchorExpr = `DATETIME("${state.anchor ?? 'today'}")`;
  switch (state.mode) {
    case 'specific':
      return state.iso ?? '';
    case 'anchor':
      return `DATETIME("${state.anchor ?? 'now'}")`;
    case 'relative': {
      const n = typeof state.n === 'number' ? state.n : 0;
      const unit = state.unit ?? 'day';
      return `DATEADD(${anchorExpr}, ${n}, ${unit})`;
    }
    case 'startof':
      return `DATETRUNC(${anchorExpr}, ${state.unit ?? 'week'})`;
    case 'lastof':
      return `LASTDAY(${anchorExpr}, ${state.unit ?? 'month'})`;
    case 'holiday': {
      const name = state.holidayName?.trim() ?? '';
      return `HOLIDAY("${name}")`;
    }
    default:
      return '';
  }
}

/* ===== Side editor component ===== */

interface SideEditorProps {
  value: string;
  onChange: (next: string) => void;
}

function SideEditor({ value, onChange }: SideEditorProps) {
  const state = parseAdvancedValue(value);

  const update = (patch: Partial<SideState>) => {
    const next = { ...state, ...patch };
    onChange(encodeAdvancedValue(next));
  };

  return (
    <div>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col span={24}>
          <Select
            ariaLabel={t('Режим')}
            value={state.mode}
            options={MODE_OPTIONS}
            onChange={(m: Mode) => update({ mode: m })}
            getPopupContainer={() => document.body}
          />
        </Col>
      </Row>

      {state.mode === 'specific' && (
        <DatePicker
          showTime
          value={state.iso ? dttmToDayjs(state.iso) : undefined}
          onChange={(dt: Dayjs | null) =>
            update({ iso: dt ? dt.format(DAYJS_FORMAT) : '' })
          }
          style={{ width: '100%' }}
          getPopupContainer={() => document.body}
          placeholder={t('Выберите дату')}
        />
      )}

      {state.mode === 'anchor' && (
        <Radio.GroupWrapper
          value={state.anchor}
          options={ANCHOR_OPTIONS}
          onChange={(e: any) => update({ anchor: e.target.value })}
        />
      )}

      {state.mode === 'relative' && (
        <Row gutter={8}>
          <Col span={10}>
            <Radio.GroupWrapper
              value={state.anchor}
              options={ANCHOR_OPTIONS}
              onChange={(e: any) => update({ anchor: e.target.value })}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              value={state.n ?? 0}
              onChange={(v: number | string | null) =>
                update({ n: typeof v === 'number' ? v : 0 })
              }
              style={{ width: '100%' }}
              placeholder={t('Сдвиг')}
            />
          </Col>
          <Col span={8}>
            <Select
              ariaLabel={t('Единица')}
              value={state.unit ?? 'day'}
              options={UNIT_OPTIONS}
              onChange={(u: Unit) => update({ unit: u })}
              getPopupContainer={() => document.body}
            />
          </Col>
        </Row>
      )}

      {state.mode === 'startof' && (
        <Row gutter={8}>
          <Col span={12}>
            <Radio.GroupWrapper
              value={state.anchor}
              options={ANCHOR_OPTIONS}
              onChange={(e: any) => update({ anchor: e.target.value })}
            />
          </Col>
          <Col span={12}>
            <Select
              ariaLabel={t('Единица')}
              value={
                TRUNC_UNITS.includes(state.unit as Unit) ? state.unit : 'week'
              }
              options={UNIT_OPTIONS.filter(u => TRUNC_UNITS.includes(u.value))}
              onChange={(u: Unit) => update({ unit: u })}
              getPopupContainer={() => document.body}
            />
          </Col>
        </Row>
      )}

      {state.mode === 'lastof' && (
        <Row gutter={8}>
          <Col span={12}>
            <Radio.GroupWrapper
              value={state.anchor}
              options={ANCHOR_OPTIONS}
              onChange={(e: any) => update({ anchor: e.target.value })}
            />
          </Col>
          <Col span={12}>
            <Select
              ariaLabel={t('Единица')}
              value={
                LASTOF_UNITS.includes(state.unit as Unit) ? state.unit : 'month'
              }
              options={UNIT_OPTIONS.filter(u => LASTOF_UNITS.includes(u.value))}
              onChange={(u: Unit) => update({ unit: u })}
              getPopupContainer={() => document.body}
            />
          </Col>
        </Row>
      )}

      {state.mode === 'holiday' && (
        <Row gutter={8}>
          <Col span={24}>
            <Input
              value={state.holidayName ?? ''}
              onChange={e => update({ holidayName: e.target.value })}
              placeholder={t('Название (напр. "new year")')}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}

/* ===== Top-level AdvancedFrame ===== */

function getAdvancedRange(value: string): string {
  if (value.includes(SEPARATOR)) return value;
  if (value.startsWith('Last')) return [value, ''].join(SEPARATOR);
  if (value.startsWith('Next')) return ['', value].join(SEPARATOR);
  return SEPARATOR;
}

export function AdvancedFrame(props: FrameComponentProps) {
  const advancedRange = getAdvancedRange(props.value || '');
  const [since, until] = advancedRange.split(SEPARATOR);
  if (advancedRange !== props.value) {
    props.onChange(getAdvancedRange(props.value || ''));
  }

  const onSinceChange = (next: string) =>
    props.onChange(`${next}${SEPARATOR}${until}`);
  const onUntilChange = (next: string) =>
    props.onChange(`${since}${SEPARATOR}${next}`);

  return (
    <>
      <div className="section-title">
        {t('Расширенный временной диапазон ')}
        <DateFunctionTooltip placement="rightBottom">
          <Icons.InfoCircleOutlined />
        </DateFunctionTooltip>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <div className="control-label">{t('Начало (включительно)')}</div>
          <SideEditor value={since} onChange={onSinceChange} />
        </Col>
        <Col span={12}>
          <div className="control-label">{t('Конец (исключительно)')}</div>
          <SideEditor value={until} onChange={onUntilChange} />
        </Col>
      </Row>
    </>
  );
}
