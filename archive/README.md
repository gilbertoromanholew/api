# 📦 Archive - Scripts e Documentação de Manutenção

Esta pasta contém scripts SQL essenciais e documentação de referência para manutenção do banco de dados.

---

## 📂 ESTRUTURA

```
archive/
├── 📄 README.md                    ← Você está aqui
├── 📁 sql-scripts/                 ← Scripts SQL de manutenção
│   ├── DIAGNOSTICO_COMPLETO_DB.sql      ← Diagnóstico completo (15 queries)
│   ├── VERIFICAR_ENUMS.sql              ← Validação de ENUMs
│   └── CLEANUP_OBSOLETE_TABLE.sql       ← Remover tabela obsoleta
├── 📁 docs-reference/              ← Documentação de referência
│   ├── ANALISE_BACKEND_VS_DB.md         ← Análise backend vs banco
│   └── DATABASE_V7_STRUCTURE.md         ← Estrutura completa V7
└── 📁 docs-v7/                     ← Auditorias históricas
    ├── AUDITORIA_AUTH.md                ← Auditoria de autenticação
    └── AUDITORIA_SISTEMA_V7.md          ← Auditoria geral V7
```

---

## 🔍 SCRIPTS SQL ESSENCIAIS

### 📊 `DIAGNOSTICO_COMPLETO_DB.sql` ⭐ **MAIS IMPORTANTE**

Script completo com 15 análises do banco de dados:

1. Visão geral - Tabelas e tamanhos
2. Contagem de registros
3. **Estrutura detalhada** - Todas as colunas (recomendado)
4. Primary Keys
5. Foreign Keys
6. Índices
7. RLS Policies
8. Triggers
9. Functions
10. Enums
11. Verificações específicas
12. Integridade referencial
13. Estatísticas de uso
14. Permissões
15. Últimas atividades

**Como usar:**
1. Abrir [Supabase SQL Editor](https://mpanel.samm.host)
2. Copiar a seção desejada (ou todas)
3. Executar (Ctrl+Enter)
4. Analisar resultados JSON

---

### 🔍 `VERIFICAR_ENUMS.sql`

Validação completa de ENUMs personalizados (10 queries):
- Listar todos os ENUMs
- Validar promo_code_type e promo_code_status
- Verificar códigos expirados não marcados
- Estatísticas de uso

**Use quando:** Precisar validar códigos promocionais

---

### 🧹 `CLEANUP_OBSOLETE_TABLE.sql` ⚠️

Script para deletar `economy_subscriptions` (tabela obsoleta):
- Backend usa apenas `subscriptions`
- 5 etapas: verificar → backup → deletar → validar

**⚠️ ATENÇÃO:** Ação destrutiva - executar apenas se necessário

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### 📊 `ANALISE_BACKEND_VS_DB.md`

Análise completa do que o backend realmente usa:
- ✅ `subscriptions` (usada)
- ❌ `economy_subscriptions` (não usada)
- ENUMs personalizados validados
- Estrutura completa das 22 tabelas

---

### 📄 `DATABASE_V7_STRUCTURE.md`

Referência rápida da estrutura do banco:
- 22 tabelas + 3 views
- Organização por módulos
- Descrição de campos

---

## 🎯 CENÁRIOS DE USO

### Ver estrutura do banco:
```sql
-- Execute: sql-scripts/DIAGNOSTICO_COMPLETO_DB.sql (seção 3)
-- Resultado: Todas as tabelas, colunas, tipos, defaults
```

### Validar ENUMs:
```sql
-- Execute: sql-scripts/VERIFICAR_ENUMS.sql
-- Resultado: Status dos códigos promocionais
```

### Analisar uso de ferramentas:
```sql
-- Execute: sql-scripts/DIAGNOSTICO_COMPLETO_DB.sql (seção 13)
-- Resultado: Top 5 ferramentas, distribuição de saldo
```

### Verificar integridade:
```sql
-- Execute: sql-scripts/DIAGNOSTICO_COMPLETO_DB.sql (seção 12)
-- Resultado: Dados órfãos, inconsistências
```

---

## ⚠️ IMPORTANTE

### ✅ Execute sempre que quiser:
- ✅ `DIAGNOSTICO_COMPLETO_DB.sql` - Apenas leitura, sem riscos

### ⚠️ Execute com cuidado:
- ⚠️ `CLEANUP_OBSOLETE_TABLE.sql` - Deleta tabela (irreversível)

### 📖 Apenas leia:
- 📖 Toda a pasta `docs-reference/`
- 📖 Toda a pasta `docs-v7/`

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://mpanel.samm.host
- **Supabase SQL Editor:** https://mpanel.samm.host/project/.../editor/sql

---

_Última atualização: 25/10/2025_
