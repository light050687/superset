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
import type { CatalogObjectType } from 'src/features/catalog';

/** Тип объекта для визуального тега карточки. */
export type BentoCardKind =
  | 'dashboard'
  | 'chart'
  | 'geo'
  | 'table'
  | 'doc';

/** Размеры bento-карточки в 12-колоночной сетке. */
export type BentoCardSize =
  | 'small'   // span 3
  | 'medium'  // span 4
  | 'wide'    // span 6
  | 'large'   // span 4, row-span 2
  | 'full';   // span 12

/** Универсальный объект для отрисовки bento-карточки. */
export interface BentoItem {
  /** id внутренней сущности Superset (dashboard.id / chart.id). */
  id: number;
  /** Имя / заголовок. */
  title: string;
  /** Тип, определяющий цвет тега и иконку превью. */
  kind: BentoCardKind;
  /** URL для навигации по клику. */
  url: string;
  /** Дата последнего изменения — «2 ч», «1 д» (уже humanized). */
  updatedHuman?: string;
  /** Избранное (заполненная звезда). */
  starred?: boolean;
  /** Live-индикатор (зелёная точка). */
  live?: boolean;
  /** Короткие теги (real-time, критичный, ...). Максимум 2. */
  tags?: string[];
  /** Название департамента (для badge внизу). */
  department?: string;
  /** Цвет точки департамента. */
  departmentColor?: string;
  /** Для D&D: тип объекта в терминах catalog API. */
  objectType: CatalogObjectType;
}

/** Лейаут bento — какие карточки куда. */
export interface BentoSection {
  key: string;
  title: string;
  items: BentoItem[];
  loading?: boolean;
  emptyText?: string;
}
