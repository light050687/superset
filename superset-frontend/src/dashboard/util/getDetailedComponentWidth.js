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
import findParentId from './findParentId';
import { GRID_MIN_COLUMN_COUNT, GRID_COLUMN_COUNT } from './constants';
import {
  ROW_TYPE,
  COLUMN_TYPE,
  MARKDOWN_TYPE,
  CHART_TYPE,
  DYNAMIC_TYPE,
} from './componentTypes';

/* В проекте у чартов три режима размера (см. resizeComponent в
   actions/dashboardLayout.js): col (legacy meta.width 1..12), sub
   (meta.widthSub субячеек при meta.subdivisionsUsed на колонку) и
   free (пиксельные meta.freePxWidth/Height). Для расчёта capacity
   row'a надо приводить sub-режим к legacy-эквиваленту, иначе три
   sub-чарта с widthSub=11/sub=5 (~2.2 col каждый, ~6.6 суммарно)
   ошибочно считаются 4+4+4=12 и блокируют новый drop. Free-режим
   зависит от пиксельной ширины контейнера, поэтому fall back на
   meta.width (он сохраняется при конвертации в free). */
function getChildEffectiveWidth(child) {
  const meta = child.meta || {};
  if (meta.layoutMode === 'sub' && meta.widthSub && meta.subdivisionsUsed) {
    return meta.widthSub / meta.subdivisionsUsed;
  }
  return meta.width || 0;
}

function getTotalChildWidth({ id, components }) {
  const component = components[id];
  if (!component) return 0;

  let width = 0;

  (component.children || []).forEach(childId => {
    width += getChildEffectiveWidth(components[childId] || {});
  });

  return width;
}

export default function getDetailedComponentWidth({
  // pass either an id, or a component
  id,
  component: passedComponent,
  components = {},
}) {
  const result = {
    width: undefined,
    occupiedWidth: undefined,
    minimumWidth: undefined,
  };

  const component = passedComponent || components[id];
  if (!component) return result;

  // note these remain as undefined if the component has no defined width
  result.width = (component.meta || {}).width;
  result.occupiedWidth = result.width;

  if (component.type === ROW_TYPE) {
    // not all rows have width 12, e
    result.width =
      getDetailedComponentWidth({
        id: findParentId({
          childId: component.id,
          layout: components,
        }),
        components,
      }).width || GRID_COLUMN_COUNT;
    result.occupiedWidth = getTotalChildWidth({ id: component.id, components });
    result.minimumWidth = result.occupiedWidth || GRID_MIN_COLUMN_COUNT;
  } else if (component.type === COLUMN_TYPE) {
    // find the width of the largest child, only rows count
    result.minimumWidth = GRID_MIN_COLUMN_COUNT;
    result.occupiedWidth = 0;
    (component.children || []).forEach(childId => {
      // rows don't have widths, so find the width of its children
      if (components[childId].type === ROW_TYPE) {
        result.minimumWidth = Math.max(
          result.minimumWidth,
          getTotalChildWidth({ id: childId, components }),
        );
      }
    });
  } else if (
    component.type === DYNAMIC_TYPE ||
    component.type === MARKDOWN_TYPE ||
    component.type === CHART_TYPE
  ) {
    result.minimumWidth = GRID_MIN_COLUMN_COUNT;
  }

  return result;
}
