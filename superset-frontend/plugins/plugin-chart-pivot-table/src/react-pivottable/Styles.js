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

import { css, styled } from '@superset-ui/core';

export const Styles = styled.div`
  ${({ theme, isDashboardEditMode }) => css`
    /* DS v2.0 — Pivot Table v2 */
    table.pvtTable {
      position: ${isDashboardEditMode ? 'inherit' : 'relative'};
      width: calc(100% - ${theme.sizeUnit}px);
      font-size: 14px;
      text-align: left;
      margin: ${theme.sizeUnit}px;
      border-collapse: separate;
      border-spacing: 0;
      font-family: var(--f, ${theme.fontFamily});
      line-height: 1.4;
      color: var(--ink, ${theme.colorText});
    }

    table thead {
      background-color: var(--s, ${theme.colorBgBase});
      position: ${isDashboardEditMode ? 'inherit' : 'sticky'};
      top: 0;
    }

    table tbody tr {
      font-feature-settings: 'tnum' 1;
      font-variant-numeric: tabular-nums;
    }

    /* Заголовки cols/rows — DS v2.0: JetBrains Mono UPPERCASE 11px */
    table.pvtTable thead tr th,
    table.pvtTable tbody tr th {
      border-top: 1px solid var(--g200, ${theme.colorSplit});
      border-left: 1px solid var(--g200, ${theme.colorSplit});
      font-family: var(--m, ${theme.fontFamily});
      font-size: 11px;
      padding: 8px 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--g700, ${theme.colorText});
    }

    /* Row labels внутри tbody — могут быть текстовыми, оставляем Manrope без uppercase
       (это не col/row header, это значения rows-измерения). */
    table.pvtTable tbody tr th.pvtRowLabel {
      font-family: var(--f, ${theme.fontFamily});
      font-size: 14px;
      text-transform: none;
      letter-spacing: normal;
      font-weight: 500;
      color: var(--ink, ${theme.colorText});
    }

    table.pvtTable tbody tr.pvtRowTotals {
      position: ${isDashboardEditMode ? 'inherit' : 'sticky'};
      bottom: 0;
      background-color: ${theme.colorBgBase};
    }

    table.pvtTable tbody tr.pvtRowTotals th,
    table.pvtTable tbody tr.pvtRowTotals td {
      background-color: ${theme.colorBgBase};
    }

    table.pvtTable thead tr:last-of-type th,
    table.pvtTable thead tr:first-of-type th.pvtTotalLabel,
    table.pvtTable thead tr:nth-last-of-type(2) th.pvtColLabel,
    table.pvtTable thead th.pvtSubtotalLabel,
    table.pvtTable tbody tr:last-of-type th,
    table.pvtTable tbody tr:last-of-type td {
      border-bottom: 1px solid ${theme.colorSplit};
    }

    table.pvtTable
      thead
      tr:last-of-type:not(:only-child)
      th.pvtAxisLabel
      ~ th.pvtColLabel,
    table.pvtTable tbody tr:first-of-type th,
    table.pvtTable tbody tr:first-of-type td {
      border-top: none;
    }

    table.pvtTable tbody tr td:last-of-type,
    table.pvtTable thead tr th:last-of-type:not(.pvtSubtotalLabel) {
      border-right: 1px solid ${theme.colorSplit};
    }

    table.pvtTable
      thead
      tr:last-of-type:not(:only-child)
      th.pvtAxisLabel
      + .pvtTotalLabel {
      border-right: none;
    }

    table.pvtTable tr th.active {
      background-color: var(--c-sky, ${theme.colorPrimaryBg});
      color: var(--s, ${theme.colorBgBase});
    }

    table.pvtTable .pvtTotalLabel {
      text-align: right;
      font-weight: ${theme.fontWeightStrong};
    }

    table.pvtTable .pvtSubtotalLabel {
      font-weight: ${theme.fontWeightStrong};
    }

    /* Числовые ячейки — JetBrains Mono, tabular-nums, padding 8px 12px */
    table.pvtTable tbody tr td {
      color: var(--ink, ${theme.colorPrimaryText});
      padding: 8px 12px;
      background-color: var(--s, ${theme.colorBgBase});
      border-top: 1px solid var(--g100, ${theme.colorSplit});
      border-left: 1px solid var(--g100, ${theme.colorSplit});
      vertical-align: top;
      text-align: right;
      font-family: var(--m, ${theme.fontFamily});
      font-variant-numeric: tabular-nums;
      font-size: 14px;
    }

    table.pvtTable tbody tr th.pvtRowLabel {
      vertical-align: baseline;
    }

    .pvtTotal,
    .pvtGrandTotal {
      font-weight: ${theme.fontWeightStrong};
    }

    table.pvtTable tbody tr td.pvtRowTotal {
      vertical-align: middle;
    }

    .toggle-wrapper {
      white-space: nowrap;
    }

    .toggle-wrapper > .toggle-val {
      white-space: normal;
    }

    .toggle {
      padding-right: ${theme.sizeUnit}px;
      cursor: pointer;
    }

    .hoverable:hover {
      background-color: var(--g50, ${theme.colorPrimaryBgHover});
      cursor: pointer;
    }
  `}
`;
