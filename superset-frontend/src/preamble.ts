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

/**
 * Backport of upstream PR #36893 — fix(i18n): ensure language pack loads
 * before React renders. Adapted for our fork's import paths (@superset-ui/core).
 *
 * Key change: preamble is now an async `initPreamble()` function that
 * views/index.tsx awaits BEFORE ReactDOM.render(). This eliminates the
 * English "flash" on first load — language pack is fetched and configured
 * before any React component renders.
 */
import dayjs from 'dayjs';
// eslint-disable-next-line no-restricted-imports
import {
  configure,
  makeApi,
  initFeatureFlags,
  LanguagePack,
} from '@superset-ui/core';
import setupClient from './setup/setupClient';
import setupColors from './setup/setupColors';
import setupFormatters from './setup/setupFormatters';
import setupDashboardComponents from './setup/setupDashboardComponents';
import { User } from './types/bootstrapTypes';
import getBootstrapData, { applicationRoot } from './utils/getBootstrapData';
import './hooks/useLocale';

let initPromise: Promise<void> | null = null;

const LANGUAGE_PACK_REQUEST_TIMEOUT_MS = 5000;

export default function initPreamble(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    configure();

    // Grab initial bootstrap data
    const bootstrapData = getBootstrapData();

    setupFormatters(
      bootstrapData.common.d3_format,
      bootstrapData.common.d3_time_format,
    );

    // Setup SupersetClient early so we can fetch language pack
    setupClient({ appRoot: applicationRoot() });

    // Load language pack BEFORE rendering (upstream PR #36893)
    // Use native fetch to avoid race condition with SupersetClient initialization
    const lang = bootstrapData.common.locale || 'en';
    if (lang !== 'en') {
      const abortController = new AbortController();
      const timeoutId = window.setTimeout(() => {
        abortController.abort();
      }, LANGUAGE_PACK_REQUEST_TIMEOUT_MS);

      try {
        const resp = await fetch(`/superset/language_pack/${lang}/`, {
          signal: abortController.signal,
        });
        if (!resp.ok) {
          throw new Error(`Failed to fetch language pack: ${resp.status}`);
        }
        const json = await resp.json();
        configure({ languagePack: json as LanguagePack });
        dayjs.locale(lang);
      } catch (err) {
        console.warn(
          'Failed to fetch language pack, falling back to default.',
          err,
        );
        configure();
        dayjs.locale('en');
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    // Continue with rest of setup
    initFeatureFlags(bootstrapData.common.feature_flags);

    setupColors(
      bootstrapData.common.extra_categorical_color_schemes,
      bootstrapData.common.extra_sequential_color_schemes,
    );

    setupDashboardComponents();

    const getMe = makeApi<void, User>({
      method: 'GET',
      endpoint: '/api/v1/me/',
    });

    if (bootstrapData.user?.isActive) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          getMe().catch(() => {
            // SupersetClient will redirect to login on 401
          });
        }
      });
    }
  })().catch(err => {
    // Allow retry by clearing the cached promise on failure
    initPromise = null;
    throw err;
  });

  return initPromise;
}

// This module is prepended to multiple webpack entrypoints (see webpack.config.js).
// Kick off initialization eagerly, while still allowing entrypoints to `await` it
// before rendering when needed.
initPreamble().catch(err => {
  console.warn('Preamble initialization failed.', err);
});
