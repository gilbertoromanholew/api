-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔒 ADICIONAR CONSTRAINTS UNIQUE PARA CPF E EMAIL
-- ═══════════════════════════════════════════════════════════════════════════════
-- Data: 20/10/2025
-- Objetivo: Prevenir duplicatas de CPF e email na tabela profiles
-- ═══════════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 1: VERIFICAR SE EXISTEM DUPLICATAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1.1 Verificar CPFs duplicados
SELECT 
    cpf, 
    COUNT(*) as total_duplicatas,
    STRING_AGG(id::text, ', ') as ids_duplicados,
    STRING_AGG(full_name, ' | ') as nomes
FROM public.profiles 
GROUP BY cpf 
HAVING COUNT(*) > 1
ORDER BY total_duplicatas DESC;

-- 1.2 Verificar emails duplicados (se a coluna existir)
-- NOTA: profiles NÃO tem coluna email, email está em auth.users
-- Este query é só para referência caso você adicione email no futuro
-- SELECT 
--     email, 
--     COUNT(*) as total_duplicatas,
--     STRING_AGG(id::text, ', ') as ids_duplicados
-- FROM public.profiles 
-- GROUP BY email 
-- HAVING COUNT(*) > 1
-- ORDER BY total_duplicatas DESC;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 2: LIMPAR DUPLICATAS (SE EXISTIREM)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 2.1 OPÇÃO A: Deletar duplicatas mantendo o mais recente (RECOMENDADO)
-- Execute este query SOMENTE se encontrou duplicatas no PASSO 1

-- Para CPF duplicado:
DELETE FROM public.profiles 
WHERE id IN (
    SELECT id 
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY cpf 
                ORDER BY created_at DESC, id DESC
            ) as row_num
        FROM public.profiles
    ) duplicates
    WHERE row_num > 1
);

-- 2.2 OPÇÃO B: Deletar um ID específico manualmente
-- Use este se preferir escolher qual registro deletar
-- Substitua 'ID_PARA_DELETAR' pelo ID que você quer remover

-- DELETE FROM public.profiles WHERE id = 'ID_PARA_DELETAR';

-- Exemplo com o CPF duplicado que encontramos antes:
-- DELETE FROM public.profiles WHERE id = '79c9845a-245f-4961-ac4b-122112abe183';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 3: ADICIONAR CONSTRAINT UNIQUE PARA CPF
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 3.1 Adicionar constraint UNIQUE na coluna CPF
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- 3.2 Criar index para melhorar performance de buscas por CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf 
ON public.profiles(cpf);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 4: VERIFICAR SE OS CONSTRAINTS FORAM CRIADOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 4.1 Listar todos os constraints da tabela profiles
SELECT
    conname as constraint_name,
    contype as constraint_type,
    CASE contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END as type_description,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- 4.2 Listar todos os indexes da tabela profiles
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY indexname;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 5: TESTAR SE OS CONSTRAINTS ESTÃO FUNCIONANDO
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 5.1 Tentar inserir CPF duplicado (DEVE FALHAR)
-- Este comando deve retornar erro: "duplicate key value violates unique constraint"
-- NÃO EXECUTE ESTE TESTE, é só para referência:

-- INSERT INTO public.profiles (id, cpf, full_name)
-- VALUES (
--     gen_random_uuid(),
--     '70109948467', -- CPF que já existe
--     'Teste Duplicado'
-- );
-- ❌ Erro esperado: duplicate key value violates unique constraint "profiles_cpf_unique"


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 6: REMOVER CONSTRAINTS (ROLLBACK - Use só se precisar desfazer)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 6.1 Remover constraint UNIQUE do CPF (se precisar reverter)
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_unique;

-- 6.2 Remover index do CPF (se precisar reverter)
-- DROP INDEX IF EXISTS idx_profiles_cpf;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 📋 INSTRUÇÕES DE USO
-- ═══════════════════════════════════════════════════════════════════════════════

/*

ORDEM DE EXECUÇÃO:

1️⃣ VERIFICAR DUPLICATAS
   → Execute o PASSO 1.1 para ver se existem CPFs duplicados
   
2️⃣ LIMPAR DUPLICATAS (se encontrou no passo 1)
   → Execute o PASSO 2.1 (deletar automaticamente mantendo o mais recente)
   → OU execute o PASSO 2.2 (deletar IDs específicos manualmente)
   
3️⃣ ADICIONAR CONSTRAINT
   → Execute o PASSO 3.1 (adicionar UNIQUE constraint)
   → Execute o PASSO 3.2 (criar index para performance)
   
4️⃣ VERIFICAR
   → Execute o PASSO 4.1 e 4.2 para confirmar que foi criado
   
5️⃣ CONFIRMAR
   → Veja se aparece "profiles_cpf_unique" na lista de constraints


NOTA IMPORTANTE SOBRE EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ A tabela public.profiles NÃO tem coluna 'email'
✅ Email está armazenado em auth.users (gerenciado pelo Supabase)
✅ Email JÁ É ÚNICO por padrão (Supabase garante isso)

Por isso, NÃO é necessário adicionar constraint para email!

ESTRUTURA ATUAL:
├── auth.users (Supabase)
│   ├── id (PK, UUID)
│   └── email (UNIQUE - já garantido pelo Supabase) ✅
│
└── public.profiles (Custom)
    ├── id (PK, FK → auth.users.id)
    └── cpf (precisa ser UNIQUE) ← Vamos adicionar agora!


RESULTADO ESPERADO:
━━━━━━━━━━━━━━━━━━
Após executar este script:

✅ CPF será ÚNICO (não permite duplicatas)
✅ Email já é ÚNICO (garantido pelo Supabase)
✅ Tentativas de cadastro com CPF duplicado falharão
✅ API retornará erro claro ao tentar duplicar
✅ Integridade de dados garantida

*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DO SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════
