# DevOps task: SQL API Cube наружу (future-proof)

**Owner:** DevOps team / Data platform
**Status:** 💡 FUTURE-PROOF — не блокирует текущую разработку
**Priority:** низкий — на случай расширения команды/удалёнки/CI
**Related:** Superset Database Connections, AI-чат

## Текущее состояние (важно)

⚠️ Подключение Cube к локальному Superset **уже работает** в текущей
сетевой конфигурации — внутренний k8s DNS `cube.bi-platform:5432`
доступен из Docker-контейнеров **через корп-сеть** (предположительно
VPN с DNS-forwarding или сетевой мост Docker↔k8s).

Этот документ описывает, как сделать Cube SQL API **более robust**:
не зависеть от корп-сетевой магии, доступным любому разработчику
(включая удалёнку без VPN), CI и preview-окружениям.

**Не критично сейчас.** Можно отложить до момента когда:
- Появится разработчик без kubectl/VPN
- Настроится CI который читает Cube напрямую
- Кто-то удалит сетевой мост и текущий путь сломается

## Контекст

Cube.dev развёрнут в Kubernetes namespace `bi-platform`:

| Компонент | Service | Ingress |
|---|---|---|
| HTTP API (REST) | `cube.bi-platform:4000` | `https://cube-api.rn-bi-k8s-kubeapi.samberi.com:31999` |
| **PostgreSQL SQL API** | `cube.bi-platform:5432` | через корп-DNS-forwarder (хрупко) |
| Cubestore router | `cubestore-router.bi-platform:3030` | — |

В env переменных Cube задано:
```
CUBEJS_PG_SQL_PORT=5432
CUBEJS_SQL_USER=pguser
CUBEJS_SQL_PASSWORD=<...>
```

## Проблема которую решает

В **новых** сценариях (ниже) сегодняшний путь не сработает:

- Разработчик из дома без корп-VPN → нет резолва `cube.bi-platform`
- CI runner в облаке (GitHub Actions) → нет k8s-DNS
- Кто-то меняет сетевую инфру → mosq Docker↔k8s ломается
- Preview-environment в другом namespace

Workaround сейчас: `kubectl port-forward -n bi-platform svc/cube 5432:5432`
+ Host=`host.docker.internal`. Это требует kubeconfig + ручной запуск окна.

## Что нужно сделать

### Вариант A — NodePort (проще)

Создать дополнительный `Service` который экспонирует `cube` на порту 5432
через NodePort (или второй сервис с тем же selector):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cube-sql
  namespace: bi-platform
spec:
  type: NodePort
  selector:
    app: cube                # тот же selector что у Service "cube"
  ports:
    - name: postgresql
      port: 5432
      targetPort: 5432
      nodePort: 31998        # выбрать любой свободный 30000-32767
```

После применения SQL API доступен как
`<любая-нода>.rn-bi-k8s-kubeapi.samberi.com:31998`. В Superset:

| Поле | Значение |
|---|---|
| Host | `dataru-saod-llm02-vm.samberi.com` (или любой узел кластера) |
| Port | `31998` |
| Database | `gold` |
| Username | `pguser` |
| Password | `<CUBEJS_SQL_PASSWORD>` |

### Вариант B — TCP-ingress через nginx-ingress

Если есть nginx-ingress controller с TCP-passthrough:

```yaml
# В configmap nginx-ingress-tcp
apiVersion: v1
kind: ConfigMap
metadata:
  name: tcp-services
  namespace: ingress-nginx
data:
  31998: "bi-platform/cube:5432"
```

И DNS-запись `cube-sql.rn-bi-k8s-kubeapi.samberi.com` → IP ingress.

### Вариант C — Cloudflare Tunnel / Tailscale

Для удалённых разработчиков, которые не в корп-сети — отдельный туннель.
В рамках текущей задачи **не рассматривается**.

## Тест после применения

С локальной машины (внутри корп-сети):

```bash
psql -h cube-sql.rn-bi-k8s-kubeapi.samberi.com -p 31998 \
     -U pguser -d gold

# Должен запросить пароль и подключиться. Проверка:
\dt
```

Должны быть видны cube-views как обычные таблицы.

В Superset:
- Settings → Database Connections → + Database → PostgreSQL
- SQLAlchemy URI:
  `postgresql+psycopg2://pguser:****@cube-sql.rn-bi-k8s-kubeapi.samberi.com:31998/gold`
- Test Connection — должно зеленеть.

## Безопасность

`CUBEJS_SQL_PASSWORD` сейчас передаётся в plain text. После открытия
наружу:

1. Ротировать пароль (т.к. предыдущий уже мог светиться в плохо
   защищённых каналах).
2. Хранить в Kubernetes Secret, не в env-файле.
3. Рассмотреть TLS для SQL API (Cube поддерживает через PG SSL).
4. Whitelist IP корп-сети на NodePort через NetworkPolicy если нужно
   ограничить доступ только своими разработчиками.

## Статус

💡 **FUTURE-PROOF, не блокер.** Текущее подключение работает через
корп-сетевую конфигурацию (VPN/DNS-forwarding). Этот документ актуален
если/когда:
- Расширится команда (удалённые dev'ы без корп-VPN)
- Появится CI который читает Cube напрямую
- Текущий сетевой мост сломается

После применения любого из 3 вариантов выше — Superset подключится
к Cube **из любой сети** через стабильный публичный endpoint.
