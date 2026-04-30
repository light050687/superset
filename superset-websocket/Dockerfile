# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# ─── corp-CA setup ──────────────────────────────────────────────────
# Корп-сети с MITM-прокси (Bluecoat/Zscaler/Forcepoint) подменяют TLS-серт
# для registry.npmjs.org. Решения:
#   1) Правильно: подложить корп-CA в trust store. Передавать
#      --build-arg CORP_CA_CERT_B64=$(base64 -w0 corp-ca.pem)
#      Тогда update-ca-certificates подключает CA, npm доверяет цепочке.
#   2) Workaround: оставить пустым → strict-ssl=false (TLS не проверяется).
#      Допустимо для локальной dev-сборки, НЕ для prod.
#
# В docker-compose.yml: args: CORP_CA_CERT_B64: ${CORP_CA_CERT_B64:-}
# Локальное значение в docker/.env-local (gitignored).
# ────────────────────────────────────────────────────────────────────

FROM node:16-alpine AS build

ARG CORP_CA_CERT_B64=""

# Если передан корп-CA — подкладываем в trust store, npm проверяет TLS.
# Если пусто — fallback на strict-ssl=false (для корп-сети без CA-bundle).
RUN if [ -n "$CORP_CA_CERT_B64" ]; then \
      apk add --no-cache ca-certificates curl && \
      echo "$CORP_CA_CERT_B64" | base64 -d > /usr/local/share/ca-certificates/corp.crt && \
      update-ca-certificates && \
      npm config set cafile /etc/ssl/certs/ca-certificates.crt; \
    else \
      npm config set strict-ssl false; \
    fi

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

WORKDIR /home/superset-websocket

COPY . ./

RUN npm ci && \
  npm run build


FROM node:16-alpine

ARG CORP_CA_CERT_B64=""

# То же самое в production-стадии (npm ci --omit=dev требует TLS).
RUN if [ -n "$CORP_CA_CERT_B64" ]; then \
      apk add --no-cache ca-certificates && \
      echo "$CORP_CA_CERT_B64" | base64 -d > /usr/local/share/ca-certificates/corp.crt && \
      update-ca-certificates && \
      npm config set cafile /etc/ssl/certs/ca-certificates.crt; \
    else \
      npm config set strict-ssl false; \
    fi

ENV NODE_ENV=production
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
WORKDIR /home/superset-websocket

COPY --from=build /home/superset-websocket/dist ./dist
COPY package*.json ./

# Only install production dependencies
RUN npm ci --omit=dev

# Don't run as root!
USER node

CMD [ "npm", "start" ]
