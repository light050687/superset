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
import { ReactNode, useContext, useState, useEffect, useMemo } from 'react';
import {
  css,
  styled,
  t,
  useTheme,
  NO_TIME_RANGE,
  SupersetTheme,
  useCSSTextTruncation,
  fetchTimeRange,
} from '@superset-ui/core';
import {
  Button,
  Constants,
  Divider,
  Modal,
  Tooltip,
  Select,
} from '@superset-ui/core/components';
import ControlHeader from 'src/explore/components/ControlHeader';
import { Icons } from '@superset-ui/core/components/Icons';
import { useDebouncedEffect } from 'src/explore/exploreUtils';
import { noOp } from 'src/utils/common';
import ControlPopover from '../ControlPopover/ControlPopover';

import { DateFilterOverlayContext } from './DateFilterOverlayContext';
import { DateFilterControlProps, FrameType } from './types';
import {
  DateFilterTestKey,
  FRAME_OPTIONS,
  guessFrame,
  useDefaultTimeFilter,
} from './utils';
import {
  CommonFrame,
  CalendarFrame,
  CustomFrame,
  AdvancedFrame,
  DateLabel,
} from './components';
import { CurrentCalendarFrame } from './components/CurrentCalendarFrame';

const StyledRangeType = styled(Select)`
  width: 272px;
`;

const ContentStyleWrapper = styled.div`
  ${({ theme }) => css`
    .ant-row {
      margin-top: 8px;
    }

    .ant-picker {
      padding: 4px 17px 4px;
      border-radius: ${theme.borderRadius}px;
    }

    .ant-divider-horizontal {
      margin: 16px 0;
    }

    .control-label {
      font-size: ${theme.fontSizeSM}px;
      line-height: 16px;
      margin: 8px 0;
    }

    .section-title {
      font-style: normal;
      font-weight: ${theme.fontWeightStrong};
      font-size: 15px;
      line-height: 24px;
      margin-bottom: 8px;
    }

    .control-anchor-to {
      margin-top: 16px;
    }

    .control-anchor-to-datetime {
      width: 217px;
    }

    .footer {
      text-align: right;
    }
  `}
`;

const IconWrapper = styled.span`
  span {
    margin-right: ${({ theme }) => 2 * theme.sizeUnit}px;
    vertical-align: middle;
  }
  .text {
    vertical-align: middle;
  }
  .error {
    color: ${({ theme }) => theme.colorError};
  }
`;

const getTooltipTitle = (
  isLabelTruncated: boolean,
  label: string | undefined,
  range: string | undefined,
) =>
  isLabelTruncated ? (
    <div>
      {label && <strong>{label}</strong>}
      {range && (
        <div
          css={(theme: SupersetTheme) => css`
            margin-top: ${theme.sizeUnit}px;
          `}
        >
          {range}
        </div>
      )}
    </div>
  ) : (
    range || null
  );

/* ADR (actual datetime range) от backend'а приходит длинной строкой
   вида "2026-05-21T02:24:45 ≤ col < 2026-05-28T02:24:45" — это
   математическое выражение, читать в маленькой filter-card сложно.
   Извлекаем два ISO-дня (без time) и форматируем как
   "дд.ММ.гггг — дд.ММ.гггг". Если паттерн не совпал — возвращаем
   исходную строку (fallback, безопасно). */
const ADR_PATTERN =
  /^(\d{4}-\d{2}-\d{2})(?:T[\d:.]+)?\s*[≤<≥>]+\s*col\s*[≤<≥>]+\s*(\d{4}-\d{2}-\d{2})/;

const isoToHuman = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const formatADR = (adr: string | undefined): string | undefined => {
  if (!adr) return adr;
  const match = adr.match(ADR_PATTERN);
  if (!match) return adr;
  return `${isoToHuman(match[1])} — ${isoToHuman(match[2])}`;
};

