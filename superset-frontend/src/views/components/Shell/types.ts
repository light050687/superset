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
 */
import type { MenuData } from 'src/types/bootstrapTypes';

/**
 * Типы drawer-вкладок. Каждый соответствует одной кнопке, которая
 * открывает выдвижную bottom-sheet панель:
 *   - catalog/tools/create — глобальные, триггерятся rail-доком внизу
 *   - filters/pages/builder — dashboard-only, триггерятся боковой
 *                            icon-панелью DashboardSideRail (слева).
 *                            builder доступен только в edit-mode —
 *                            это конструктор чартов/разметки, раньше
 *                            жил как sticky-sidebar справа.
 * Остальные кнопки rail (Home, Search, Calendar, Theme, AI, Settings)
 * выполняют действия, не открывая drawer.
 */
export type DrawerKind =
  | 'catalog'
  | 'tools'
  | 'create'
  | 'filters'
  | 'pages'
  | 'builder'
  | 'gridSettings'
  | 'dashboardSettings';

export interface ShellProps {
  /** bootstrap menu_data — источник навигационных пунктов и прав. */
  data: MenuData;
  /** Возвращает true, если путь обрабатывается React Router (не server-rendered). */
  isFrontendRoute?: (path?: string) => boolean;
  /** Render-функция с основным контентом между rail и внешним layout. */
  children?: React.ReactNode;
}

export interface RailButtonDescriptor {
  id: string;
  /** Видимая подпись для screen reader. */
  label: string;
  /** Inline SVG (viewBox 0 0 16 16). */
  icon: React.ReactNode;
  /** Если указан — drawer-тип, который откроется при клике. */
  drawer?: DrawerKind;
  /** Если указан — путь, по которому нужно перейти. */
  href?: string;
  /** Произвольный обработчик (для Search, Theme, AI, Settings). */
  onClick?: () => void;
  /** Бейдж-точка в углу кнопки (accent-цвет). */
  badgeColor?: string;
  /** Hotkey для tooltip. */
  hotkey?: string;
  /** Отделитель перед кнопкой. */
  separatorBefore?: boolean;
  /** Позиция в rail: 'top' (по умолчанию) или 'bottom'. */
  position?: 'top' | 'bottom';
}
