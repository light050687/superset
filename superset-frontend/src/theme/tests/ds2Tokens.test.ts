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
import {
  DS2_DARK,
  DS2_LIGHT,
  DS2_RADIUS,
  DS2_SPACE,
  DS2_VARS,
} from '../ds2Tokens';

describe('DS 2.0 tokens', () => {
  it('light palette matches the design document', () => {
    expect(DS2_LIGHT.bg).toBe('#F3F3F3');
    expect(DS2_LIGHT.s).toBe('#FFFFFF');
    expect(DS2_LIGHT.ink).toBe('#0A0A0A');
    expect(DS2_LIGHT.cSky).toBe('#3B8BD9');
    expect(DS2_LIGHT.cViolet).toBe('#8B5CF6');
    expect(DS2_LIGHT.cTangerine).toBe('#E87C3E');
    expect(DS2_LIGHT.cFuchsia).toBe('#D946A8');
    expect(DS2_LIGHT.cAmber).toBe('#CA8A04');
    expect(DS2_LIGHT.up).toBe('#16A34A');
    expect(DS2_LIGHT.dn).toBe('#DC2626');
    expect(DS2_LIGHT.wn).toBe('#CCB604');
  });

  it('dark palette matches the design document', () => {
    expect(DS2_DARK.bg).toBe('#0F1114');
    expect(DS2_DARK.s).toBe('#171A1E');
    expect(DS2_DARK.ink).toBe('#E6E9EF');
    expect(DS2_DARK.cSky).toBe('#5CAAF0');
  });

  it('space scale is on the 8px grid (with allowed sub-steps 2/4/12)', () => {
    const allowed = new Set([2, 4, 8, 12, 16, 24, 32, 48]);
    Object.values(DS2_SPACE).forEach(value => {
      expect(allowed.has(value)).toBe(true);
    });
  });

  it('radii are DS 2.0 compliant (10 for cards, 6 for controls)', () => {
    expect(DS2_RADIUS.card).toBe(10);
    expect(DS2_RADIUS.control).toBe(6);
  });

  it('CSS var names are kebab-case and reference correct properties', () => {
    expect(DS2_VARS.bg).toBe('var(--bg)');
    expect(DS2_VARS.cSky).toBe('var(--c-sky)');
    expect(DS2_VARS.cTangerine).toBe('var(--c-tangerine)');
    expect(DS2_VARS.fontSans).toBe('var(--f)');
    expect(DS2_VARS.fontMono).toBe('var(--m)');
  });

  it('light and dark palettes share the same keys', () => {
    expect(Object.keys(DS2_LIGHT).sort()).toEqual(Object.keys(DS2_DARK).sort());
  });
});
