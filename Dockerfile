FROM node:22-slim
WORKDIR /app

# Copia arquivos de configuração do monorepo
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instala as dependências (incluindo workspaces)
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do backend (configurada no env.js como 3333)
EXPOSE 3333

# Docker / Easypanel: marca o contentor como "healthy" só com rota pública (evita 401 de /api/*).
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

WORKDIR /app/backend
CMD ["node", "src/server.js"]
