import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

/**
 * ControlPanel плагина «Рейтинг магазинов».
 *
 * Секции:
 *   1. Time — стандартные time_range / granularity_sqla / adhoc_filters.
 *   2. Режим проектирования — mock-данные для согласования дизайна.
 *   3. Настройки отображения — row_limit, default_sort, period_label.
 *   4. Сопоставление колонок — text-overrides имён полей/метрик.
 *
 * Весь UI-текст на русском (правило CLAUDE.md).
 */

type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isMockEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.mock_mode_enabled?.value === true;

const SORT_CHOICES: [string, string][] = [
  ['lossCombined', t('Уровень потерь (по умолчанию)')],
  ['writeoff', t('% Списаний')],
  ['shrinkage', t('% Недостач')],
  ['avgWriteoff', t('Ср. сумма списания')],
  ['avgShrinkageCheck', t('Ср. чек недостачи')],
  ['name', t('Имя магазина (А-Я)')],
];

const MOCK_PRESET_CHOICES: [string, string][] = [
  ['losses_400', t('Потери · 400 магазинов')],
  ['losses_50', t('Потери · 50 магазинов (быстрая демо)')],
  ['empty', t('Пустой набор')],
];

const ROW_LIMIT_CHOICES: [number, string][] = [
  [100, '100'],
  [500, '500'],
  [1000, '1\u00a0000'],
  [5000, '5\u00a0000'],
  [10000, '10\u00a0000'],
];

const PAGE_SIZE_CHOICES: [number, string][] = [
  [25, '25'],
  [50, '50'],
  [100, '100'],
  [200, '200'],
];

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,

    // ── 1. Режим проектирования ───────────────────────────────────
    {
      label: t('Режим проектирования'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'mock_mode_enabled',
            config: {
              type: 'CheckboxControl',
              label: t('Включить режим проектирования'),
              description: t(
                'Показывает тестовые данные (рейтинг магазинов из прототипа). ' +
                  'Выключите, когда реальные данные из StarRocks будут готовы.',
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
              label: t('Пресет mock-данных'),
              default: 'losses_400',
              choices: MOCK_PRESET_CHOICES,
              renderTrigger: true,
              visibility: isMockEnabled,
            },
          },
        ],
      ],
    },

    // ── 2. Отображение ───────────────────────────────────────────
    {
      label: t('Отображение'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              label: t('Лимит строк'),
              default: 1000,
              choices: ROW_LIMIT_CHOICES,
              description: t(
                'Максимальное число магазинов, загружаемых из dataset.',
              ),
            },
          },
        ],
        [
          {
            name: 'default_sort',
            config: {
              type: 'SelectControl',
              label: t('Сортировка по умолчанию'),
              default: 'lossCombined',
              choices: SORT_CHOICES,
              description: t(
                'По какому столбцу сортировать таблицу при первой загрузке.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'page_size',
            config: {
              type: 'SelectControl',
              label: t('Магазинов на странице'),
              default: 50,
              choices: PAGE_SIZE_CHOICES,
              freeForm: false,
              description: t(
                'Размер страницы пагинации. Сейчас навигация работает по уже загруженной выборке (row_limit); серверная пагинация — следующий шаг.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'period_label',
            config: {
              type: 'TextControl',
              label: t('Подпись периода'),
              default: '',
              description: t(
                'Например «Март 2026» — выводится в шапке карточки ' +
                  'под заголовком «Рейтинг магазинов».',
              ),
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── 3. Сопоставление колонок dataset ─────────────────────────
    {
      label: t('Сопоставление колонок'),
      expanded: false,
      description: t(
        'Имена столбцов и метрик, если они отличаются от дефолтов. ' +
          'По умолчанию плагин ожидает: store_id, store_name, city, format, ' +
          'format_name, division, to_class, writeoff_pct, shrinkage_pct, ' +
          'plan_writeoff_pct, plan_shrinkage_pct, avg_writeoff_rub, ' +
          'avg_shrinkage_check_rub.',
      ),
      controlSetRows: [
        [
          {
            name: 'store_id_col',
            config: {
              type: 'TextControl',
              label: t('Столбец ID магазина'),
              default: 'store_id',
              renderTrigger: false,
            },
          },
          {
            name: 'store_name_col',
            config: {
              type: 'TextControl',
              label: t('Столбец названия'),
              default: 'store_name',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'city_col',
            config: {
              type: 'TextControl',
              label: t('Столбец города'),
              default: 'city',
              renderTrigger: false,
            },
          },
          {
            name: 'format_col',
            config: {
              type: 'TextControl',
              label: t('Столбец формата'),
              default: 'format',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'format_name_col',
            config: {
              type: 'TextControl',
              label: t('Столбец названия формата'),
              default: 'format_name',
              renderTrigger: false,
            },
          },
          {
            name: 'division_col',
            config: {
              type: 'TextControl',
              label: t('Столбец дивизиона'),
              default: 'division',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'to_class_col',
            config: {
              type: 'TextControl',
              label: t('Столбец ТО (млн ₽)'),
              default: 'to_class',
              renderTrigger: false,
            },
          },
          {
            name: 'segment_id_col',
            config: {
              type: 'TextControl',
              label: t('Столбец ID сегмента (для cross-filter)'),
              default: 'segment_id',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'writeoff_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика % списаний'),
              default: 'writeoff_pct',
              renderTrigger: false,
            },
          },
          {
            name: 'shrinkage_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика % недостач'),
              default: 'shrinkage_pct',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'plan_writeoff_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика плана списаний'),
              default: 'plan_writeoff_pct',
              renderTrigger: false,
            },
          },
          {
            name: 'plan_shrinkage_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика плана недостач'),
              default: 'plan_shrinkage_pct',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'avg_writeoff_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика ср. суммы списания (₽)'),
              default: 'avg_writeoff_rub',
              renderTrigger: false,
            },
          },
          {
            name: 'avg_shrinkage_check_metric',
            config: {
              type: 'TextControl',
              label: t('Метрика ср. чека недостачи (₽)'),
              default: 'avg_shrinkage_check_rub',
              renderTrigger: false,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
