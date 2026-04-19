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
 * Стартовый экран Samberi Analytics v6 — bento-раскладка на DS 2.0.
 * Старая Welcome-страница (Collapse + DashboardTable/ChartTable)
 * заменена на новую композицию: избранное + недавние + департаменты.
 *
 * LoadingCards и ActivityData re-export сохранены для обратной совместимости
 * со старыми компонентами ActivityTable/ChartTable/DashboardTable/SavedQueries,
 * которые пока живут в src/features/home/ как legacy (не удалены на случай
 * если потребуются в extension registry).
 */
import type { ComponentType } from 'react';
import { ListViewCard } from '@superset-ui/core/components';
import type { JsonObject } from '@superset-ui/core';
import { CardContainer, loadingCardCount } from 'src/views/CRUD/utils';
import { TableTab } from 'src/views/CRUD/types';
import { HomeBento } from 'src/features/home/bento';
import type { User } from 'src/types/bootstrapTypes';

interface WelcomeProps {
  user?: User;
}

/** @deprecated оставлен для legacy-компонентов src/features/home/. */
export interface ActivityData {
  [TableTab.Created]?: JsonObject[];
  [TableTab.Edited]?: JsonObject[];
  [TableTab.Viewed]?: JsonObject[];
  [TableTab.Other]?: JsonObject[];
}

interface LoadingProps {
  cover?: boolean;
}

/** @deprecated оставлен для legacy-компонентов src/features/home/. */
export const LoadingCards = ({ cover }: LoadingProps) => (
  <CardContainer showThumbnails={cover} className="loading-cards">
    {[...new Array(loadingCardCount)].map((_, index) => (
      <ListViewCard
        key={index}
        cover={cover ? false : <></>}
        description=""
        loading
      />
    ))}
  </CardContainer>
);

const Welcome: ComponentType<WelcomeProps> = ({ user }) => (
  <HomeBento user={user} />
);

// Экспорт как ComponentType без обязательных props — нужно для routes.tsx,
// где массив типизирован как Routes = { Component: ComponentType }[].
export default Welcome as ComponentType;
