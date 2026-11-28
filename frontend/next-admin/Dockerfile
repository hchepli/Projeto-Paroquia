# syntax=docker/dockerfile:1
# ============================================================
# Sistema Paroquial - Admin (Next.js 16, output standalone)
# Contexto de build: frontend/next-admin
#
#   Dev/staging (Cloudinary, padrão):
#     docker build -t paroquia-admin .
#   Produção (R2):
#     docker build --build-arg IMAGE_HOSTS=<host-publico-do-bucket> -t paroquia-admin .
#   Provar que o build não depende de rede (fonte local):
#     docker build --network=none ...   (depois que o stage deps estiver em cache)
#
# BUILD x RUNTIME:
#   - IMAGE_HOSTS e NODE_ENV entram no BUILD (next.config é serializado
#     no server.js). Trocar de storage = rebuild.
#   - NEST_API_URL é lida em RUNTIME (src/lib/api.ts), vem do .env do compose.
#   - Nenhum segredo entra na imagem.
# ============================================================

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NEXT_TELEMETRY_DISABLED=1

# ------------------------------------------------------------
# deps: todas as dependências (o build precisa das dev: TS, Tailwind).
# ------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------
# build: next build gera .next/standalone (server.js + node_modules mínimo).
# Lint/testes NÃO rodam aqui: são papel do CI (Bloco 6).
# ------------------------------------------------------------
FROM deps AS build
ARG IMAGE_HOSTS=res.cloudinary.com
ENV IMAGE_HOSTS=${IMAGE_HOSTS} \
    NODE_ENV=production
COPY . .
RUN npm run build

# ------------------------------------------------------------
# runtime: só o standalone + estáticos. Arquivos com dono root,
# só leitura para o usuário "node".
# ------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
# O standalone NÃO inclui estes dois: sem eles a página sobe sem CSS/JS.
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# O cache de otimização de imagens (next/image) precisa de escrita.
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# node direto (não npm) para o SIGTERM chegar ao processo.
CMD ["node", "server.js"]
