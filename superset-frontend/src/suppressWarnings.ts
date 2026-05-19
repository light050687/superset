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

// Narrow allow-list of third-party console warnings we intentionally silence
// because the underlying value is semantically valid for Superset or the fix
// lives in a dependency we do not own. Keep this list short — each entry
// should include a justification comment.
const SUPPRESS_PATTERNS: RegExp[] = [
  // AntD v6 / rc-select: `null` is a valid option value in native filter
  // single-mode (represents `IS NULL`). Suppress the strict-mode dev warning
  // that surfaces on every dashboard render without affecting behavior.
  /value in Select options should not be null/i,

  // AntD v6 deprecations used by Superset core (will be migrated upstream)
  /\[antd: Select\] `popupClassName` is deprecated/i,
  /\[antd: Dropdown\] `overlayStyle` is deprecated/i,
  /\[antd: Dropdown\] `dropdownRender` is deprecated/i,
  /\[antd: Modal\] `maskClosable` is deprecated/i,
  /\[antd: Alert\] `message` is deprecated/i,

  // React DOM prop validation noise from rc-component v3 — internal props
  // leaking to DOM. Fix lives in @rc-component, not Superset.
  /React does not recognize the `dropdownAlign` prop/i,
  /Received `true` for a non-boolean attribute `on`/i,

  // emotion-cache SSR hint for libraries we don't control (mostly antd
  // & superset-ui-core utilities). Not actionable in our codebase.
  /pseudo class ":first-child" is potentially unsafe when doing server-side rendering/i,

  // Superset core dashboard layout issues — separate refactor tracks them
  /validateDOMNesting.*<button> cannot appear as a descendant of <button>/i,
  /Failed prop type: The prop `onResize` is marked as required in `Row`/i,
  /Failed prop type: The prop `maxChildrenHeight` is marked as required in `Row`/i,
];

const origError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && SUPPRESS_PATTERNS.some(p => p.test(first))) {
    return;
  }
  origError.apply(console, args as never);
};

// AntD deprecation calls go through console.warn (not error)
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && SUPPRESS_PATTERNS.some(p => p.test(first))) {
    return;
  }
  origWarn.apply(console, args as never);
};

export {};
