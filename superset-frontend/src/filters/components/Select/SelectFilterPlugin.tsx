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
/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSection,
  DataMask,
  ensureIsArray,
  ExtraFormData,
  GenericDataType,
  getColumnLabel,
  JsonObject,
  finestTemporalGrainFormatter,
  t,
  tn,
  styled,
} from '@superset-ui/core';
import { isUndefined } from 'lodash';
import { useSelector } from 'react-redux';
import { useImmerReducer } from 'use-immer';
import { FormItem, Select, Space } from '@superset-ui/core/components';
import { hasOption } from '@superset-ui/core/components/Select/utils';
import { FilterBarOrientation, RootState } from 'src/dashboard/types';
import { getDataRecordFormatter, getSelectExtraFormData } from '../../utils';
import { FilterPluginStyle, StatusMessage } from '../common';
import { PluginFilterSelectProps, SelectValue } from './types';
import { FilterValueModalSelect } from './FilterValueModal';

type DataMaskAction =
  | { type: 'ownState'; ownState: JsonObject }
  | {
      type: 'filterState';
      extraFormData: ExtraFormData;
      filterState: {
        value: SelectValue;
        label?: string;
        excludeFilterValues?: boolean;
      };
    };

function reducer(draft: DataMask, action: DataMaskAction) {
  switch (action.type) {
    case 'ownState':
      draft.ownState = {
        ...draft.ownState,
        ...action.ownState,
      };
      return draft;
    case 'filterState':
      if (
        JSON.stringify(draft.extraFormData) !==
        JSON.stringify(action.extraFormData)
      ) {
        draft.extraFormData = action.extraFormData;
      }
      if (
        JSON.stringify(draft.filterState) !== JSON.stringify(action.filterState)
      ) {
        draft.filterState = { ...draft.filterState, ...action.filterState };
      }

      return draft;
    default:
      return draft;
  }
}

// `shouldForwardProp` keeps style-driver props out of the rendered DOM
// element. AntD v6 + Emotion v11 don't auto-filter unknown props, so leaks
// like `appSection="embedded"` or `inverseSelection={true}` would otherwise
// show up as DOM attributes and trigger React warnings.
const StyledSpace = styled(Space, {
  shouldForwardProp: prop =>
    prop !== 'inverseSelection' && prop !== 'appSection',
})<{
  inverseSelection: boolean;
  appSection: AppSection;
}>`
  display: flex;
  align-items: center;
  width: 100%;

  .exclude-select {
    width: 80px;
    flex-shrink: 0;
  }

  &.ant-space {
    .ant-space-item {
      width: ${({ inverseSelection }) => (!inverseSelection ? '100%' : 'auto')};
    }
  }
`;

// Keep track of orientation changes outside component with filter ID
const orientationMap = new Map<string, FilterBarOrientation>();

