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
import { DashboardInfo } from 'src/dashboard/types';

/**
 * DS v2.0: вместо стандартного MetadataBar (требует минимум 2 items и
 * показывает Owner + LastModified) — возвращаем простой <span> только
 * с changed_on_delta_humanized ("час назад"). Owner убран — он уже виден
 * в профиле справа в floating dock (SA avatar). CSS-селектор
 * [data-test='metadata-bar'] сохранён, чтобы стили из Header/index.jsx
 * (typography + margin-left: auto) продолжали работать.
 */
export const useDashboardMetadataBar = (dashboardInfo: DashboardInfo) => (
  <span data-test="metadata-bar" className="metadata-text">
    {dashboardInfo.changed_on_delta_humanized}
  </span>
);
