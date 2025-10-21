-- Execute este SQL no Supabase SQL Editor para verificar o CPF

-- 1. Ver TODOS os CPFs da tabela profiles
SELECT id, cpf, full_name, LENGTH(cpf) as cpf_length, email_verified, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 2. Buscar especificamente por 70109948467 (sem formatação)
SELECT id, cpf, full_name, LENGTH(cpf) as cpf_length
FROM public.profiles
WHERE cpf = '70109948467';

-- 3. Buscar com formatação
SELECT id, cpf, full_name, LENGTH(cpf) as cpf_length
FROM public.profiles
WHERE cpf = '701.099.484-67';

-- 4. Buscar parcialmente (qualquer CPF que contenha esses números)
SELECT id, cpf, full_name, LENGTH(cpf) as cpf_length
FROM public.profiles
WHERE cpf LIKE '%70109948467%' OR cpf LIKE '%701.099.484-67%';

-- 5. Verificar tipo da coluna cpf
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'cpf';
