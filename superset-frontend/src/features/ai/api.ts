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
 * AI API-клиент:
 * 1. SupersetClient для /api/v1/ai_chat_* (папки/сессии/сообщения в metadata DB)
 * 2. Fetch к ai-analytics Go backend для /api/v1/analyze (сам LLM).
 *    URL берётся из VITE_AI_BACKEND_URL или bootstrap.common.conf.AI_BACKEND_URL.
 *    Если не задан — используется mock-режим с локальным заглушечным ответом.
 */
import { SupersetClient } from '@superset-ui/core';
import getBootstrapData from 'src/utils/getBootstrapData';
import type {
  AiActiveTask,
  AiAnalyzeRawResponse,
  AiAnalyzeRequest,
  AiAnalyzeResponse,
  AiAnswerBlocks,
  AiChatFolder,
  AiChatMessage,
  AiChatSession,
} from './types';

const CHAT_FOLDER_BASE = '/api/v1/ai_chat_folder';
const CHAT_SESSION_BASE = '/api/v1/ai_chat_session';

// ─────── Metadata DB (через SupersetClient) ───────

export async function listAiChatFolders(): Promise<AiChatFolder[]> {
  const { json } = await SupersetClient.get({ endpoint: `${CHAT_FOLDER_BASE}/` });
  return (json as { result: AiChatFolder[] }).result ?? [];
}

export async function createAiChatFolder(payload: {
  name: string;
  parent_id?: number | null;
  position?: number;
}): Promise<{ id: number }> {
  const { json } = await SupersetClient.post({
    endpoint: `${CHAT_FOLDER_BASE}/`,
    jsonPayload: payload,
  });
  return json as { id: number };
}

export async function updateAiChatFolder(
  id: number,
  payload: { name?: string; parent_id?: number | null; position?: number },
): Promise<void> {
  await SupersetClient.put({
    endpoint: `${CHAT_FOLDER_BASE}/${id}`,
    jsonPayload: payload,
  });
}

export async function deleteAiChatFolder(id: number): Promise<void> {
  await SupersetClient.delete({ endpoint: `${CHAT_FOLDER_BASE}/${id}` });
}

export async function listAiChatSessions(
  folderId?: number | null,
): Promise<AiChatSession[]> {
  const qs = folderId != null ? `?folder_id=${folderId}` : '';
  const { json } = await SupersetClient.get({
    endpoint: `${CHAT_SESSION_BASE}/${qs}`,
  });
  return (json as { result: AiChatSession[] }).result ?? [];
}

export async function createAiChatSession(payload: {
  title: string;
  folder_id?: number | null;
  position?: number;
}): Promise<AiChatSession> {
  const { json } = await SupersetClient.post({
    endpoint: `${CHAT_SESSION_BASE}/`,
    jsonPayload: payload,
  });
  return json as AiChatSession;
}

export async function updateAiChatSession(
  id: number,
  payload: { title?: string; folder_id?: number | null; position?: number },
): Promise<AiChatSession> {
  const { json } = await SupersetClient.put({
    endpoint: `${CHAT_SESSION_BASE}/${id}`,
    jsonPayload: payload,
  });
  return json as AiChatSession;
}

export async function deleteAiChatSession(id: number): Promise<void> {
  await SupersetClient.delete({ endpoint: `${CHAT_SESSION_BASE}/${id}` });
}

export async function listAiChatMessages(
  sessionId: number,
): Promise<AiChatMessage[]> {
  const { json } = await SupersetClient.get({
    endpoint: `${CHAT_SESSION_BASE}/${sessionId}/messages`,
  });
  return (json as { result: AiChatMessage[] }).result ?? [];
}

export async function createAiChatMessage(
  sessionId: number,
  payload: {
    role: 'user' | 'bot' | 'thinking' | 'system';
    content_json: string;
    meta_json?: string | null;
  },
): Promise<AiChatMessage> {
  const { json } = await SupersetClient.post({
    endpoint: `${CHAT_SESSION_BASE}/${sessionId}/messages`,
    jsonPayload: payload,
  });
  return json as AiChatMessage;
}

// ─────── ai-analytics Go backend (через fetch) ───────

function resolveAiBackendUrl(): string | null {
  // 1. Variable от сборщика Vite/Webpack (инжектится при build).
  const envUrl =
    typeof process !== 'undefined'
      ? (process as any)?.env?.AI_BACKEND_URL ?? null
      : null;
  if (envUrl) return envUrl;

  // 2. Из Superset bootstrap.conf (выставляется в superset_config.py).
  try {
    const data = getBootstrapData();
    const confUrl = (data?.common?.conf as Record<string, unknown> | undefined)
      ?.AI_BACKEND_URL;
    if (typeof confUrl === 'string' && confUrl.length > 0) return confUrl;
  } catch {
    // bootstrap может быть недоступен в тестах.
  }
  return null;
}

export function isAiBackendConfigured(): boolean {
  return resolveAiBackendUrl() !== null;
}

/**
 * Нормализует сырой ответ ai-analytics (variability across pipelines)
 * в каноничный {answer: AiAnswerBlocks}. Гарантирует, что answer
 * всегда определён — иначе createAiChatMessage упадёт с 400
 * (Marshmallow требует content_json как обязательное поле).
 *
 * Поддерживаемые форматы:
 *   1. canonical:  {answer: {title, text, kpi, chart, ...}, session_id, meta}
 *   2. legacy:     {text: '...'} | {content: '...'}
 *   3. nl2sql:     {intent, data, ...} — собираем из intent + сериализованного data
 *   4. fallback:   любой другой объект сериализуется в text
 */
