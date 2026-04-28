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
import { LegendOrientation } from './types';

// DS v2.0: дефолтный grid с симметричными отступами вместо «прижатого к краям»
// 8% / 4% / 12% / 12% — даёт воздух меткам осей и легенде.
// Конкретные плагины могут переопределить через spread:
// `{ ...defaultGrid, ...padding }` или `{ ...defaultGrid, top: ... }`.
export const defaultGrid = {
  left: '8%',
  right: '4%',
  top: '12%',
  bottom: '12%',
  containLabel: true,
};

export const defaultYAxis = {
  scale: true,
  yAxisLabelRotation: 0,
};

export const defaultXAxis = {
  xAxisLabelRotation: 0,
  xAxisLabelInterval: 'auto',
};

export const defaultLegendPadding = {
  [LegendOrientation.Top]: 20,
  [LegendOrientation.Bottom]: 20,
  [LegendOrientation.Left]: 170,
  [LegendOrientation.Right]: 170,
};
