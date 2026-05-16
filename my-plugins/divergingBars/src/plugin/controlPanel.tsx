import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

/**
 * Velocity Diverging — control panel.
 * Все метрики сделаны опциональными (`validators: []`): в mock-режиме
 * запрос уходит в БД без метрик, а контракт с реальными данными валидирует
 * только на стороне transformProps.
 */

type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isMockEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.mock_mode_enabled?.value === true;

const isRealData = ({ controls }: ControlsMap): boolean =>
  controls?.mock_mode_enabled?.value !== true;

const DEFAULT_FORMAT_MAPPING = JSON.stringify(
  {
    express: { name: 'Экспресс', color: 'c-sky', plan: 2.09 },
    minimarket: { name: 'Минимаркет', color: 'c-tangerine', plan: 2.25 },
    super: { name: 'Супермаркет', color: 'c-fuchsia', plan: 1.95 },
    home: { name: 'Магазин у дома', color: 'c-amber', plan: 1.15 },
    superstore: { name: 'Суперстор', color: 'g500', plan: 0.92 },
  },
  null,
  2,
);

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,

    // ── Режим проектирования (mock) ──
    {
      label: t('Режим проектирования'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'mock_mode_enabled',
            config: {
              type: 'CheckboxControl',
              label: t('Включить режим проектирования'),
              description: t(
                'Показывает 400 тестовых магазинов (детерминированная генерация ' +
                  'по seed). Выключите, когда датасет в StarRocks будет готов.',
              ),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'mock_preset',
            config: {
              type: 'SelectControl',
              label: t('Пресет данных'),
              default: 'losses_velocity',
              choices: [
                ['losses_velocity', t('Скорость потерь (400 магазинов)')],
              ],
              renderTrigger: true,
              visibility: isMockEnabled,
            },
          },
        ],
      ],
    },

    // ── Запрос к БД ──
    {
      label: t('Запрос'),
      expanded: true,
      controlSetRows: [
        ['adhoc_filters'],
        [
          {
            name: 'metric_loss',
            config: {
              ...sharedControls.metric,
              label: t('Метрика потерь'),
              description: t(
                'Сумма потерь за период (обычно SUM(loss_rub)).',
              ),
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'metric_turnover',
            config: {
              ...sharedControls.metric,
              label: t('Метрика товарооборота'),
              description: t(
                'Товарооборот (ТО) — нужен для расчёта % к ТО.',
              ),
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'groupby_store_code',
            config: {
              ...sharedControls.groupby,
              label: t('Код магазина'),
              description: t('Уникальный код магазина, напр. Д123.'),
              multi: false,
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'groupby_store_name',
            config: {
              ...sharedControls.groupby,
              label: t('Название магазина'),
              description: t('Короткое название магазина для отображения.'),
              multi: false,
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'groupby_city',
            config: {
              ...sharedControls.groupby,
              label: t('Город'),
              multi: false,
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'groupby_format',
            config: {
              ...sharedControls.groupby,
              label: t('Формат магазина'),
              description: t(
                'Код формата (express / minimarket / super / home / superstore). ' +
                  'Маппинг на русские названия и цвет — в секции «Форматы магазинов».',
              ),
              multi: false,
              validators: [],
              visibility: isRealData,
            },
          },
        ],
        [
          {
            name: 'groupby_week',
            config: {
              ...sharedControls.groupby,
              label: t('Неделя'),
              description: t(
                'Колонка с датой понедельника недели (обычно DATE_TRUNC(\'week\', <date>)). ' +
                  'Ожидается 12 последних недель.',
              ),
              multi: false,
              validators: [],
              visibility: isRealData,
            },
          },
        ],
      ],
    },

    // ── Отображение ──
    {
      label: t('Отображение'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              label: t('Заголовок карточки'),
              default: t('Скорость роста потерь'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'default_horizon',
            config: {
              type: 'SelectControl',
              label: t('Горизонт по умолчанию'),
              default: '4w',
              choices: [
                ['wow', t('WoW (неделя к неделе)')],
                ['4w', t('4W vs 4W')],
                ['mom', t('MoM (месяц к месяцу)')],
                ['cum', t('Кумулятивно')],
              ],
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'default_metric',
            config: {
              type: 'SelectControl',
              label: t('Метрика по умолчанию'),
              default: 'rub',
              choices: [
                ['rub', t('₽ Суммы')],
                ['pct', t('% к ТО')],
              ],
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_summary_strip',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать сводку сверху'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_cumulative_view',
            config: {
              type: 'CheckboxControl',
              label: t('Разрешить кумулятивный вид'),
              description: t(
                'Если выключено — кнопка «Кумулят.» будет скрыта из переключателя горизонтов.',
              ),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_detail_modal',
            config: {
              type: 'CheckboxControl',
              label: t('Разрешить модалку детализации'),
              description: t('Двойной клик / Ctrl+клик открывает 12-недельный тренд магазина.'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_csv_export',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать кнопку CSV'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── Форматы магазинов (маппинг) ──
    {
      label: t('Форматы магазинов'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'format_mapping_json',
            config: {
              type: 'TextAreaControl',
              label: t('Маппинг форматов (JSON)'),
              description: t(
                'Соответствие code → {name, color, plan}. ' +
                  'Допустимые color: c-sky, c-violet, c-tangerine, c-fuchsia, c-amber, g500.',
              ),
              default: DEFAULT_FORMAT_MAPPING,
              language: 'json',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
