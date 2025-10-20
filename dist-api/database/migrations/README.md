# 📁 Database Migrations

Pasta de migrations SQL para o banco de dados PostgreSQL (Supabase).

## 🔄 Como Executar Migrations

### Via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo da migration
5. Copie e cole o conteúdo
6. Clique em **Run** (ou `Ctrl + Enter`)
7. Verifique os resultados

### Via CLI (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Executar migration
supabase db push
```

---

## 📋 Histórico de Migrations

| # | Arquivo | Data | Descrição | Status |
|---|---------|------|-----------|--------|
| 001 | `001_initial_schema.sql` | - | Schema inicial (já aplicado) | ✅ |
| 002 | `002_add_unique_constraints.sql` | - | Constraints únicos (já aplicado) | ✅ |
| **003** | **`003_add_role_system.sql`** | **20/10/2025** | **Sistema de Roles (Fase 3)** | ⏳ **PENDENTE** |

---

## 🚀 Migration 003: Role System

### O que faz?

Adiciona sistema de roles para autenticação admin na **Fase 3**.

### Mudanças:

1. ✅ Adiciona coluna `role` na tabela `profiles`
   - Valores permitidos: `'user'`, `'admin'`, `'moderator'`
   - Default: `'user'`
   
2. ✅ Cria índice `idx_profiles_role` para performance

3. ✅ Adiciona constraint de validação

4. ✅ Atualiza usuário principal para admin

### Como executar:

```sql
-- Copie e execute o conteúdo de:
-- database/migrations/003_add_role_system.sql
```

### Verificação:

```sql
-- Ver todos os admins
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

### Rollback (se necessário):

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS role_check;
DROP INDEX IF EXISTS idx_profiles_role;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
```

---

## ⚠️ Importante

- **Sempre faça backup antes** de executar migrations em produção
- **Teste em ambiente de dev** primeiro
- **Verifique os resultados** após executar
- **Não execute rollback** sem necessidade (perda de dados)

---

## 📚 Estrutura da Tabela `profiles` (Após Migration 003)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  cpf VARCHAR(14) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES auth.users(id),
  email_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',  -- ← NOVO!
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT role_check CHECK (role IN ('user', 'admin', 'moderator'))
);
```

---

## 🔗 Relacionado

- **Fase 3:** Sistema de Alertas e Dashboard de Segurança
- **Arquivo:** `src/middlewares/adminAuth.js`
- **Endpoints:** `src/routes/authRoutes.js`
- **Documentação:** `FASE3_IMPLEMENTADA.md`
