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
  DS2_FS_VARS,
  DS2_LIGHT,
  DS2_MAGNIFY,
  DS2_PILL,
  DS2_RADIUS,
  DS2_SPACE,
  DS2_TYPE,
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
      expect(DS2_DOCK.height).toBe(46);
      expect(DS2_DOCK.bottom).toBe(18);
      expect(DS2_DOCK.drawerBottom).toBe(64);
      expect(DS2_DOCK.aiOverlayBottom).toBe(80);
      expect(DS2_DOCK.dropdownBottom).toBe(72);
      expect(DS2_DOCK.aiOverlayWidth).toBe(820);
      expect(DS2_DOCK.aiOverlayHeight).toBe(640);
      expect(DS2_DOCK.mobileBreakpoint).toBe(768);
      expect(DS2_DOCK.mobileNavHeight).toBe(52);
      expect(DS2_DOCK.contentPaddingBottom).toBe(76);
    });

    it('DS2_DOCK: drawerBottom и aiOverlayBottom не перекрывают dock', () => {
      // drawer / ai overlay должны быть НАД dock: их bottom > dock.height + dock.bottom
      const dockTop = DS2_DOCK.height + DS2_DOCK.bottom; // 64
      expect(DS2_DOCK.drawerBottom).toBeGreaterThanOrEqual(dockTop);
      expect(DS2_DOCK.aiOverlayBottom).toBeGreaterThan(DS2_DOCK.drawerBottom);
    });

    it('DS2_PILL: expanded больше compact по обеим осям', () => {
      expect(DS2_PILL.expandedWidth).toBeGreaterThan(DS2_PILL.compactWidth);
      expect(DS2_PILL.expandedHeight).toBeGreaterThan(DS2_PILL.compactHeight);
      expect(DS2_PILL.compactWidth).toBe(224);
      expect(DS2_PILL.compactHeight).toBe(36);
      expect(DS2_PILL.expandedWidth).toBe(336);
      expect(DS2_PILL.expandedHeight).toBe(80);
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

  describe('Fluid typography (DS 2.0 §02)', () => {
    it('DS2_FS_VARS содержит 9 fluid токенов через CSS-переменные', () => {
      expect(DS2_FS_VARS.nano).toBe('var(--fs-nano)');
      expect(DS2_FS_VARS.micro).toBe('var(--fs-micro)');
      expect(DS2_FS_VARS.meta).toBe('var(--fs-meta)');
      expect(DS2_FS_VARS.interactive).toBe('var(--fs-interactive)');
      expect(DS2_FS_VARS.body).toBe('var(--fs-body)');
      expect(DS2_FS_VARS.subtitle).toBe('var(--fs-subtitle)');
      expect(DS2_FS_VARS.title).toBe('var(--fs-title)');
      expect(DS2_FS_VARS.hero).toBe('var(--fs-hero)');
      expect(DS2_FS_VARS.display).toBe('var(--fs-display)');
    });

    it('Hero KPI: минимум 28px (нижняя граница clamp)', () => {
      // Жалоба пользователя: «мелкие цифры в KPI». Гарантия — нижняя граница ≥ 28.
      expect(DS2_TYPE.hero.fontSizePx).toBeGreaterThanOrEqual(28);
      expect(DS2_TYPE.heroNumber.fontSizePx).toBeGreaterThanOrEqual(28);
      expect(DS2_TYPE.pageTitle.fontSizePx).toBeGreaterThanOrEqual(28);
    });

    it('Минимум 11px для текста (10px только для UPPERCASE nano)', () => {
      const readableTokens = [
        DS2_TYPE.micro,
        DS2_TYPE.meta,
        DS2_TYPE.metaMono,
        DS2_TYPE.interactive,
        DS2_TYPE.body,
        DS2_TYPE.bodyStrong,
        DS2_TYPE.subtitle,
        DS2_TYPE.title,
        DS2_TYPE.hero,
        DS2_TYPE.display,
      ];
      readableTokens.forEach(token => {
        expect(token.fontSizePx).toBeGreaterThanOrEqual(11);
      });
      // nano — 10px только для UPPERCASE
      expect(DS2_TYPE.nano.fontSizePx).toBe(10);
      expect(DS2_TYPE.nano.textTransform).toBe('uppercase');
    });

    it('fontSize всех токенов — fluid CSS-переменные (var(--fs-*))', () => {
      Object.values(DS2_TYPE).forEach(token => {
        expect(token.fontSize).toMatch(/^var\(--fs-/);
      });
    });

    it('font-weight whitelist: 400/500/600/700/800', () => {
      const allowedWeights = new Set([400, 500, 600, 700, 800]);
      Object.values(DS2_TYPE).forEach(token => {
        expect(allowedWeights.has(token.fontWeight)).toBe(true);
      });
    });

    it('Шкала Perfect Fourth: иерархия размеров возрастает', () => {
      expect(DS2_TYPE.nano.fontSizePx).toBeLessThan(DS2_TYPE.micro.fontSizePx);
      expect(DS2_TYPE.micro.fontSizePx).toBeLessThan(DS2_TYPE.meta.fontSizePx);
      expect(DS2_TYPE.meta.fontSizePx).toBeLessThan(
        DS2_TYPE.interactive.fontSizePx,
      );
      expect(DS2_TYPE.interactive.fontSizePx).toBeLessThan(
        DS2_TYPE.body.fontSizePx,
      );
      expect(DS2_TYPE.body.fontSizePx).toBeLessThan(
        DS2_TYPE.subtitle.fontSizePx,
      );
      expect(DS2_TYPE.subtitle.fontSizePx).toBeLessThan(
        DS2_TYPE.title.fontSizePx,
      );
      expect(DS2_TYPE.title.fontSizePx).toBeLessThan(DS2_TYPE.hero.fontSizePx);
      expect(DS2_TYPE.hero.fontSizePx).toBeLessThan(
        DS2_TYPE.display.fontSizePx,
      );
    });

    it('Mono-токены используют var(--m), sans — var(--f)', () => {
      expect(DS2_TYPE.metaMono.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.micro.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.nano.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.tableHeader.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.kpiLabel.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.delta.fontFamily).toBe('var(--m)');
      expect(DS2_TYPE.body.fontFamily).toBe('var(--f)');
      expect(DS2_TYPE.hero.fontFamily).toBe('var(--f)');
      expect(DS2_TYPE.display.fontFamily).toBe('var(--f)');
      expect(DS2_TYPE.title.fontFamily).toBe('var(--f)');
    });

    it('Hero и display имеют tabular-nums (для KPI чисел)', () => {
      expect(DS2_TYPE.hero.fontVariantNumeric).toBe('tabular-nums');
      expect(DS2_TYPE.display.fontVariantNumeric).toBe('tabular-nums');
      expect(DS2_TYPE.heroNumber.fontVariantNumeric).toBe('tabular-nums');
      expect(DS2_TYPE.metaMono.fontVariantNumeric).toBe('tabular-nums');
    });

    it('Legacy aliases (pageTitle/sectionTitle/heroNumber/...) работают', () => {
      // Обратная совместимость со старым кодом.
      expect(DS2_TYPE.pageTitle).toBeDefined();
      expect(DS2_TYPE.sectionTitle).toBeDefined();
      expect(DS2_TYPE.heroNumber).toBeDefined();
      expect(DS2_TYPE.kpiLabel).toBeDefined();
      expect(DS2_TYPE.delta).toBeDefined();
      expect(DS2_TYPE.tableHeader).toBeDefined();
    });
  });
});
