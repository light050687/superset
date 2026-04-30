import React from 'react';
import type { IconName } from '../types';

/**
 * Declarative SVG body for each category icon.
 *
 * The parent <svg viewBox="0 0 16 16" stroke-width="1.5" ...> is rendered by
 * the consumer; this module only supplies the inner path geometry as a plain
 * React fragment. Using JSX instead of `dangerouslySetInnerHTML` eliminates
 * any HTML-injection vector and lets React handle sourcemaps / StrictMode.
 */
type IconBody = React.ReactElement;

const clockBody: IconBody = (
  <>
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5 L8 8 L10.5 9.5" />
  </>
);

const thermometerBody: IconBody = (
  <>
    <path d="M8 1.5 L8 9.5" />
    <circle cx="8" cy="11.5" r="2.5" />
    <path d="M6 5 L10 5 M6 7 L10 7" />
  </>
);

const shieldBody: IconBody = (
  <>
    <path d="M8 1.5 L13 3.5 L13 8 C13 11 8 14.5 8 14.5 C8 14.5 3 11 3 8 L3 3.5 Z" />
    <path d="M8 6 L8 9 M8 11 L8 11.5" strokeWidth={2} />
  </>
);

const triangleBody: IconBody = (
  <>
    <path d="M8 2 L14 13 L2 13 Z" />
    <path d="M8 6 L8 9.5 M8 11 L8 11.5" strokeWidth={2} />
  </>
);

const packageBody: IconBody = (
  <>
    <path d="M2 4.5 L8 1.5 L14 4.5 L14 11.5 L8 14.5 L2 11.5 Z" />
    <path d="M2 4.5 L8 7.5 L14 4.5 M8 7.5 L8 14.5" />
  </>
);

export const ICON_BODIES: Record<IconName, IconBody> = {
  clock: clockBody,
  thermometer: thermometerBody,
  shield: shieldBody,
  triangle: triangleBody,
  package: packageBody,
};

const VALID: ReadonlySet<IconName> = new Set([
  'clock',
  'thermometer',
  'shield',
  'triangle',
  'package',
]);

/**
 * Safely resolve a user-supplied icon name.
 * Falls back to `package` for unknown or missing values.
 */
export function resolveIcon(raw: unknown): IconName {
  if (typeof raw !== 'string') {
    return 'package';
  }
  const lowered = raw.toLowerCase().trim();
  return VALID.has(lowered as IconName) ? (lowered as IconName) : 'package';
}

/**
 * Return the JSX body (children of <svg>) for the given icon name.
 * Use inside a parent `<svg viewBox="0 0 16 16" stroke-width="1.5" ...>`.
 */
export function getIconBody(name: IconName): IconBody {
  return ICON_BODIES[name];
}
