/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Контекст для DateFilterLabel: каким overlay'ем открывать
 * «Edit time range» — sidebar-popover'ом (как в Explore chart settings,
 * default) или центральной Modal с backdrop (как в FiltersDrawer
 * dashboard'а, где popover портально вылетает в document.body и его
 * apply-клик принимается Shell-drawer'ом за «клик снаружи» → drawer
 * закрывается).
 *
 * Используется FilterBar внутри FiltersDrawer'а — он оборачивает
 * содержимое в `<DateFilterOverlayContext.Provider value="modal">`.
 * Explore чарты не оборачивают → дефолт 'popover' сохраняется.
 */
import { createContext } from 'react';

export type DateFilterOverlayMode = 'popover' | 'modal';

export const DateFilterOverlayContext =
  createContext<DateFilterOverlayMode>('popover');
