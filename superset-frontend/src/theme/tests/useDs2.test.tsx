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
import { act, renderHook } from '@testing-library/react-hooks';
import { DS2_DARK, DS2_LIGHT } from '../ds2Tokens';
import { useDs2 } from '../useDs2';

describe('useDs2', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('returns light palette by default when data-theme is absent', () => {
    const { result } = renderHook(() => useDs2());
    expect(result.current.mode).toBe('light');
    expect(result.current.palette).toBe(DS2_LIGHT);
    expect(result.current.palette.cSky).toBe('#3B8BD9');
  });

  it('returns dark palette when html[data-theme="dark"]', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { result } = renderHook(() => useDs2());
    expect(result.current.mode).toBe('dark');
    expect(result.current.palette).toBe(DS2_DARK);
    expect(result.current.palette.cSky).toBe('#5CAAF0');
  });

  it('reacts to data-theme attribute changes', async () => {
    const { result } = renderHook(() => useDs2());
    expect(result.current.mode).toBe('light');

    await act(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      // MutationObserver is asynchronous; yield a microtask.
      await Promise.resolve();
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.palette).toBe(DS2_DARK);
  });

  it('exposes DS 2.0 radii, spacing, and typography', () => {
    const { result } = renderHook(() => useDs2());
    expect(result.current.radius.card).toBe(10);
    expect(result.current.radius.control).toBe(6);
    expect(result.current.space.s2).toBe(8);
    expect(result.current.space.s4).toBe(16);
    expect(result.current.type.pageTitle.fontSize).toBe(28);
    expect(result.current.type.sectionTitle.textTransform).toBe('uppercase');
  });

  it('light palette contrast — g400 is not used for small text contexts (informational)', () => {
    // DS 2.0 раздел 10: для текста <14px запрещены g500 и светлее.
    // Тест защищает токены: g400 остаётся доступным для крупного текста,
    // компоненты обязаны ставить его только в контекстах ≥18px bold / ≥24px.
    expect(DS2_LIGHT.g400).toBe('#999999');
    expect(DS2_LIGHT.g500).toBe('#737373');
  });
});
