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
export declare const ICON_BODIES: Record<IconName, IconBody>;
/**
 * Safely resolve a user-supplied icon name.
 * Falls back to `package` for unknown or missing values.
 */
export declare function resolveIcon(raw: unknown): IconName;
/**
 * Return the JSX body (children of <svg>) for the given icon name.
 * Use inside a parent `<svg viewBox="0 0 16 16" stroke-width="1.5" ...>`.
 */
export declare function getIconBody(name: IconName): IconBody;
export {};
//# sourceMappingURL=icons.d.ts.map