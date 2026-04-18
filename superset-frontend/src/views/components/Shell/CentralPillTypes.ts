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

/**
 * Контекст, в рамках которого AI-ассистент интерпретирует запросы.
 * id='general' — запрос без привязки к конкретному объекту.
 * id=dashboard_<id> | chart_<id> — запрос в контексте открытого дашборда/чарта.
 *
 * Контексты поступают из bootstrap `common.ai_contexts` (заполняется бэком
 * с учётом permissions пользователя) или формируются на лету по URL
 * (/superset/dashboard/<slug>/ → dashboard_<id>).
 */
export interface AiContext {
  /** Уникальный идентификатор. */
  id: string;
  /** Человеко-читаемый label для чипа и popover. */
  label: string;
  /** CSS-цвет (лучше token `var(--c-*)`) для точки чипа. */
  colorVar: string;
  /** Короткое описание для tooltip/popover. */
  hint?: string;
}

export type AiModelId = 'haiku-4.5' | 'sonnet-4.6' | 'opus-4.7';

export interface AiModelDescriptor {
  id: AiModelId;
  /** Отображаемое имя в picker. */
  label: string;
  /** Одна строка: сильные стороны, латентность, стоимость. */
  hint: string;
  /** Рекомендуемый (добавляется значок). */
  recommended?: boolean;
}

export const DEFAULT_AI_CONTEXT: AiContext = {
  id: 'general',
  label: 'Общий',
  colorVar: 'var(--g500)',
  hint: 'Запрос без привязки к дашборду',
};

/**
 * Список моделей соответствует AI_BACKEND_URL (ai-analytics сервер):
 * `internal/llm/client.go` принимает параметр `model` из query.
 */
export const AI_MODELS: readonly AiModelDescriptor[] = [
  {
    id: 'haiku-4.5',
    label: 'Haiku 4.5',
    hint: 'Быстрая, дешёвая — для простых вопросов',
    recommended: true,
  },
  {
    id: 'sonnet-4.6',
    label: 'Sonnet 4.6',
    hint: 'Баланс скорости и качества',
  },
  {
    id: 'opus-4.7',
    label: 'Opus 4.7',
    hint: 'Максимальное качество — для сложных запросов',
  },
] as const;

export const DEFAULT_AI_MODEL: AiModelId = 'haiku-4.5';
