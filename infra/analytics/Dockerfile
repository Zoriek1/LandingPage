# syntax=docker/dockerfile:1
# API de analytics (Fastify + pg). Build context = RAIZ do repositório:
#   docker build -f infra/analytics/Dockerfile --build-arg RELEASE_SHA=<sha> -t landing-analytics-api:<sha> .
#
# Sem transpilação: Node 24 executa .ts por type stripping nativo. Por isso o código
# do servidor precisa usar somente sintaxe TS "apagável" e imports com extensão .ts.
# Nenhum segredo é embutido na imagem; toda configuração entra por variáveis de ambiente.

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV NODE_ENV=production
# Somente manifestos primeiro: camada de dependências cacheável.
COPY package.json package-lock.json ./
# npm ci respeita o lockfile; --omit=dev remove ferramentas de desenvolvimento.
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
 && npm cache clean --force

FROM ${NODE_IMAGE} AS runtime
ARG RELEASE_SHA=unknown
LABEL org.opencontainers.image.title="landing-analytics-api" \
      org.opencontainers.image.revision="${RELEASE_SHA}"
WORKDIR /app
# package.json é necessário em runtime ("type": "module" define como .ts é interpretado).
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
# server/ inclui server/analytics/{main,migrate,admin}.ts e server/analytics/migrations/*.sql
# (migrate.ts lê as migrations via import.meta.url, então precisam ficar ao lado dele).
COPY --chown=node:node server ./server
COPY --chown=node:node shared ./shared

# Defaults de infraestrutura NÃO secretos. Nenhum default de produção para
# DATABASE_URL, origins, cookie ou RELEASE_SHA runtime: devem vir do ambiente.
ENV ANALYTICS_PORT=8787 \
    ANALYTICS_HOST=0.0.0.0

USER node
EXPOSE 8787

# Readiness (banco + contrato). Sem curl/wget na imagem: usa fetch do Node.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node","-e","fetch('http://127.0.0.1:'+(process.env.ANALYTICS_PORT||8787)+'/health/ready',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

# Migração e CLI admin usam a MESMA imagem com outro comando:
#   node server/analytics/migrate.ts
#   node server/analytics/admin.ts <create|reset> ...
CMD ["node", "server/analytics/main.ts"]
