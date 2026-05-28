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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { t } from '@superset-ui/core';
import {
  SelectOptionType,
  PreviousCalendarWeek,
  PreviousCalendarMonth,
  PreviousCalendarQuarter,
  PreviousCalendarYear,
  CommonRangeType,
  CalendarRangeType,
  CurrentRangeType,
  CurrentWeek,
  CurrentMonth,
  CurrentYear,
  CurrentQuarter,
  CurrentDay,
} from 'src/explore/components/controls/DateFilterControl/types';
import { CheckboxOptionType } from '@superset-ui/core/components/Radio';
import { extendedDayjs } from '@superset-ui/core/utils/dates';

/* Метки frame-опций и radio'в — RU. Значения (value) остаются исходными
   английскими, потому что они уходят в Superset backend и сериализуются
   в `time_range` параметр запроса. Меняем ТОЛЬКО `label`. */
export const FRAME_OPTIONS: SelectOptionType[] = [
  { value: 'Common', label: t('Последние') },
  { value: 'Calendar', label: t('Прошлый календарный') },
  { value: 'Current', label: t('Текущий') },
  { value: 'Custom', label: t('Произвольный') },
  { value: 'Advanced', label: t('Расширенный') },
  { value: 'No filter', label: t('Без фильтрации') },
];

export const COMMON_RANGE_OPTIONS: CheckboxOptionType[] = [
  { value: 'Last day', label: t('Последний день') },
  { value: 'Last week', label: t('Последняя неделя') },
  { value: 'Last month', label: t('Последний месяц') },
  { value: 'Last quarter', label: t('Последний квартал') },
  { value: 'Last year', label: t('Последний год') },
];
export const COMMON_RANGE_VALUES_SET = new Set(
  COMMON_RANGE_OPTIONS.map(value => value.value),
);

export const CALENDAR_RANGE_OPTIONS: CheckboxOptionType[] = [
  { value: PreviousCalendarWeek, label: t('Прошлая календарная неделя') },
  { value: PreviousCalendarMonth, label: t('Прошлый календарный месяц') },
  { value: PreviousCalendarQuarter, label: t('Прошлый календарный квартал') },
  { value: PreviousCalendarYear, label: t('Прошлый календарный год') },
];
export const CALENDAR_RANGE_VALUES_SET = new Set(
  CALENDAR_RANGE_OPTIONS.map(value => value.value),
);

export const CURRENT_RANGE_OPTIONS: CheckboxOptionType[] = [
  { value: CurrentDay, label: t('Текущий день') },
  { value: CurrentWeek, label: t('Текущая неделя') },
  { value: CurrentMonth, label: t('Текущий месяц') },
  { value: CurrentQuarter, label: t('Текущий квартал') },
  { value: CurrentYear, label: t('Текущий год') },
];
export const CURRENT_RANGE_VALUES_SET = new Set(
  CURRENT_RANGE_OPTIONS.map(value => value.value),
);

/* GRAIN-опции для Advanced/Custom фреймов: переведено в RU. %s — слово
   «До»/«После» подставится первым в строку. */
const GRAIN_OPTIONS = [
  { value: 'second', label: (rel: string) => t('%s секунд', rel) },
  { value: 'minute', label: (rel: string) => t('%s минут', rel) },
  { value: 'hour', label: (rel: string) => t('%s часов', rel) },
  { value: 'day', label: (rel: string) => t('%s дней', rel) },
  { value: 'week', label: (rel: string) => t('%s недель', rel) },
  { value: 'month', label: (rel: string) => t('%s месяцев', rel) },
  { value: 'quarter', label: (rel: string) => t('%s кварталов', rel) },
  { value: 'year', label: (rel: string) => t('%s лет', rel) },
];

export const SINCE_GRAIN_OPTIONS: SelectOptionType[] = GRAIN_OPTIONS.map(
  item => ({
    value: item.value,
    label: item.label(t('До')),
  }),
);

export const UNTIL_GRAIN_OPTIONS: SelectOptionType[] = GRAIN_OPTIONS.map(
  item => ({
    value: item.value,
    label: item.label(t('После')),
  }),
);

export const SINCE_MODE_OPTIONS: SelectOptionType[] = [
  { value: 'specific', label: t('Конкретная дата/время') },
  { value: 'relative', label: t('Относительная дата/время') },
  { value: 'now', label: t('Сейчас') },
  { value: 'today', label: t('Полночь') },
];

export const UNTIL_MODE_OPTIONS: SelectOptionType[] =
  SINCE_MODE_OPTIONS.slice();

export const COMMON_RANGE_SET: Set<CommonRangeType> = new Set([
  'Last day',
  'Last week',
  'Last month',
  'Last quarter',
  'Last year',
]);

export const CALENDAR_RANGE_SET: Set<CalendarRangeType> = new Set([
  PreviousCalendarWeek,
  PreviousCalendarMonth,
  PreviousCalendarQuarter,
  PreviousCalendarYear,
]);

export const CURRENT_CALENDAR_RANGE_SET: Set<CurrentRangeType> = new Set([
  CurrentDay,
  CurrentWeek,
  CurrentMonth,
  CurrentQuarter,
  CurrentYear,
]);

export const DAYJS_FORMAT = 'YYYY-MM-DD[T]HH:mm:ss';
export const SEVEN_DAYS_AGO = extendedDayjs()
  .utc()
  .startOf('day')
  .subtract(7, 'days')
  .format(DAYJS_FORMAT);
export const MIDNIGHT = extendedDayjs()
  .utc()
  .startOf('day')
  .format(DAYJS_FORMAT);

export enum DateFilterTestKey {
  CommonFrame = 'common-frame',
  ModalOverlay = 'modal-overlay',
  PopoverOverlay = 'time-range-trigger',
  NoFilter = 'no-filter',
  CancelButton = 'cancel-button',
  ApplyButton = 'date-filter-control__apply-button',
}
