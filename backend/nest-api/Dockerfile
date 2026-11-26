# syntax=docker/dockerfile:1
# ============================================================
# Sistema Paroquial - API (NestJS + Prisma 7)
# Contexto de build: backend/nest-api
#
#   Imagem da API (padrão):   docker build -t paroquia-api .
#   Imagem de migration:      docker build --target migrator -t paroquia-migrator .
#
# Nenhum segredo entra na imagem: tudo vem do .env em runtime.
# ============================================================

ARG NODE_VERSION=24

# ------------------------------------------------------------
# base: Debian slim (glibc) -> sharp e bcrypt usam binários prontos,
# sem precisar de compilador.
# ------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# ------------------------------------------------------------
# deps: todas as dependências (inclui dev, o build precisa delas).
# Só refaz quando package.json/package-lock.json mudam (cache).
# ------------------------------------------------------------
FROM base AS deps
# OpenSSL: a CLI do Prisma (generate/migrate) usa o schema engine, que precisa
# dele. Só nos stages de build/migrator; o runtime (adapter-pg) não precisa.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------
# build: prisma generate ANTES do nest build.
# O client gerado (generated/prisma) é importado pelo src, então o
# nest build compila ele junto -> dist/src/main.js + dist/generated/...
# ------------------------------------------------------------
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ------------------------------------------------------------
# prod-deps: só dependências de produção, em pasta limpa.
# ------------------------------------------------------------
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ------------------------------------------------------------
# migrator (uso único): prisma migrate deploy e, uma vez, seed:prod.
# Parte do build porque precisa da CLI do prisma, do tsx, da pasta
# prisma/ e do client gerado. Nunca roda junto com a API.
# ------------------------------------------------------------
FROM build AS migrator
ENV NODE_ENV=production
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# ------------------------------------------------------------
# runtime (imagem final, padrão do docker build)
# Arquivos ficam com dono root e só leitura para o usuário "node":
# o processo não consegue alterar o próprio código.
# ------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node
EXPOSE 3000

# fetch nativo do Node: o slim não tem curl. Lê a PORT do ambiente.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# node direto (não npm): o SIGTERM chega no processo e o
# enableShutdownHooks() fecha o Prisma antes de sair.
CMD ["node", "dist/src/main"]
