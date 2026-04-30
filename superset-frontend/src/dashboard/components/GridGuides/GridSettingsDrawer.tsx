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
 * GridSettingsDrawer — содержимое Shell-drawer'а kind='gridSettings'.
 * Триггерится tile'ом «Сетка» в DevToolsPanel'е, открывается на том же
 * месте что и Каталог (bottom-sheet поверх контента).
 *
 * Настройки:
 *  - Toggle: постоянное отображение 12-колоночного overlay
 *  - Toggle: показывать сетку ячеек внутри колонок
 *  - Number: расстояние между колонками (columnGap, default 16 px =
 *    GRID_GUTTER_SIZE — стандартный horizontal gap Superset)
 *  - Number: расстояние между строками (rowGap, default 8 px =
 *    GRID_BASE_UNIT — стандартный vertical step Superset)
 *  - Reset — все настройки в default
 */
import { type FC, useCallback, type ChangeEvent } from 'react';
import { styled, t } from '@superset-ui/core';
import { DS2_VARS } from 'src/theme/ds2';
import {
  GRID_GUIDES_DEFAULTS,
  GRID_GUIDES_LIMITS,
  useGridGuides,
} from './GridGuidesContext';

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px;
  font-family: ${DS2_VARS.fontSans};
`;

const Card = styled.div`
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* Row — div, не label. Раньше был <label> с скрытым checkbox + видимым
   span'ом ToggleSwitch внутри; клик по ToggleSwitch триггерил И его
   onClick И label-нативный click→input.checked toggle, два setState
   подряд гасили друг друга. Чистая div+button-схема избавляется от
   двойного срабатывания. */
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: ${DS2_VARS.ink};
`;

const Label = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Hint = styled.span`
  font-size: 11px;
  color: ${DS2_VARS.g500};
  line-height: 1.35;
`;

/* iOS-style switch — button с role="switch" + aria-checked, controlled
   полностью через onClick. */
const ToggleSwitch = styled.button<{ $checked: boolean }>`
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 38px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: ${({ $checked }) =>
    $checked ? DS2_VARS.cSky : DS2_VARS.g300};
  transition: background 0.15s ${DS2_VARS.ease};
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $checked }) => ($checked ? '18px' : '2px')};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: left 0.15s ${DS2_VARS.ease};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const NumberInput = styled.input`
  width: 80px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid ${DS2_VARS.g300};
  border-radius: 8px;
  background: ${DS2_VARS.s};
  font-family: ${DS2_VARS.fontMono};
  font-size: 13px;
  color: ${DS2_VARS.ink};
  text-align: right;
  transition: border-color 0.12s ${DS2_VARS.ease};
  &:focus {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
    border-color: transparent;
  }
`;

const Note = styled.div`
  font-size: 11.5px;
  color: ${DS2_VARS.g500};
  line-height: 1.5;
  padding: 0 2px;
`;

const ResetBtn = styled.button`
  align-self: flex-end;
  background: transparent;
  border: 1px solid ${DS2_VARS.g300};
  border-radius: 8px;
  padding: 6px 12px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  color: ${DS2_VARS.g600};
  cursor: pointer;
  transition:
    border-color 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};
  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
  }
`;

