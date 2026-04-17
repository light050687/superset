/**
 * useDs2() — React hook для доступа к DS 2.0 палитре текущей темы.
 *
 * Возвращает объект с цветами, шрифтами, отступами, радиусами, типографикой.
 * Автоматически переключается между DS2_LIGHT/DS2_DARK при смене темы
 * (детектор темы в tail_js_custom_extra.html ставит html[data-theme="dark|light"]).
 *
 * Для стилей верхнего уровня предпочтительнее использовать CSS-переменные
 * через DS2_VARS — они реактивно меняются без React-рендера.
 * Хук useDs2() нужен когда значение цвета нужно в JS-логике (SVG fill,
 * canvas, условная стилизация через js).
 */
import { useEffect, useState } from 'react';
import {
  DS2_DARK,
  DS2_EASE,
  DS2_FONTS,
  DS2_LIGHT,
  DS2_RADIUS,
  DS2_SPACE,
  DS2_TYPE,
  DS2_VARS,
  type Ds2Palette,
} from './ds2Tokens';

export type Ds2Mode = 'light' | 'dark';

function readMode(): Ds2Mode {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

export interface Ds2Context {
  mode: Ds2Mode;
  palette: Ds2Palette;
  fonts: typeof DS2_FONTS;
  space: typeof DS2_SPACE;
  radius: typeof DS2_RADIUS;
  type: typeof DS2_TYPE;
  vars: typeof DS2_VARS;
  ease: string;
}

/**
 * Подписывается на изменение `html[data-theme]` и возвращает текущую палитру.
 */
export function useDs2(): Ds2Context {
  const [mode, setMode] = useState<Ds2Mode>(readMode);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next = readMode();
      setMode(prev => (prev === next ? prev : next));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // Sync once in case attribute changed between render and effect mount.
    setMode(readMode());
    return () => observer.disconnect();
  }, []);

  return {
    mode,
    palette: mode === 'dark' ? DS2_DARK : DS2_LIGHT,
    fonts: DS2_FONTS,
    space: DS2_SPACE,
    radius: DS2_RADIUS,
    type: DS2_TYPE,
    vars: DS2_VARS,
    ease: DS2_EASE,
  };
}
