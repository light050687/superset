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
 * @deprecated Перенесено в BuilderPanel.tsx. «Конструктор» стал
 * «Библиотекой» — плавающим окном с механикой drag/resize/reset
 * (как DevToolsPanel), вместо bottom-sheet drawer'а. Этот файл
 * оставлен как stub, чтобы существующий PR/историю не ломать;
 * импорт через index.ts заменён на `BuilderPanel`.
 */
export { BuilderPanel as BuilderDrawer } from './BuilderPanel';
