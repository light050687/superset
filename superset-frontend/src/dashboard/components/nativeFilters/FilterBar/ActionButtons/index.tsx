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
import { useMemo } from 'react';
import {
  css,
  DataMaskState,
  DataMaskStateWithId,
  t,
  isDefined,
  SupersetTheme,
  styled,
} from '@superset-ui/core';
import { Button } from '@superset-ui/core/components';
import { OPEN_FILTER_BAR_WIDTH } from 'src/dashboard/constants';
import tinycolor from 'tinycolor2';
import { FilterBarOrientation } from 'src/dashboard/types';
import { getFilterBarTestId } from '../utils';

interface ActionButtonsProps {
  width?: number;
  onApply: () => void;
  onClearAll: () => void;
  dataMaskSelected: DataMaskState;
  dataMaskApplied: DataMaskStateWithId;
  isApplyDisabled: boolean;
  filterBarOrientation?: FilterBarOrientation;
  isMobile?: boolean;
}

const containerStyle = (theme: SupersetTheme) => css`
  display: flex;

  && > .filter-clear-all-button {
    color: ${theme.colorTextSecondary};
    margin-left: 0;
    &:hover {
      color: ${theme.colorPrimaryText};
    }

    &[disabled],
    &[disabled]:hover {
      color: ${theme.colorTextDisabled};
    }
  }
`;

const verticalStyle = (theme: SupersetTheme, width: number) => css`
  flex-direction: column;
  align-items: center;
  position: fixed;
  z-index: 100;

  // filter bar width minus 1px for border
  width: ${width - 1}px;
  bottom: 0;

  padding: ${theme.sizeUnit * 4}px;
  padding-top: ${theme.sizeUnit * 6}px;

  background: linear-gradient(
    ${tinycolor(theme.colorBgLayout).setAlpha(0).toRgbString()},
    ${theme.colorBgContainer} 20%
  );

  & > .filter-apply-button {
    margin-bottom: ${theme.sizeUnit * 3}px;
  }
`;

const horizontalStyle = (theme: SupersetTheme) => css`
  align-items: center;
  margin-left: auto;
  && > .filter-clear-all-button {
    text-transform: capitalize;
    font-weight: ${theme.fontWeightNormal};
  }
`;

const mobileStyle = (theme: SupersetTheme) => css`
  flex-direction: row;
  align-items: center;
  position: static;
  width: 100%;
  box-sizing: border-box;
  padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 2}px;
  border-top: 1px solid ${theme.colorBorderSecondary};
  background: ${theme.colorBgContainer};
  gap: ${theme.sizeUnit}px;
  flex-shrink: 0;

  & > .filter-apply-button {
    flex: 1;
    min-width: 0;
    margin: 0;
  }

  & > .filter-clear-all-button {
    flex: 0 0 auto;
    margin: 0;
    white-space: nowrap;
  }
`;

const ButtonsContainer = styled.div<{
  isVertical: boolean;
  width: number;
  isMobile?: boolean;
}>`
  ${({ theme, isVertical, width, isMobile }) => css`
    ${containerStyle(theme)};
    ${isMobile
      ? mobileStyle(theme)
      : isVertical
        ? verticalStyle(theme, width)
        : horizontalStyle(theme)};
  `}
`;

const ActionButtons = ({
  width = OPEN_FILTER_BAR_WIDTH,
  onApply,
  onClearAll,
  dataMaskApplied,
  dataMaskSelected,
  isApplyDisabled,
  filterBarOrientation = FilterBarOrientation.Vertical,
  isMobile,
}: ActionButtonsProps) => {
  const isClearAllEnabled = useMemo(
    () =>
      Object.values(dataMaskApplied).some(
        filter =>
          isDefined(dataMaskSelected[filter.id]?.filterState?.value) ||
          (!dataMaskSelected[filter.id] &&
            isDefined(filter.filterState?.value)),
      ),
    [dataMaskApplied, dataMaskSelected],
  );
  const isVertical = filterBarOrientation === FilterBarOrientation.Vertical;

  return (
    <ButtonsContainer
      isVertical={isVertical}
      width={width}
      isMobile={isMobile}
      data-test="filterbar-action-buttons"
    >
      <Button
        disabled={isApplyDisabled}
        buttonStyle="primary"
        htmlType="submit"
        className="filter-apply-button"
        onClick={onApply}
        {...getFilterBarTestId('apply-button')}
      >
        {isVertical ? t('Apply filters') : t('Apply')}
      </Button>
      <Button
        disabled={!isClearAllEnabled}
        buttonStyle="link"
        className="filter-clear-all-button"
        onClick={onClearAll}
        {...getFilterBarTestId('clear-button')}
      >
        {t('Clear all')}
      </Button>
    </ButtonsContainer>
  );
};

export default ActionButtons;
