# Etapa 1: Utilizar a imagem oficial do Nginx como base
FROM nginx:1.25-alpine

# Instalar 'wget' para ser usado no Healthcheck
# A imagem 'nginx:alpine' padrão não vem com 'wget' ou 'curl'
RUN apk add --no-cache wget

# Remover a página de boas-vindas padrão do Nginx para garantir um ambiente limpo
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos estáticos da sua pasta 'dist' (que está no GitHub)
# para o diretório público do Nginx
# IMPORTANTE: Se a pasta 'dist' não estiver na raiz, ajuste o caminho.
COPY ./dist/ /usr/share/nginx/html/

# Copiar configuração customizada do Nginx (com proxy reverso para API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Verificação de saúde (Healthcheck)
# Isto corrige o erro que você viu no log do Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# O comando para iniciar o Nginx (CMD ["nginx", "-g", "daemon off;"])
# já está definido na imagem base, então não é necessário especificá-lo novamente.