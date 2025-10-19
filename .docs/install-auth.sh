#!/bin/bash

# Script de instalação das dependências necessárias

echo "🚀 Instalando dependências para o sistema de autenticação..."

# Instalar dependências
npm install @supabase/supabase-js cookie-parser

echo "✅ Dependências instaladas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute o SQL no Supabase Studio (database/schema.sql)"
echo "2. Configure as variáveis de ambiente no .env"
echo "3. Inicie o servidor: npm start"
echo "4. Teste os endpoints com Postman/Insomnia"
