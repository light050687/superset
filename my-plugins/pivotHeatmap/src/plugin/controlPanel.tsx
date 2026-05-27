import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';

type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isMockEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.mock_mode_enabled?.value === true;

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,

    // ── Режим проектирования ──
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
                'Показывает синтетические данные из прототипа (5 форматов × 7 дивизионов, потери с breakdown). Выключите, когда реальные данные будут готовы.',
              ),
              default: false,
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
              default: 'losses',
              choices: [['losses', t('Потери по форматам')]],
              renderTrigger: true,
              visibility: isMockEnabled,
            },
          },
        ],
      ],
    },

    // ── Запрос ──
    {
      label: t('Запрос'),
      expanded: false,
      controlSetRows: [
        ['adhoc_filters'],
        [
          {
            name: 'row_axis',
            config: {
              ...sharedControls.groupby,
              label: t('Ось строк'),
              description: t('Колонка для строк pivot-таблицы (например, формат магазина)'),
              multi: false,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'col_axis',
            config: {
              ...sharedControls.groupby,
              label: t('Ось колонок'),
              description: t('Колонка для колонок pivot-таблицы (например, дивизион)'),
              multi: false,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'value_metric',
            config: {
              ...sharedControls.metric,
              label: t('Основная метрика'),
              description: t('Значение, отображаемое в ячейках (обязательно)'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'plan_metric',
            config: {
              ...sharedControls.metric,
              label: t('Плановая метрика'),
              description: t('Плановое значение для сравнения (опционально). Ratio = факт/план.'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'revenue_metric',
            config: {
              ...sharedControls.metric,
              label: t('Метрика знаменателя (% от)'),
              description: t('Используется для расчёта процента (оборот для потерь). Опционально.'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'shops_metric',
            config: {
              ...sharedControls.metric,
              label: t('Количество магазинов'),
              description: t('Для детализации в drill-модалке. Опционально.'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'breakdown_dim',
            config: {
              ...sharedControls.groupby,
              label: t('Измерение детализации'),
              description: t('Колонка для breakdown в drill-модалке (например, категория потерь: списания, кражи). Опционально.'),
              multi: false,
              validators: [],
            },
          },
        ],
      ],
    },

    // ── Пороги ──
    {
      label: t('Пороги статусов'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'threshold_ok',
            config: {
              type: 'TextControl',
              label: t('Порог «В норме» (ratio)'),
              description: t('Максимальное отношение факт/план для зелёного статуса. По умолчанию 1.0.'),
              default: 1.0,
              isFloat: true,
              renderTrigger: true,
            },
          },
          {
            name: 'threshold_wn',
            config: {
              type: 'TextControl',
              label: t('Порог «Внимание» (ratio)'),
              description: t('Максимальное отношение факт/план для жёлтого статуса. Выше — красный. По умолчанию 1.3.'),
              default: 1.3,
              isFloat: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'value_polarity',
            config: {
              type: 'SelectControl',
              label: t('Полярность метрики'),
              description: t('Семантика: выше = хуже (потери, расходы) или выше = лучше (выручка).'),
              default: 'higher_is_worse',
              choices: [
                ['higher_is_worse', t('Выше — хуже (потери, расходы)')],
                ['higher_is_better', t('Выше — лучше (выручка)')],
              ],
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── Формат и отображение ──
    {
      label: t('Формат и отображение'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              label: t('Заголовок карточки'),
              default: 'Heatmap Pivot',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'default_unit',
            config: {
              type: 'SelectControl',
              label: t('Единицы по умолчанию'),
              default: 'abs',
              choices: [
                ['abs', t('Абсолютное значение')],
                ['pct', t('Процент (%)')],
              ],
              renderTrigger: true,
            },
          },
          {
            name: 'unit_suffix',
            config: {
              type: 'TextControl',
              label: t('Суффикс единиц'),
              description: t('Например: «млн ₽», «тыс шт.»'),
              default: 'млн ₽',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'decimals',
            config: {
              type: 'TextControl',
              label: t('Знаков после запятой'),
              description: t('По DS 2.0: проценты с 1 знаком (12,4%); абсолютные числа — обычно 1.'),
              default: 1,
              isInt: true,
              renderTrigger: true,
            },
          },
          {
            name: 'auto_format_russian',
            config: {
              type: 'CheckboxControl',
              label: t('Русский формат (тыс/млн/млрд)'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_totals',
            config: {
              type: 'CheckboxControl',
              label: t('Показывать Σ Итоги по умолчанию'),
              description: t('Строка и колонка итогов (ячейка Σ в шапке карточки переключает вручную).'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'col_label_max_chars',
            config: {
              type: 'TextControl',
              label: t('Макс. длина названия колонки'),
              description: t(
                'Длинные названия обрезаются до N символов и завершаются «…». Полное имя видно по hover. 0 или отрицательное — без ограничения.',
              ),
              default: 18,
              isInt: true,
              renderTrigger: true,
            },
          },
          {
            name: 'row_label_max_chars',
            config: {
              type: 'TextControl',
              label: t('Макс. длина названия строки'),
              description: t(
                'Аналогично для шапок строк (форматов магазинов и т.п.). 0 — без ограничения.',
              ),
              default: 24,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'emit_filter',
            config: {
              type: 'CheckboxControl',
              label: t('Эмитировать cross-filter'),
              description: t('Клик по ячейке/строке/колонке фильтрует другие чарты дашборда. Работает только если cross-filters включены в свойствах чарта.'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
