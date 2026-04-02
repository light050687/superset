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
import { DataMaskState } from '@superset-ui/core';

export interface FilterPreset {
  id: number;
  uuid: string | null;
  name: string;
  description?: string | null;
  filterData: DataMaskState;
  includedFilters: string[];
  isAdminPreset: boolean;
  isShared: boolean;
  isDefault: boolean;
  isOwn: boolean;
  createdBy: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
  createdOn: string | null;
}

export interface FilterPresetExport {
  version: number;
  name: string;
  description?: string | null;
  filterData: DataMaskState;
  includedFilters: string[];
  metadata: {
    createdBy: string;
    createdAt: string | null;
  };
}

export interface CreatePresetPayload {
  name: string;
  description?: string;
  filter_data: DataMaskState;
  included_filters: string[];
  is_admin_preset?: boolean;
  is_shared?: boolean;
}

export interface UpdatePresetPayload {
  name?: string;
  description?: string;
  filter_data?: DataMaskState;
  included_filters?: string[];
  is_shared?: boolean;
}
