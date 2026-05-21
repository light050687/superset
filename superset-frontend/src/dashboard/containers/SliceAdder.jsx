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
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FeatureFlag, isFeatureEnabled } from '@superset-ui/core';
import { fetchSlices, updateSlices } from '../actions/sliceEntities';
import SliceAdder from '../components/SliceAdder';
import getChartIdsFromComponent from '../util/getChartIdsFromComponent';

/**
 * Когда включён feature flag ALLOW_DUPLICATE_CHARTS_PER_PAGE,
 * `selectedSliceIds` считаются ТОЛЬКО для активной страницы дашборда —
 * это позволяет один и тот же чарт класть на разные страницы (на одной
 * странице дубль по-прежнему запрещён, как требует UX-инвариант).
 *
 * Без флага — поведение апстрима: список чартов берётся из
 * dashboardState.sliceIds (всё что на дашборде в любом месте).
 */
function getSelectedSliceIds({ dashboardState, dashboardLayout }) {
  if (!isFeatureEnabled(FeatureFlag.AllowDuplicateChartsPerPage)) {
    return dashboardState.sliceIds;
  }
  const layout = dashboardLayout?.present;
  const { activePagePath } = dashboardState;
  // activePagePath: ['ROOT_ID', 'PAGES-...', 'PAGE-...'] — последний элемент
  // это id активной страницы. Если страниц нет (top-level layout без PAGES),
  // fallback на полный список — поведение апстрима.
  const activePageId = activePagePath?.[activePagePath.length - 1];
  if (!layout || !activePageId || !layout[activePageId]) {
    return dashboardState.sliceIds;
  }
  return getChartIdsFromComponent(activePageId, layout);
}

function mapStateToProps(
  { sliceEntities, dashboardInfo, dashboardState, dashboardLayout },
  ownProps,
) {
  return {
    height: ownProps.height,
    userId: +dashboardInfo.userId,
    dashboardId: dashboardInfo.id,
    selectedSliceIds: getSelectedSliceIds({ dashboardState, dashboardLayout }),
    slices: sliceEntities.slices,
    isLoading: sliceEntities.isLoading,
    errorMessage: sliceEntities.errorMessage,
    lastUpdated: sliceEntities.lastUpdated,
    editMode: dashboardState.editMode,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchSlices,
      updateSlices,
    },
    dispatch,
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SliceAdder);
