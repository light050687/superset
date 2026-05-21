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
 *
 * parseSsActions — извлекает actionable Python-блоки вида
 *   ss_create_dashboard(name="...", charts=[...])
 *   ss_create_chart(type="bar", title="...", ...)
 * из markdown-ответа ai-analytics.
 *
 * На текущем этапе парсер использует осторожный JSON5-подобный подход:
 * пытается превратить Python-литералы в JSON через replace, и парсит
 * через JSON.parse. При неудаче — возвращает payload как сырая строка.
 * Это безопасно (без eval), но извлекает только простые args.
 */

export type SsActionKind = 'dashboard' | 'chart';

export interface SsAction {
  kind: SsActionKind;
  /** Распарсенные аргументы, либо null если парсер не справился. */
  payload: Record<string, unknown> | null;
  /** Сырая Python-строка вызова (для копирования в буфер). */
  raw: string;
}

const PY_BLOCK_RE =
  /```python\s*\n(ss_create_(dashboard|chart))\s*\(([\s\S]*?)\)\s*\n```/g;

/**
 * Очень осторожная конвертация Python-литералов → JSON для basic args.
 * Поддерживает:
 *  - "string" / 'string' → "string"
 *  - True/False/None → true/false/null
 *  - keyword=value → "keyword": value
 * НЕ поддерживает: f-strings, expressions, lambdas, декораторы.
 *
 * При любой ошибке парсинга возвращает null.
 */
function pythonArgsToJson(argsString: string): Record<string, unknown> | null {
  try {
    let s = argsString.trim();
    if (s === '') return {};

    // Python single quotes → JSON double (с базовой защитой от вложенности).
    s = s.replace(
      /'((?:[^'\\]|\\.)*?)'/g,
      (_, inner) => `"${inner.replace(/"/g, '\\"')}"`,
    );

    // True/False/None → true/false/null.
    s = s
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null');

    // Trailing commas (валидно в Python, не в JSON).
    s = s.replace(/,(\s*[}\]])/g, '$1');

    // keyword=value → "keyword":value.
    // Только верхний уровень — простая эвристика: ищем `\s*<id>=`.
    s = s.replace(/(^|[\s,{])([A-Za-z_]\w*)\s*=/g, '$1"$2":');

    // Оборачиваем в {} для парсинга как JSON object.
    return JSON.parse(`{${s}}`);
  } catch {
    return null;
  }
}

/**
 * Извлекает все ss_create_dashboard / ss_create_chart блоки из markdown.
 * Возвращает порядок совпадений.
 */
export function parseSsActions(md: string): SsAction[] {
  if (!md || typeof md !== 'string') return [];
  const out: SsAction[] = [];
  PY_BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = PY_BLOCK_RE.exec(md))) {
    const [, fnName, kindRaw, args] = m;
    const kind = (
      kindRaw === 'dashboard' ? 'dashboard' : 'chart'
    ) as SsActionKind;
    const payload = pythonArgsToJson(args);
    out.push({
      kind,
      payload,
      raw: `${fnName}(${args.trim()})`,
    });
  }
  return out;
}

/**
 * Удаляет все ss_create_* python-блоки из markdown — чтобы render
 * не дублировал их между code-block'ами и actionable buttons.
 */
export function stripSsActionsFromMarkdown(md: string): string {
  return md
    .replace(PY_BLOCK_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
