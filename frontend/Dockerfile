# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Build args: Easypanel pode enviar EXPO_PUBLIC_* ou VITE_* (legado do Site)
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_MEI_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Normaliza nomes e exporta web (variáveis ficam inlined no bundle se presentes)
RUN set -e; \
  export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-$VITE_SUPABASE_URL}"; \
  export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}"; \
  export EXPO_PUBLIC_MEI_API_URL="${EXPO_PUBLIC_MEI_API_URL:-$VITE_API_URL}"; \
  if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then \
    echo "⚠️  BUILD: Supabase vazio — OK se Environment do Easypanel tiver as vars (runtime via env-config.js)."; \
  else \
    echo "✓ BUILD: Supabase configurado."; \
  fi; \
  npx expo export --platform web --clear && \
  node scripts/patch-web-index.mjs dist/index.html && \
  cp -f public/legal.css public/privacidade.html public/termos.html dist/

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