function adaptAnalyzeResponse(raw: AiAnalyzeRawResponse): AiAnalyzeResponse {
  // 1) Каноничный: answer уже структурированный AiAnswerBlocks.
  if (
    raw &&
    typeof raw.answer === 'object' &&
    raw.answer !== null &&
    !Array.isArray(raw.answer)
  ) {
    return {
      answer: raw.answer,
      session_id: raw.session_id,
      meta: raw.meta,
    };
  }

  // 2) ai-analytics LLM-pipeline: {message: '<markdown>', intent, cubeQuery,
  // rawData: [...]}. message — основной markdown-ответ, rawData — таблица
  // от Cube.dev. intent НЕ выводим как title (это технический классификатор
  // запроса, типа 'query_data', не для UI).
  if (typeof raw?.message === 'string' && raw.message.length > 0) {
    const blocks: AiAnswerBlocks = { text: raw.message };
    if (Array.isArray(raw.rawData) && raw.rawData.length > 0) {
      blocks.table = { rows: raw.rawData };
    }
    return {
      answer: blocks,
      session_id: raw.session_id,
      meta: raw.meta,
    };
  }

  // 3) Legacy: плоский text/content.
  const flatText =
    typeof raw?.text === 'string'
      ? raw.text
      : typeof raw?.content === 'string'
        ? raw.content
        : null;
  if (flatText) {
    return {
      answer: { text: flatText },
      session_id: raw.session_id,
      meta: raw.meta,
    };
  }

  // 4) Fallback: незнакомый формат — сериализуем в text с обрезкой,
  // чтобы хоть что-то показать пользователю и не раздуть metadata DB.
  const serialized = JSON.stringify(raw, null, 2);
  const truncated =
    serialized.length > 4000 ? `${serialized.slice(0, 4000)}…` : serialized;
  return {
    answer: { text: truncated },
    session_id: raw?.session_id,
    meta: raw?.meta,
  };
}

/**
 * Отправляет вопрос в ai-analytics. При отсутствии AI_BACKEND_URL
 * возвращает mock-ответ — frontend остаётся работоспособным без бекенда.
 *
 * `credentials: 'include'` намеренно не используется: ai-analytics CORS
 * возвращает Access-Control-Allow-Origin: '*', что несовместимо с cookies
 * (см. CORS spec). Аутентификация на стороне ai-analytics — через
 * X-Session-ID header, а не Superset session cookie.
 *
 * TODO(blocked-on-devops): после фикса CORS whitelist в ai-analytics
 * (см. docs/devops-tasks/ai-analytics-cors.md) вернуть `credentials: 'include'`
 * в обоих fetch (analyze + tasks).
 */
export async function analyzeQuestion(
  request: AiAnalyzeRequest,
): Promise<AiAnalyzeResponse> {
  const base = resolveAiBackendUrl();
  if (!base) {
    return mockAnalyze(request);
  }
  const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`ai-analytics ${res.status}: ${res.statusText}`);
  }
  const raw = (await res.json()) as AiAnalyzeRawResponse;
  return adaptAnalyzeResponse(raw);
}

export async function listAiActiveTasks(): Promise<AiActiveTask[]> {
  const base = resolveAiBackendUrl();
  if (!base) return [];
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/tasks`);
    if (!res.ok) return [];
    const body = (await res.json()) as { result?: AiActiveTask[] };
    return body.result ?? [];
  } catch {
    return [];
  }
}

// ─────── Mock (когда LLM-бекенд не подключён) ───────

function mockAnalyze(request: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
  const q = request.query.trim();
  const isMargin = /маржа|мяс/i.test(q);
  const answer: AiAnswerBlocks = isMargin
    ? {
        title: 'Маржинальность категории «Мясо», март 2026',
        text:
          'Маржа по категории Мясо в марте составила 24,7% при плане 26,0%. ' +
          'Это ниже плановых показателей на 1,3 п.п.',
        kpi: [
          { label: 'Факт', value: '24,7%' },
          { label: 'План', value: '26,0%' },
          {
            label: 'Отклонение',
            value: '−1,3 п.п.',
            deltaLabel: '↓ ниже плана',
            deltaKind: 'dn',
          },
          {
            label: 'Прошлый год',
            value: '25,9%',
            deltaLabel: '↓ −1,2 п.п.',
            deltaKind: 'dn',
          },
        ],
        insight: {
          prefix: 'Ключевой инсайт',
          text:
            'Основной вклад в снижение даёт Говядина охлаждённая — маржа 18,2% ' +
            'при плане 22,0%. Закупочная цена выросла на 8% относительно февраля.',
        },
        actions: [
          { kind: 'open_dashboard', label: 'Открыть KPI Маржа', url: '/dashboard/list/' },
          { kind: 'create_table', label: 'Создать таблицу' },
          { kind: 'download', label: 'Экспорт', url: '#' },
        ],
        source: {
          chips: ['Sales', 'StarRocks', 'Cube Dev'],
          updatedHuman: '2 ч назад',
        },
        followups: [
          { text: 'Какая маржа по мясу была в феврале?' },
          { text: 'Сравни маржу мяса в разных форматах магазинов' },
          { text: 'Какие SKU говядины самые убыточные?' },
        ],
      }
    : {
        text:
          `Обрабатываю запрос «${q}». В продакшене ответ придёт от LLM через ` +
          'MCP-оркестратор с доступом к кубам данных и инструментам.',
        actions: [
          { kind: 'open_dashboard', label: 'Открыть дашборд' },
          { kind: 'create_table', label: 'Создать таблицу' },
        ],
        source: { chips: ['mock'], updatedHuman: 'локальная заглушка' },
      };

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        answer,
        session_id: request.session_id ?? 'mock',
        meta: { model: 'mock', latency_ms: 800 },
      });
    }, 800);
  });
}
