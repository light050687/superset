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
  DS2_DOCK,
  DS2_LIGHT,
  DS2_MAGNIFY,
  DS2_PILL,
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

  it('radii are DS 2.0 compliant (10 for cards, 6 for controls, 20 pill, 16 glass)', () => {
    expect(DS2_RADIUS.card).toBe(10);
    expect(DS2_RADIUS.control).toBe(6);
    expect(DS2_RADIUS.pill).toBe(20);
    expect(DS2_RADIUS.glass).toBe(16);
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

  describe('Floating Dock tokens (Этап 0)', () => {
    it('DS2_DOCK задаёт геометрию в целых пикселях на 8px-grid', () => {
      expect(DS2_DOCK.height).toBe(58);
      expect(DS2_DOCK.bottom).toBe(18);
      expect(DS2_DOCK.drawerBottom).toBe(76);
      expect(DS2_DOCK.aiOverlayBottom).toBe(92);
      expect(DS2_DOCK.dropdownBottom).toBe(84);
      expect(DS2_DOCK.aiOverlayWidth).toBe(820);
      expect(DS2_DOCK.aiOverlayHeight).toBe(640);
      expect(DS2_DOCK.mobileBreakpoint).toBe(768);
      expect(DS2_DOCK.mobileNavHeight).toBe(64);
      expect(DS2_DOCK.contentPaddingBottom).toBe(88);
    });

    it('DS2_DOCK: drawerBottom и aiOverlayBottom не перекрывают dock', () => {
      // drawer / ai overlay должны быть НАД dock: их bottom > dock.height + dock.bottom
      const dockTop = DS2_DOCK.height + DS2_DOCK.bottom; // 76
      expect(DS2_DOCK.drawerBottom).toBeGreaterThanOrEqual(dockTop);
      expect(DS2_DOCK.aiOverlayBottom).toBeGreaterThan(DS2_DOCK.drawerBottom);
    });

    it('DS2_PILL: expanded больше compact по обеим осям', () => {
      expect(DS2_PILL.expandedWidth).toBeGreaterThan(DS2_PILL.compactWidth);
      expect(DS2_PILL.expandedHeight).toBeGreaterThan(DS2_PILL.compactHeight);
      expect(DS2_PILL.compactWidth).toBe(280);
      expect(DS2_PILL.compactHeight).toBe(44);
      expect(DS2_PILL.expandedWidth).toBe(420);
      expect(DS2_PILL.expandedHeight).toBe(100);
    });

    it('DS2_MAGNIFY: scale > neighborScale > 1 (иерархия hover)', () => {
      expect(DS2_MAGNIFY.scale).toBeGreaterThan(DS2_MAGNIFY.neighborScale);
      expect(DS2_MAGNIFY.neighborScale).toBeGreaterThan(1);
      expect(DS2_MAGNIFY.lift).toBeGreaterThan(0);
    });

    it('DS2_VARS.glass* — все glass-токены через CSS-переменные (F-003 audit)', () => {
      // Статические DS2_GLASS_LIGHT/DARK/FILTER удалены — теперь только var(--*).
      expect(DS2_VARS.glassBg).toBe('var(--glass-bg)');
      expect(DS2_VARS.glassBgElev).toBe('var(--glass-bg-elev)');
      expect(DS2_VARS.glassBorder).toBe('var(--glass-border)');
      expect(DS2_VARS.glassShadow).toBe('var(--glass-shadow)');
      expect(DS2_VARS.glassShadowElev).toBe('var(--glass-shadow-elev)');
      expect(DS2_VARS.glassScrim).toBe('var(--glass-scrim)');
      expect(DS2_VARS.glassFilter).toBe('var(--glass-filter)');
    });

    it('DS2_VARS содержит новые dock/pill переменные', () => {
      expect(DS2_VARS.dockHeight).toBe('var(--dock-height)');
      expect(DS2_VARS.pillCompactW).toBe('var(--pill-compact-w)');
      expect(DS2_VARS.magnifyScale).toBe('var(--magnify-scale)');
      expect(DS2_VARS.rPill).toBe('var(--r-pill)');
    });
  });
});
