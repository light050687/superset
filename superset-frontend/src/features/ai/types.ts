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
 * Типы для AI-чатов. Frontend-зеркало Python моделей ai_chats.models +
 * протокол ответа ai-analytics Go backend (см. ai-analytics/internal/agent).
 */

export type AiChatRole = 'user' | 'bot' | 'thinking' | 'system';

/** Папка чатов (от /api/v1/ai_chat_folder/). */
export interface AiChatFolder {
  id: number;
  parent_id: number | null;
  name: string;
  position: number;
}

/** Сессия чата (от /api/v1/ai_chat_session/). */
export interface AiChatSession {
  id: number;
  uuid: string | null;
  folder_id: number | null;
  title: string;
  position: number;
  created_on: string | null;
  changed_on: string | null;
}

/** Сообщение чата (от /api/v1/ai_chat_session/{id}/messages). */
export interface AiChatMessage {
  id: number;
  session_id: number;
  role: AiChatRole;
  /** JSON-строка: простой {text} или структурированный ответ (см. AiAnswerBlocks). */
  content_json: string;
  /** JSON-строка с метриками запроса (tokens, model, latency_ms). */
  meta_json: string | null;
  created_on: string | null;
}

// ─────────────────────────────────────────────────────────────
// Структурированный ответ от ai-analytics backend.
// Парсится из AiChatMessage.content_json для сообщений с role=bot.
// ─────────────────────────────────────────────────────────────

export interface AiAnswerKpi {
  label: string;
  value: string;
  deltaLabel?: string;
  deltaKind?: 'up' | 'dn' | 'neutral';
}

export interface AiAnswerChart {
  /** Тип визуализации — 'bars', 'line', 'grouped-bars' и т.д. */
  type: string;
  title?: string;
  subtitle?: string;
  /** Сериализованный SVG или структурированные данные для клиентской отрисовки. */
  svg?: string;
  data?: unknown;
}

export interface AiAnswerInsight {
  /** Ключ-инсайт: что важно, что предпринять. */
  text: string;
  /** Дополнительный заголовок («Ключевой инсайт», «Важно» и т.п.). */
  prefix?: string;
}

export type AiAnswerActionKind =
  | 'open_dashboard'
  | 'open_chart'
  | 'create_table'
  | 'create_document'
  | 'download'
  | 'embed';

export interface AiAnswerAction {
  kind: AiAnswerActionKind;
  label: string;
  icon?: string;
  /** URL для навигации / download. */
  url?: string;
  /** Объект для создания нового через Univer/Superset. */
  payload?: Record<string, unknown>;
}

export interface AiAnswerSource {
  /** Цепочка источников: Sales → StarRocks → Cube. */
  chips: string[];
  /** Когда обновлены данные. */
  updatedHuman?: string;
}

export interface AiAnswerFollowup {
  /** Предлагаемый follow-up вопрос. */
  text: string;
}

/** Сырая таблица данных от ai-analytics (rawData из NL2SQL pipeline). */
export interface AiAnswerTable {
  rows: Array<Record<string, unknown>>;
  /** Опциональный заголовок над таблицей. */
  title?: string;
}

/** Полная структура ответа от ai-analytics. */
export interface AiAnswerBlocks {
  /** Короткий текстовый ответ (основной абзац). */
  title?: string;
  /** Markdown-текст. Рендерится через markdown-to-jsx в AiMessage. */
  text?: string;
  kpi?: AiAnswerKpi[];
  chart?: AiAnswerChart;
  /** Таблица сырых данных (rawData от Cube.dev). */
  table?: AiAnswerTable;
  insight?: AiAnswerInsight;
  actions?: AiAnswerAction[];
  source?: AiAnswerSource;
  followups?: AiAnswerFollowup[];
}

/** Сырое сообщение для ai-analytics POST /api/v1/analyze. */
export interface AiAnalyzeRequest {
  query: string;
  session_id?: string;
  /** Произвольный контекст (dashboard_id, chart_id, date_range). */
  context?: Record<string, unknown>;
  /**
   * ID модели LLM (haiku-4.5, sonnet-4.6, opus-4.7). Если поле не задано —
   * бэкенд ai-analytics использует модель по умолчанию из config.
   */
  model?: string;
}

/**
 * Сырой ответ от ai-analytics. Backend (Go-сервис) исторически возвращает
 * вариативные форматы: `{answer}` (canonical), `{text|content}` (legacy),
 * `{intent, data, ...}` (NL2SQL pipeline). Все варианты нормализуются
 * клиентским адаптером `adaptAnalyzeResponse` в `api.ts`.
 */
export interface AiAnalyzeRawResponse {
  // canonical
  answer?: AiAnswerBlocks;
  session_id?: string;
  meta?: {
    tokens?: number;
    model?: string;
    latency_ms?: number;
  };
  // ai-analytics LLM-pipeline формат:
  //   {message: '<markdown>', intent: 'query_data', cubeQuery: {...}, rawData: [...]}
  message?: string;
  cubeQuery?: unknown;
  rawData?: Array<Record<string, unknown>>;
  // legacy / alternative shapes
  text?: string;
  content?: string;
  intent?: string;
  data?: unknown;
  result?: unknown;
}

/** Нормализованный ответ для UI — `answer` всегда задан. */
export interface AiAnalyzeResponse {
  answer: AiAnswerBlocks;
  session_id?: string;
  /** Метаданные для биллинга и observability. */
  meta?: {
    tokens?: number;
    model?: string;
    latency_ms?: number;
  };
}

/** Активная задача из GET /api/v1/tasks. */
export interface AiActiveTask {
  id: string;
  title: string;
  progress_percent?: number;
  created_at?: string;
}
