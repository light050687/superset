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
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { ShellProvider } from './ShellContext';

const Story = (args: any) => (
  <MemoryRouter>
    <ShellProvider>
      <div
        style={{
          position: 'relative',
          /* На desktop ставим принудительно 375px (iPhone SE),
             чтобы MobileNav показался (media-query матчит). */
          width: 375,
          height: 600,
          margin: '0 auto',
          background: 'var(--bg)',
          color: 'var(--ink)',
          padding: 16,
          paddingBottom: 'var(--dock-mobile-height)',
          border: '1px solid var(--g200)',
          overflow: 'hidden',
        }}
      >
        <p style={{ color: 'var(--g500)', fontSize: 12 }}>
          MobileNav — mobile bottom tab bar (&lt;768px)
        </p>
        <MobileNav {...args} />
      </div>
    </ShellProvider>
  </MemoryRouter>
);

export default {
  title: 'Shell/MobileNav',
  component: MobileNav,
  parameters: {
    docs: {
      description: {
        component:
          'MobileNav — 4-tab bottom bar (Home · Catalog · AI · Профиль), ' +
          'рендерится вместо FloatingDock на узких экранах (<768px). Glass ' +
          'стилизация, safe-area-inset-bottom для iOS home indicator.',
      },
    },
  },
};

export const Default = Story.bind({});
Default.args = {
  userInitials: 'ДК',
};

export const WithBadges = Story.bind({});
WithBadges.args = {
  userInitials: 'ИП',
  aiBadgeColor: '#16A34A',
  catalogBadgeColor: '#3B8BD9',
};
