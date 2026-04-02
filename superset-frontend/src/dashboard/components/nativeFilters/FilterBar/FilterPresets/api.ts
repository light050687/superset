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
import { SupersetClient, logging } from '@superset-ui/core';
import {
  CreatePresetPayload,
  FilterPreset,
  FilterPresetExport,
  UpdatePresetPayload,
} from './types';

const BASE = (dashboardId: number | string) =>
  `/api/v1/dashboard/${dashboardId}/presets`;

/** Convert snake_case API response to camelCase FilterPreset. */
function toPreset(raw: Record<string, unknown>): FilterPreset {
  const createdBy = raw.created_by as Record<string, unknown> | null;
  return {
    id: raw.id as number,
    uuid: (raw.uuid as string) ?? null,
    name: raw.name as string,
    description: raw.description as string | null,
    filterData: (raw.filter_data ?? {}) as FilterPreset['filterData'],
    includedFilters: (raw.included_filters ?? []) as string[],
    isAdminPreset: (raw.is_admin_preset ?? false) as boolean,
    isShared: (raw.is_shared ?? true) as boolean,
    isDefault: (raw.is_default ?? false) as boolean,
    isOwn: (raw.is_own ?? false) as boolean,
    createdBy: {
      id: (createdBy?.id ?? 0) as number,
      firstName: (createdBy?.first_name ?? null) as string | null,
      lastName: (createdBy?.last_name ?? null) as string | null,
    },
    createdOn: (raw.created_on ?? null) as string | null,
  };
}

export async function fetchPresets(
  dashboardId: number | string,
  query?: string,
): Promise<FilterPreset[]> {
  try {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    const { json } = await SupersetClient.get({
      endpoint: `${BASE(dashboardId)}${params}`,
    });
    return (json?.result ?? []).map((p: Record<string, unknown>) =>
      toPreset(p),
    );
  } catch (err) {
    logging.error('Error fetching presets', err);
    return [];
  }
}

export async function createPreset(
  dashboardId: number | string,
  data: CreatePresetPayload,
): Promise<{ id: number; uuid: string } | null> {
  try {
    const { json } = await SupersetClient.post({
      endpoint: BASE(dashboardId),
      jsonPayload: data,
    });
    return json as { id: number; uuid: string };
  } catch (err: unknown) {
    // Extract status from SupersetClient error
    const status = (err as { status?: number })?.status;
    if (status === 409) {
      throw new Error('Пресет с таким названием уже существует');
    }
    logging.error('Error creating preset', err);
    throw err;
  }
}

export async function updatePreset(
  dashboardId: number | string,
  presetId: number,
  data: UpdatePresetPayload,
): Promise<void> {
  try {
    await SupersetClient.put({
      endpoint: `${BASE(dashboardId)}/${presetId}`,
      jsonPayload: data,
    });
  } catch (err) {
    logging.error('Error updating preset', err);
    throw err;
  }
}

export async function deletePreset(
  dashboardId: number | string,
  presetId: number,
): Promise<void> {
  try {
    await SupersetClient.delete({
      endpoint: `${BASE(dashboardId)}/${presetId}`,
    });
  } catch (err) {
    logging.error('Error deleting preset', err);
    throw err;
  }
}

export async function setDefaultPreset(
  dashboardId: number | string,
  presetId: number,
): Promise<void> {
  try {
    await SupersetClient.post({
      endpoint: `${BASE(dashboardId)}/${presetId}/set-default`,
    });
  } catch (err) {
    logging.error('Error setting default preset', err);
    throw err;
  }
}

export async function removeDefaultPreset(
  dashboardId: number | string,
): Promise<void> {
  try {
    await SupersetClient.delete({
      endpoint: `${BASE(dashboardId)}/default`,
    });
  } catch (err) {
    logging.error('Error removing default preset', err);
    throw err;
  }
}

export async function fetchDefaultPreset(
  dashboardId: number | string,
): Promise<FilterPreset | null> {
  try {
    const { json } = await SupersetClient.get({
      endpoint: `${BASE(dashboardId)}/default`,
    });
    if (!json?.result) return null;
    return toPreset(json.result as Record<string, unknown>);
  } catch (err) {
    logging.error('Error fetching default preset', err);
    return null;
  }
}

export async function hidePreset(
  dashboardId: number | string,
  presetId: number,
): Promise<void> {
  try {
    await SupersetClient.post({
      endpoint: `${BASE(dashboardId)}/${presetId}/hide`,
    });
  } catch (err) {
    logging.error('Error hiding preset', err);
    throw err;
  }
}

export async function unhidePreset(
  dashboardId: number | string,
  presetId: number,
): Promise<void> {
  try {
    await SupersetClient.delete({
      endpoint: `${BASE(dashboardId)}/${presetId}/hide`,
    });
  } catch (err) {
    logging.error('Error unhiding preset', err);
    throw err;
  }
}

export async function exportPreset(
  dashboardId: number | string,
  presetId: number,
): Promise<FilterPresetExport | null> {
  try {
    const { json } = await SupersetClient.get({
      endpoint: `${BASE(dashboardId)}/${presetId}/export`,
    });
    return (json?.result ?? null) as FilterPresetExport | null;
  } catch (err) {
    logging.error('Error exporting preset', err);
    return null;
  }
}

export async function importPreset(
  dashboardId: number | string,
  data: FilterPresetExport,
): Promise<{ id: number; uuid: string } | null> {
  try {
    const { json } = await SupersetClient.post({
      endpoint: `${BASE(dashboardId)}/import`,
      jsonPayload: data,
    });
    return json as { id: number; uuid: string };
  } catch (err) {
    logging.error('Error importing preset', err);
    throw err;
  }
}