export default function PluginFilterSelect(props: PluginFilterSelectProps) {
  const {
    coltypeMap,
    data,
    filterState,
    formData,
    height,
    isRefreshing,
    width,
    setDataMask,
    /* setHoveredFilter / setFocusedFilter / unsetFocusedFilter /
       setFilterActive / parentRef / inputRef / showOverflow /
       sortComparator / creatable / showSearch — больше не используем,
       заменили AntD Select на FilterValueModalSelect, которая не
       пробрасывает hover/focus/serverSearch events наружу. */
    appSection,
    filterBarOrientation,
    clearAllTrigger,
    onClearAllComplete,
  } = props;
  const {
    enableEmptyFilter,
    multiSelect,
    inverseSelection,
    defaultToFirstItem,
  } = formData;

  const groupby = useMemo(
    () => ensureIsArray(formData.groupby).map(getColumnLabel),
    [formData.groupby],
  );
  const [col] = groupby;
  /* initialColtypeMap был для server-side search ownState dispatch.
     В FilterValueModal не используется. */
  const [search, setSearch] = useState('');
  const isChangedByUser = useRef(false);
  const prevDataRef = useRef(data);
  const [dataMask, dispatchDataMask] = useImmerReducer(reducer, {
    extraFormData: {},
    filterState,
  });
  const datatype: GenericDataType = coltypeMap[col];
  const labelFormatter = useMemo(
    () =>
      getDataRecordFormatter({
        timeFormatter: finestTemporalGrainFormatter(data.map(el => el[col])),
      }),
    [data, col],
  );
  const [excludeFilterValues, setExcludeFilterValues] = useState(
    isUndefined(filterState?.excludeFilterValues)
      ? true
      : filterState?.excludeFilterValues,
  );

  const prevExcludeFilterValues = useRef(excludeFilterValues);

  const hasOnlyOrientationChanged = useRef(false);

  /* Имя фильтра (для заголовка FilterValueModalSelect). Достаём из Redux
     по nativeFilterId — у плагина в formData есть только id, а имя
     живёт в native_filter_configuration на уровне фильтра. */
  const filterName = useSelector<RootState, string>(state => {
    const f = (state as any).nativeFilters?.filters?.[formData.nativeFilterId];
    return f && typeof f === 'object' && 'name' in f ? String(f.name) : '';
  });

  useEffect(() => {
    // Get previous orientation for this specific filter
    const previousOrientation = orientationMap.get(formData.nativeFilterId);

    // Check if only orientation changed for this filter
    if (
      previousOrientation !== undefined &&
      previousOrientation !== filterBarOrientation
    ) {
      hasOnlyOrientationChanged.current = true;
    } else {
      hasOnlyOrientationChanged.current = false;
    }

    // Update orientation for this filter
    if (filterBarOrientation) {
      orientationMap.set(formData.nativeFilterId, filterBarOrientation);
    }
  }, [filterBarOrientation]);

  const updateDataMask = useCallback(
    (values: SelectValue) => {
      const emptyFilter =
        enableEmptyFilter && !inverseSelection && !values?.length;

      const suffix = inverseSelection && values?.length ? t(' (excluded)') : '';
      dispatchDataMask({
        type: 'filterState',
        extraFormData: getSelectExtraFormData(
          col,
          values,
          emptyFilter,
          excludeFilterValues && inverseSelection,
        ),
        filterState: {
          ...filterState,
          label: values?.length
            ? `${(values || [])
                .map(value => labelFormatter(value, datatype))
                .join(', ')}${suffix}`
            : undefined,
          value:
            appSection === AppSection.FilterConfigModal && defaultToFirstItem
              ? undefined
              : values,
          excludeFilterValues,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      appSection,
      col,
      datatype,
      defaultToFirstItem,
      dispatchDataMask,
      enableEmptyFilter,
      inverseSelection,
      excludeFilterValues,
      JSON.stringify(filterState),
      labelFormatter,
    ],
  );

  const isDisabled =
    appSection === AppSection.FilterConfigModal && defaultToFirstItem;

  /* Раньше: onSearch (debounce → setSearch + dispatchDataMask ownState
     для serverSide search). FilterValueModalSelect делает локальный
     search внутри модалки, поэтому AntD-Select-style onSearch не нужен.
     Если в будущем включим searchAllOptions=true (server-side), нужно
     прокинуть search-callback из FilterValueModal обратно сюда. */
  const handleChange = useCallback(
    (value?: SelectValue | number | string) => {
      const values = value === null ? [null] : ensureIsArray(value);

      if (values.length === 0) {
        updateDataMask(null);
      } else {
        updateDataMask(values);
      }

      isChangedByUser.current = true;
    },
    [updateDataMask, formData.nativeFilterId, clearAllTrigger],
  );

  const placeholderText =
    data.length === 0
      ? t('No data')
      : tn('%s option', '%s options', data.length, data.length);

  const formItemExtra = useMemo(() => {
    if (filterState.validateMessage) {
      return (
        <StatusMessage status={filterState.validateStatus}>
          {filterState.validateMessage}
        </StatusMessage>
      );
    }
    return undefined;
  }, [filterState.validateMessage, filterState.validateStatus]);

  const uniqueOptions = useMemo(() => {
    const allOptions = new Set([...data.map(el => el[col])]);
    return [...allOptions].map((value: string) => {
      /* null / undefined / <NULL>-строка из backend'а → русифицированный
         плейсхолдер "(пусто)". Сам value сохраняем как есть, чтобы
         сравнение значений на стороне сервера осталось корректным. */
      const rawLabel = labelFormatter(value, datatype);
      const isNullish =
        value === null || value === undefined || rawLabel === '<NULL>';
      return {
        label: isNullish ? t('(пусто)') : rawLabel,
        value,
        isNewOption: false,
      };
    });
  }, [data, datatype, col, labelFormatter]);

  const options = useMemo(() => {
    if (search && !multiSelect && !hasOption(search, uniqueOptions, true)) {
      uniqueOptions.unshift({
        label: search,
        value: search,
        isNewOption: true,
      });
    }
    return uniqueOptions;
  }, [multiSelect, search, uniqueOptions]);

  /* sortComparator был для AntD Select.sortComparator. FilterValueModal
     не поддерживает custom-sort сейчас — опции рендерятся в порядке
     прихода. backend-сортировка (sortMetric) сохраняется естественно
     через порядок в `data`. Если нужна frontend-сортировка по label —
     прокинем в FilterValueModalSelect в следующей итерации. */

  // Use effect for initialisation for filter plugin
  // this should run only once when filter is configured & saved
  // & shouldnt run when the component is remounted on change of
  // orientation of filter bar
  useEffect(() => {
    // Skip if only orientation changed
    if (hasOnlyOrientationChanged.current) {
      return;
    }

    // Case 1: Handle disabled state first
    if (isDisabled) {
      updateDataMask(null);
      return;
    }

    if (filterState.value !== undefined) {
      // Set the filter state value if it is defined
      updateDataMask(filterState.value);
      return;
    }

    // Handle the default to first Value case
    // Skip default values when clearAllTrigger is active to prevent
    // defaults from being applied during Clear All operation
    if (!clearAllTrigger) {
      if (defaultToFirstItem) {
        // Set to first item if defaultToFirstItem is true
        const firstItem: SelectValue = data[0]
          ? (groupby.map(col => data[0][col]) as string[])
          : null;
        if (firstItem?.[0] !== undefined) {
          updateDataMask(firstItem);
        }
      } else if (formData?.defaultValue) {
        // Handle defalut value case
        updateDataMask(formData.defaultValue);
      }
    }
  }, [
    isDisabled,
    enableEmptyFilter,
    defaultToFirstItem,
    formData?.defaultValue,
    data,
    groupby,
    col,
    inverseSelection,
    clearAllTrigger,
  ]);

  useEffect(() => {
    const prev = prevDataRef.current;
    const curr = data;

    const hasDataChanged =
      prev?.length !== curr?.length ||
      prev?.some((row, i) => {
        const prevVal = row[col];
        const currVal = curr[i][col];
        return typeof prevVal === 'bigint' || typeof currVal === 'bigint'
          ? prevVal?.toString() !== currVal?.toString()
          : prevVal !== currVal;
      });

    // If data actually changed (e.g., due to parent filter), reset flag
    if (hasDataChanged) {
      isChangedByUser.current = false;
      prevDataRef.current = data;
    }
  }, [data, col]);

  useEffect(() => {
    if (
      isChangedByUser.current &&
      filterState.value &&
      filterState.value.every((value?: any) =>
        data.some(row => row[col] === value),
      )
    )
      return;

    const firstItem: SelectValue = data[0]
      ? (groupby.map(col => data[0][col]) as string[])
      : null;

    // Skip default value update when clearAllTrigger is active
    if (
      !clearAllTrigger &&
      defaultToFirstItem &&
      Object.keys(formData?.extraFormData || {}).length &&
      filterState.value !== undefined &&
      firstItem !== null &&
      filterState.value !== firstItem
    ) {
      if (firstItem?.[0] !== undefined) {
        updateDataMask(firstItem);
      }
    }
  }, [
    defaultToFirstItem,
    updateDataMask,
    formData,
    data,
    JSON.stringify(filterState.value),
    isChangedByUser.current,
    clearAllTrigger,
  ]);

  useEffect(() => {
    setDataMask(dataMask);
  }, [JSON.stringify(dataMask)]);

  useEffect(() => {
    if (clearAllTrigger) {
      dispatchDataMask({
        type: 'filterState',
        extraFormData: {},
        filterState: {
          value: undefined,
          label: undefined,
        },
      });

      updateDataMask(null);
      setSearch('');
      onClearAllComplete?.(formData.nativeFilterId);
    }
  }, [clearAllTrigger, onClearAllComplete, updateDataMask]);

  useEffect(() => {
    if (prevExcludeFilterValues.current !== excludeFilterValues) {
      dispatchDataMask({
        type: 'filterState',
        extraFormData: getSelectExtraFormData(
          col,
          filterState.value,
          !filterState.value?.length,
          excludeFilterValues && inverseSelection,
        ),
        filterState: {
          ...(filterState as {
            value: SelectValue;
            label?: string;
            excludeFilterValues?: boolean;
          }),
          excludeFilterValues,
        },
      });
      prevExcludeFilterValues.current = excludeFilterValues;
    }
  }, [excludeFilterValues]);

  const handleExclusionToggle = (value: string) => {
    setExcludeFilterValues(value === 'true');
  };

  return (
    <FilterPluginStyle height={height} width={width}>
      <FormItem
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <StyledSpace
          appSection={appSection}
          inverseSelection={inverseSelection}
        >
          {appSection !== AppSection.FilterConfigModal && inverseSelection && (
            <Select
              className="exclude-select"
              value={`${excludeFilterValues}`}
              options={[
                { value: 'true', label: t('is not') },
                { value: 'false', label: t('is') },
              ]}
              onChange={handleExclusionToggle}
            />
          )}
          {/* Модальный селектор значений: trigger → Modal с поиском +
              чекбоксами + Apply/Cancel. См. FilterValueModal.tsx за
              мотивацию (drawer click-outside + comfort UI). Заменяет
              AntD Select для filter_select в Kanban drawer'е. */}
          <FilterValueModalSelect
            value={filterState.value as any[] | null | undefined}
            options={options}
            multiSelect={Boolean(multiSelect)}
            disabled={isDisabled}
            isRefreshing={isRefreshing}
            loading={isRefreshing}
            placeholder={placeholderText}
            title={filterName || placeholderText}
            onChange={values => handleChange(values)}
          />
        </StyledSpace>
      </FormItem>
    </FilterPluginStyle>
  );
}
