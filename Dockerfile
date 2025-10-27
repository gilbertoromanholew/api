# Build stage
FROM node:22-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências da pasta dist-api
COPY ./dist-api/package*.json ./

# Instalar TODAS as dependências
RUN npm ci

# Copiar código fonte da pasta dist-api
COPY ./dist-api/ .

# Production stage
FROM node:22-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl wget

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar package files
COPY ./dist-api/package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar código do builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./server.js

# [CORREÇÃO] Dar ao usuário 'nodejs' a propriedade de todo o diretório /app
# Isso permitirá que ele crie a pasta /app/logs
RUN chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta 3000 (porta da API Node.js)
EXPOSE 3000

# Health check na porta 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de inicialização (Node.js, não Nginx!)
CMD ["node", "server.js"]