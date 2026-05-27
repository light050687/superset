import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
import CategoryColorMapControl from '../controls/CategoryColorMapControl';

// ═══════════════════════════════════════
// Visibility helpers
// ═══════════════════════════════════════

type ControlsMap = { controls: Record<string, { value?: unknown }> };

const isMockEnabled = ({ controls }: ControlsMap): boolean =>
  controls?.mock_mode_enabled?.value === true;

const isMockCustom = ({ controls }: ControlsMap): boolean =>
  isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';

// ═══════════════════════════════════════
// Control panel config
// ═══════════════════════════════════════

const config: ControlPanelConfig = {
  controlPanelSections: [
    // ── 1. Time ──
    sections.legacyTimeseriesTime,

    // ── 2. Режим проектирования ──
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
                'Показывает тестовые данные из прототипа для согласования дизайна. ' +
                  'Выключите, когда реальные данные будут готовы.',
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
              default: 'losses',
              choices: [
                ['losses', t('Потери (прототип)')],
                ['empty', t('Пустой')],
                ['custom', t('Кастом (JSON)')],
              ] as [string, string][],
              renderTrigger: true,
              visibility: isMockEnabled,
            },
          },
        ],
        [
          {
            name: 'mock_custom_json',
            config: {
              type: 'TextAreaControl',
              label: t('JSON кастомных данных'),
              description: t(
                'Формат: {"totalRevenue": 88500, "categories": [{"id":"...", ' +
                  '"name":"...", "accent":"cSky", "rub":100, "count":10, ' +
                  '"children":[{"id":"...", "name":"...", "rub":50, "count":5}]}]}',
              ),
              default: '{}',
              language: 'json',
              renderTrigger: true,
              visibility: isMockCustom,
            },
          },
        ],
      ],
    },

    // ── 3. Данные ──
    {
      label: t('Данные'),
      expanded: false,
      controlSetRows: [
        ['adhoc_filters'],
        [
          {
            name: 'groupby_category',
            config: {
              ...sharedControls.groupby,
              label: t('Категория'),
              description: t('Колонка верхнего уровня иерархии. Валидация в transformProps.'),
              multi: false,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'groupby_subcategory',
            config: {
              ...sharedControls.groupby,
              label: t('Подкатегория'),
              description: t(
                'Колонка второго уровня. Если задана — включается drill-down. ' +
                  'NULL-значения собираются в «Без подкатегории».',
              ),
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
              label: t('Сумма (₽)'),
              description: t('Основное значение сегмента — сумма потерь в рублях'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'count_metric',
            config: {
              ...sharedControls.metric,
              label: t('Количество операций'),
              description: t('Опционально — показывается в тултипе («Операций»)'),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'revenue_metric',
            config: {
              ...sharedControls.metric,
              label: t('Оборот (знаменатель %)'),
              description: t(
                'Опционально. Метрика, чья сумма по всем строкам используется ' +
                  'как 100% в режиме %. Если не задана — используется сумма видимых сегментов.',
              ),
              validators: [],
            },
          },
        ],
      ],
    },

    // ── 4. Отображение ──
    {
      label: t('Отображение'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              label: t('Заголовок карточки'),
              description: t('По умолчанию — «Структура потерь»'),
              default: 'Структура потерь',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'subtitle_text',
            config: {
              type: 'TextControl',
              label: t('Подзаголовок'),
              description: t('Показывается в breadcrumb в режиме «Все категории»'),
              default: 'за год',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_outer_labels_pct',
            config: {
              type: 'CheckboxControl',
              label: t('Подписи на сегментах в режиме %'),
              description: t('Показывать процент от оборота на внешней стороне сегмента'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'pad_angle',
            config: {
              type: 'SliderControl',
              label: t('Зазор между сегментами'),
              description: t('Угловой зазор между слайсами, градусы'),
              min: 0,
              max: 4,
              step: 0.5,
              default: 1.5,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'border_radius',
            config: {
              type: 'SliderControl',
              label: t('Скругление сегментов'),
              min: 0,
              max: 6,
              step: 1,
              default: 2,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'rub_decimals',
            config: {
              type: 'SliderControl',
              label: t('Знаков после запятой'),
              description: t(
                'Сколько цифр показывать после запятой в hero-числе ' +
                  '(₽). Примеры: 0 → "8 млрд ₽", 1 → "8,2 млрд ₽", ' +
                  '2 → "8,23 млрд ₽", 3 → "8,230 млрд ₽".',
              ),
              min: 0,
              max: 3,
              step: 1,
              default: 2,
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ── 5. Цвета категорий ──
    {
      label: t('Цвета категорий'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'color_map',
            config: {
              type: CategoryColorMapControl,
              label: t('Соответствие «Категория → цвет»'),
              description: t(
                'Для категорий без явного маппинга применяется автопалитра: ' +
                  'cSky → cViolet → cTangerine → cFuchsia → cAmber.',
              ),
              default: [],
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