export default function DateFilterLabel(props: DateFilterControlProps) {
  const {
    name,
    onChange,
    onOpenPopover = noOp,
    onClosePopover = noOp,
    isOverflowingFilterBar = false,
  } = props;
  const defaultTimeFilter = useDefaultTimeFilter();

  const value = props.value ?? defaultTimeFilter;
  const [actualTimeRange, setActualTimeRange] = useState<string>(value);

  const [show, setShow] = useState<boolean>(false);
  const guessedFrame = useMemo(() => guessFrame(value), [value]);
  const [frame, setFrame] = useState<FrameType>(guessedFrame);
  const [lastFetchedTimeRange, setLastFetchedTimeRange] = useState(value);
  const [timeRangeValue, setTimeRangeValue] = useState(value);
  const [validTimeRange, setValidTimeRange] = useState<boolean>(false);
  const [evalResponse, setEvalResponse] = useState<string>(value);
  const [tooltipTitle, setTooltipTitle] = useState<ReactNode | null>(value);
  const theme = useTheme();
  /* overlayMode='modal' инжектится FiltersDrawer'ом (см.
     DateFilterOverlayContext.tsx). Default 'popover' для Explore. */
  const overlayMode = useContext(DateFilterOverlayContext);
  /* Стиль для AntD-tooltip над DateLabel: на тёмном фоне dashboard'а
     дефолтный tooltip визуально сливается. Добавляем явный bg, бордер
     и тень из DS-токенов, чтобы tooltip читался как «всплывающий
     info-блок», а не часть фона. */
  const tooltipInnerStyle = useMemo(
    () => ({
      background: theme.colorBgElevated,
      color: theme.colorText,
      border: `1px solid ${theme.colorBorder}`,
      borderRadius: theme.borderRadius,
      boxShadow: theme.boxShadow,
      padding: `${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px`,
    }),
    [theme],
  );
  const [labelRef, labelIsTruncated] = useCSSTextTruncation<HTMLSpanElement>();

  useEffect(() => {
    if (value === NO_TIME_RANGE) {
      setActualTimeRange(NO_TIME_RANGE);
      setTooltipTitle(null);
      setValidTimeRange(true);
      return;
    }
    fetchTimeRange(value).then(({ value: actualRange, error }) => {
      if (error) {
        setEvalResponse(error || '');
        setValidTimeRange(false);
        setTooltipTitle(value || null);
      } else {
        /*
          HRT == human readable text
          ADR == actual datetime range
          +--------------+------+----------+--------+----------+-----------+
          |              | Last | Previous | Custom | Advanced | No Filter |
          +--------------+------+----------+--------+----------+-----------+
          | control pill | HRT  | HRT      | ADR    | ADR      |   HRT     |
          +--------------+------+----------+--------+----------+-----------+
          | tooltip      | ADR  | ADR      | HRT    | HRT      |   ADR     |
          +--------------+------+----------+--------+----------+-----------+
        */
        /* formatADR парсит ADR ("ISO ≤ col < ISO") в короткое
           "дд.ММ.гггг — дд.ММ.гггг"; не-ADR строки возвращаются как
           есть (HRT-выражения вроде DATEADD остаются нетронутыми). */
        const shortRange = formatADR(actualRange);
        if (
          guessedFrame === 'Common' ||
          guessedFrame === 'Calendar' ||
          guessedFrame === 'Current' ||
          guessedFrame === 'No filter'
        ) {
          setActualTimeRange(value);
          setTooltipTitle(getTooltipTitle(labelIsTruncated, value, shortRange));
        } else {
          setActualTimeRange(shortRange || '');
          setTooltipTitle(getTooltipTitle(labelIsTruncated, shortRange, value));
        }
        setValidTimeRange(true);
      }
      setLastFetchedTimeRange(value);
      setEvalResponse(actualRange || value);
    });
  }, [guessedFrame, labelIsTruncated, labelRef, value]);

  useDebouncedEffect(
    () => {
      if (timeRangeValue === NO_TIME_RANGE) {
        setEvalResponse(NO_TIME_RANGE);
        setLastFetchedTimeRange(NO_TIME_RANGE);
        setValidTimeRange(true);
        return;
      }
      if (lastFetchedTimeRange !== timeRangeValue) {
        fetchTimeRange(timeRangeValue).then(({ value: actualRange, error }) => {
          if (error) {
            setEvalResponse(error || '');
            setValidTimeRange(false);
          } else {
            setEvalResponse(actualRange || '');
            setValidTimeRange(true);
          }
          setLastFetchedTimeRange(timeRangeValue);
        });
      }
    },
    Constants.SLOW_DEBOUNCE,
    [timeRangeValue],
  );

  function onSave() {
    onChange(timeRangeValue);
    setShow(false);
    onClosePopover();
  }

  function onOpen() {
    setTimeRangeValue(value);
    setFrame(guessedFrame);
    setShow(true);
    onOpenPopover();
  }

  function onHide() {
    setTimeRangeValue(value);
    setFrame(guessedFrame);
    setShow(false);
    onClosePopover();
  }

  const toggleOverlay = () => {
    if (show) {
      onHide();
    } else {
      onOpen();
    }
  };

  function onChangeFrame(value: FrameType) {
    if (value === NO_TIME_RANGE) {
      setTimeRangeValue(NO_TIME_RANGE);
    }
    setFrame(value);
  }

  const overlayContent = (
    <ContentStyleWrapper>
      <div className="control-label">{t('Range type')}</div>
      <StyledRangeType
        ariaLabel={t('Range type')}
        options={FRAME_OPTIONS}
        value={frame}
        onChange={onChangeFrame}
        /* Portal в document.body: внутри Modal'а dropdown
           обрезается высотой Modal-body и flip'ается вверх,
           ломая layout. document.body снимает clipping. */
        getPopupContainer={() => document.body}
      />
      {frame !== 'No filter' && <Divider />}
      {frame === 'Common' && (
        <CommonFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Calendar' && (
        <CalendarFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Current' && (
        <CurrentCalendarFrame
          value={timeRangeValue}
          onChange={setTimeRangeValue}
        />
      )}
      {frame === 'Advanced' && (
        <AdvancedFrame value={timeRangeValue} onChange={setTimeRangeValue} />
      )}
      {frame === 'Custom' && (
        <CustomFrame
          value={timeRangeValue}
          onChange={setTimeRangeValue}
          isOverflowingFilterBar={isOverflowingFilterBar}
        />
      )}
      {frame === 'No filter' && <div data-test={DateFilterTestKey.NoFilter} />}
      <Divider />
      <div>
        <div className="section-title">{t('Actual time range')}</div>
        {validTimeRange && (
          <div>
            {evalResponse === 'No filter' ? t('No filter') : evalResponse}
          </div>
        )}
        {!validTimeRange && (
          <IconWrapper className="warning">
            <Icons.ExclamationCircleOutlined iconColor={theme.colorError} />
            <span className="text error">{evalResponse}</span>
          </IconWrapper>
        )}
      </div>
      <Divider />
      <div className="footer">
        <Button
          buttonStyle="secondary"
          cta
          key="cancel"
          onClick={onHide}
          data-test={DateFilterTestKey.CancelButton}
        >
          {t('CANCEL')}
        </Button>
        <Button
          buttonStyle="primary"
          cta
          disabled={!validTimeRange}
          key="apply"
          onClick={onSave}
          data-test={DateFilterTestKey.ApplyButton}
        >
          {t('APPLY')}
        </Button>
      </div>
    </ContentStyleWrapper>
  );

  const popoverContent = (
    <ControlPopover
      autoAdjustOverflow={false}
      trigger="click"
      placement="right"
      content={overlayContent}
      title={
        <IconWrapper>
          <Icons.EditOutlined />
          <span className="text">{t('Edit time range')}</span>
        </IconWrapper>
      }
      defaultOpen={show}
      open={show}
      onOpenChange={toggleOverlay}
      overlayStyle={{ width: '600px', maxWidth: 'calc(100vw - 16px)' }}
      destroyTooltipOnHide
      getPopupContainer={nodeTrigger =>
        isOverflowingFilterBar
          ? (nodeTrigger.parentNode as HTMLElement)
          : document.body
      }
      overlayClassName="time-range-popover"
    >
      <Tooltip
        placement="top"
        title={tooltipTitle}
        overlayClassName="time-range-pill-tooltip"
        overlayInnerStyle={tooltipInnerStyle}
      >
        <DateLabel
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          label={actualTimeRange}
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.PopoverOverlay}
          ref={labelRef}
        />
      </Tooltip>
    </ControlPopover>
  );

  /* Modal-вариант для filter-drawer'а: trigger остаётся тот же DateLabel,
     но overlayContent рендерится внутри центральной Modal с backdrop.
     Cancel/Apply кнопки внутри overlayContent (см. footer выше) уже
     управляют тем же `show` state — onSave/onHide работают для обоих
     режимов одинаково. Modal-backdrop изолирует click-пространство,
     поэтому Shell-drawer не принимает Apply-клик за «клик снаружи» и
     не закрывается. */
  const modalContent = (
    <>
      <Tooltip
        placement="top"
        title={tooltipTitle}
        overlayClassName="time-range-pill-tooltip"
        overlayInnerStyle={tooltipInnerStyle}
      >
        <DateLabel
          onClick={toggleOverlay}
          name={name}
          aria-labelledby={`filter-name-${props.name}`}
          aria-describedby={`date-label-${props.name}`}
          label={actualTimeRange}
          isActive={show}
          isPlaceholder={actualTimeRange === NO_TIME_RANGE}
          data-test={DateFilterTestKey.PopoverOverlay}
          ref={labelRef}
        />
      </Tooltip>
      <Modal
        show={show}
        onHide={onHide}
        title={
          <IconWrapper>
            <Icons.EditOutlined />
            <span className="text">{t('Edit time range')}</span>
          </IconWrapper>
        }
        width={880}
        centered
        destroyOnHidden
        hideFooter
        name="time-range-modal"
      >
        {overlayContent}
      </Modal>
    </>
  );

  return (
    <>
      <ControlHeader {...props} />
      {overlayMode === 'modal' ? modalContent : popoverContent}
    </>
  );
}
