# DevOps task: CORS whitelist в ai-analytics

**Owner:** AI/Backend team (ai-analytics Go-сервис)
**Status:** 🚧 BLOCKED — требует серверной правки
**Related:** Superset frontend `superset-frontend/src/features/ai/api.ts`

## Контекст

Frontend AI-чата Superset (компоненты `AiFullView`, `AiMessage` в
`superset-frontend/src/features/ai/`) обращается к ai-analytics через:

- `POST {AI_BACKEND_URL}/api/v1/analyze` — отправка вопроса в LLM-pipeline
- `GET {AI_BACKEND_URL}/api/v1/tasks` — активные асинхронные задачи

Сейчас ai-analytics возвращает заголовок:

```http
Access-Control-Allow-Origin: *
```

Это вынуждает фронт ходить **без** `credentials: 'include'`, потому что
[CORS-spec запрещает](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSNotSupportingCredentials)
комбинацию wildcard origin + cookies/auth-headers.

Последствие: ai-analytics не может различать пользователей по Superset-сессии
(если когда-нибудь захочет). Авторизация сейчас идёт через `X-Session-ID`
header — workaround.

## Что нужно сделать

### 1. Заменить wildcard на whitelist в Go-коде

В файле где настроен `chi/cors` middleware (обычно `cmd/server/main.go` или
`internal/http/middleware.go`):

```go
import "github.com/go-chi/cors"

r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{
        "http://localhost:8088",                                      // local dev (HTTP, через docker compose)
        "http://localhost",                                            // через nginx :80
        "https://superset-dev.rn-bi-k8s-kubeapi.samberi.com:31999",   // staging
        "https://superset-prod.rn-bi-k8s-kubeapi.samberi.com:31999",  // prod
    },
    AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Session-ID"},
    ExposedHeaders:   []string{"Link"},
    AllowCredentials: true,                                            // ← главное
    MaxAge:           300,
}))
```

Если используется gin/echo — аналогично, любой CORS-middleware поддерживает
конфигурацию whitelist.

### 2. Проверить что go-chi/cors не упадёт с panic

[go-chi/cors](https://github.com/go-chi/cors) специально проверяет, что
`AllowOrigins: ["*"]` + `AllowCredentials: true` несовместимо и **паникует
при старте**. Если у вас комбо вылетит — это ожидаемо, фикс выше его исправит.

## Тест после деплоя

```bash
curl -i -X OPTIONS http://dataru-saod-llm02-vm.samberi.com:8080/api/v1/analyze \
  -H "Origin: http://localhost:8088" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Ожидаемый ответ:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:8088    ← конкретный origin, НЕ *
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID
Access-Control-Allow-Credentials: true
Vary: Origin
```

Если `Access-Control-Allow-Origin: *` — настройка не применилась.
Если `Access-Control-Allow-Origin` отсутствует — origin не в whitelist.

## Что менять в Superset после применения этой задачи

В `superset-frontend/src/features/ai/api.ts` вернуть `credentials: 'include'`:

```typescript
const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ← вернуть после CORS whitelist на стороне ai-analytics
  body: JSON.stringify(request),
});
```

Аналогично для `listAiActiveTasks` — fetch к `/api/v1/tasks`.

После этого Superset session cookie будет автоматически прикладываться к
запросам в ai-analytics, и ai-analytics сможет (при необходимости в будущем)
проверять Superset-сессию через shared cache / JWT.

## Sources

- [MDN: CORS Errors — wildcard with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSNotSupportingCredentials)
- [MDN: Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials)
- [go-chi/cors security: wildcard with credentials panics](https://github.com/gofiber/fiber/security/advisories/GHSA-fmg4-x8pw-hjhg)
