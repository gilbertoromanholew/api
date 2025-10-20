#!/bin/bash

# ========================================
# Script de Aplicação da Migration 003
# Role System para Fase 3
# ========================================

echo "🚀 Iniciando Migration 003: Role System"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se arquivo existe
if [ ! -f "003_add_role_system.sql" ]; then
    echo -e "${RED}❌ Erro: Arquivo 003_add_role_system.sql não encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Esta migration irá:${NC}"
echo "   1. Adicionar coluna 'role' na tabela profiles"
echo "   2. Criar índice idx_profiles_role"
echo "   3. Adicionar constraint de validação"
echo "   4. Tornar você admin"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   - Execute isso no SQL Editor do Supabase"
echo "   - NÃO execute em produção sem backup"
echo "   - Verifique seu email no arquivo SQL"
echo ""

read -p "Deseja ver o conteúdo da migration? (s/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo ""
    echo -e "${GREEN}📄 Conteúdo da Migration:${NC}"
    echo "========================================"
    cat 003_add_role_system.sql
    echo ""
    echo "========================================"
fi

echo ""
echo -e "${GREEN}✅ Próximos passos:${NC}"
echo ""
echo "1. Acesse: https://supabase.com/dashboard"
echo "2. Selecione seu projeto"
echo "3. Vá em 'SQL Editor'"
echo "4. Copie o conteúdo de 003_add_role_system.sql"
echo "5. Cole e execute (Ctrl + Enter)"
echo "6. Verifique se retornou seu usuário como admin"
echo ""
echo -e "${YELLOW}🔗 Comando para copiar para clipboard (Mac):${NC}"
echo "   cat 003_add_role_system.sql | pbcopy"
echo ""
echo -e "${YELLOW}🔗 Comando para copiar para clipboard (Linux):${NC}"
echo "   cat 003_add_role_system.sql | xclip -selection clipboard"
echo ""
echo -e "${YELLOW}🔗 Comando para copiar para clipboard (Windows Git Bash):${NC}"
echo "   cat 003_add_role_system.sql | clip"
echo ""

# Opção de copiar automaticamente (Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Copiar para clipboard agora? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        cat 003_add_role_system.sql | pbcopy
        echo -e "${GREEN}✅ SQL copiado para clipboard!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Migration preparada com sucesso!${NC}"