export const GridSettingsDrawer: FC = () => {
  const {
    state: gridGuides,
    setShowColumns,
    setShowGrid,
    setColumnGap,
    setRowGap,
    setSubdivisions,
    setFreeMode,
    reset: resetGridGuides,
  } = useGridGuides();

  const handleColumnGapChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (Number.isFinite(n)) setColumnGap(n);
    },
    [setColumnGap],
  );
  const handleRowGapChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (Number.isFinite(n)) setRowGap(n);
    },
    [setRowGap],
  );
  const handleSubdivisionsChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (Number.isFinite(n)) setSubdivisions(n);
    },
    [setSubdivisions],
  );

  return (
    <Body role="region" aria-label={t('Настройки сетки')}>
      <Card>
        <Row>
          <Label>
            <span>{t('Постоянное отображение колонок')}</span>
            <Hint>
              {t('12 направляющих видны всегда, не только при ресайзе')}
            </Hint>
          </Label>
          <ToggleSwitch
            type="button"
            role="switch"
            aria-checked={gridGuides.showColumns}
            aria-label={t('Постоянное отображение колонок')}
            $checked={gridGuides.showColumns}
            onClick={() => setShowColumns(!gridGuides.showColumns)}
          />
        </Row>
        <Row>
          <Label>
            <span>{t('Сетка ячеек внутри колонок')}</span>
            <Hint>
              {t(
                'Каждая колонка разбита на квадраты с теми же отступами',
              )}
            </Hint>
          </Label>
          <ToggleSwitch
            type="button"
            role="switch"
            aria-checked={gridGuides.showGrid}
            aria-label={t('Сетка ячеек внутри колонок')}
            $checked={gridGuides.showGrid}
            onClick={() => setShowGrid(!gridGuides.showGrid)}
          />
        </Row>
        <Row>
          <Label>
            <span>{t('Расстояние между колонками')}</span>
            <Hint>
              {t(
                'По умолчанию %s px (стандартный gutter Superset)',
                GRID_GUIDES_DEFAULTS.columnGap,
              )}
            </Hint>
          </Label>
          <NumberInput
            type="number"
            min={GRID_GUIDES_LIMITS.minGap}
            max={GRID_GUIDES_LIMITS.maxGap}
            step={1}
            value={gridGuides.columnGap}
            onChange={handleColumnGapChange}
            aria-label={t('Расстояние между колонками в пикселях')}
          />
        </Row>
        <Row>
          <Label>
            <span>{t('Расстояние между строками')}</span>
            <Hint>
              {t(
                'По умолчанию %s px (стандартный шаг по высоте Superset)',
                GRID_GUIDES_DEFAULTS.rowGap,
              )}
            </Hint>
          </Label>
          <NumberInput
            type="number"
            min={GRID_GUIDES_LIMITS.minGap}
            max={GRID_GUIDES_LIMITS.maxGap}
            step={1}
            value={gridGuides.rowGap}
            onChange={handleRowGapChange}
            aria-label={t('Расстояние между строками в пикселях')}
          />
        </Row>
        <Row>
          <Label>
            <span>{t('Дробление колонки')}</span>
            <Hint>
              {t(
                '1 = 12 ячеек, 2 = 24, 4 = 48… делает сетку мельче, отступы сохраняются',
              )}
            </Hint>
          </Label>
          <NumberInput
            type="number"
            min={GRID_GUIDES_LIMITS.minSubdivisions}
            max={GRID_GUIDES_LIMITS.maxSubdivisions}
            step={1}
            value={gridGuides.subdivisions}
            onChange={handleSubdivisionsChange}
            aria-label={t('Сколько ячеек в одной колонке')}
          />
        </Row>
        <Row>
          <Label>
            <span>{t('Произвольный размер (free mode)')}</span>
            <Hint>
              {t(
                'Snap = 1 px. Чарт ресайзится до любых размеров; сохраняется в пикселях',
              )}
            </Hint>
          </Label>
          <ToggleSwitch
            type="button"
            role="switch"
            aria-checked={gridGuides.freeMode}
            aria-label={t('Произвольный размер')}
            $checked={gridGuides.freeMode}
            onClick={() => setFreeMode(!gridGuides.freeMode)}
          />
        </Row>
        <ResetBtn type="button" onClick={resetGridGuides}>
          {t('Сбросить настройки')}
        </ResetBtn>
      </Card>
      <Note>
        {t(
          'Drag-and-drop по-прежнему привязан к стандартной 12-колоночной сетке Superset (16 px между колонками, 8 px по высоте). Эти настройки — визуальные оверлеи для удобства позиционирования; на snap не влияют.',
        )}
      </Note>
    </Body>
  );
};

export default GridSettingsDrawer;
