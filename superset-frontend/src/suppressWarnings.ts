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
];

const origError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && SUPPRESS_PATTERNS.some(p => p.test(first))) {
    return;
  }
  origError.apply(console, args as never);
};

export {};
