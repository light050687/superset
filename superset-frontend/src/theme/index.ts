/**
 * DS 2.0 — единая точка импорта токенов и хуков темы.
 *
 * Используйте:
 *   import { useDs2, DS2_VARS } from 'src/theme';
 *
 * Не импортируйте отдельные файлы ds2Tokens / useDs2 напрямую в компонентах —
 * барьер индекса нужен для рефакторов и подсказок IDE.
 */
export {
  DS2_A11Y_MIN_CONTRAST,
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
export { useDs2, type Ds2Context, type Ds2Mode } from './useDs2';
