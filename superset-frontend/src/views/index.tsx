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
import 'src/public-path';
// RO throttle shim disabled — suspected of swallowing the resize
// callback on large-delta window resize (monitor/preset switch),
// leaving ECharts canvases stretched/cropped at the old size. See
// the bug report with screenshots from 2026-04-21.
// import 'src/bootstrap/resizeObserverShim';
import 'src/suppressWarnings';

import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import initPreamble from '../preamble';
import App from './App';

/**
 * Wrapper, который ремонтирует <App /> через key-bump, когда
 * SettingsDropdown (или что-то ещё) триггерит переключение языка.
 * Ремонтирование без reload — переводы уже обновлены через
 * configure({languagePack}) в обработчике, key-change просто
 * заставляет все компоненты перечитать t() с новым словарём.
 * Плюс не происходит flash (нет navigation), минус — теряется
 * локальный state компонентов (сознательный trade-off, как и у reload).
 */
const AppWithLangSwitch = () => {
  const [langKey, setLangKey] = useState(0);
  useEffect(() => {
    const handler = () => setLangKey(k => k + 1);
    window.addEventListener('superset:lang-changed', handler);
    return () => window.removeEventListener('superset:lang-changed', handler);
  }, []);
  return <App key={langKey} />;
};

// Await language pack loading before first render (upstream PR #36893)
// This prevents the English "flash" when BABEL_DEFAULT_LOCALE != 'en'.
(async () => {
  try {
    await initPreamble();
  } finally {
    // Always render the app, even if preamble fails
    const container = document.getElementById('app');
    if (container) createRoot(container).render(<AppWithLangSwitch />);
  }
})();
