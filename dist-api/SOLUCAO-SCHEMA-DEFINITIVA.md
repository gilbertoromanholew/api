# 🔧 Solução Definitiva: Configurar Schemas V7 no Supabase/Coolify

## Problema
O Supabase JS adiciona automaticamente `public.` antes de TODAS as tabelas, fazendo:
- `.from('tools.catalog')` → consulta `public.tools.catalog` ❌
- Isso causa erro: `relation "public.tools.catalog" does not exist`

## Solução: Configurar PostgREST no Coolify

### Passo 1: Acessar Configuração do PostgREST

1. Acesse seu Coolify: https://coolify.io (ou URL do seu Coolify)
2. Vá em **Projects** → **Supabase**
3. Clique no servi

ço **PostgREST** (ou **rest**)

### Passo 2: Adicionar Variável de Ambiente

Adicione ou edite a seguinte variável de ambiente no container PostgREST:

```bash
PGRST_DB_SCHEMAS="public,tools,economy,social"
```

**OU** se já existe `PGRST_DB_SCHEMA` (singular), substitua por:

```bash
PGRST_DB_SCHEMA=public,tools,economy,social
```

### Passo 3: Restart do PostgREST

1. Salve as configurações
2. Reinicie o serviço PostgREST
3. Aguarde ~30 segundos para o cache atualizar

### Passo 4: Verificar se Funcionou

Execute este script para testar:

```javascript
// test-schema-access.js
import { supabaseAdmin } from './src/config/supabase.js';

const test = await supabaseAdmin.from('tools.catalog').select('*').limit(1);
console.log('✅ Sucesso:', test.data);
console.log('❌ Erro:', test.error);
```

Se retornar dados, funcionou! ✅

---

## Alternativa: Via Docker Compose (se usar)

Se você usa Docker Compose, edite o arquivo e adicione:

```yaml
services:
  rest:
    image: postgrest/postgrest
    environment:
      PGRST_DB_SCHEMAS: "public,tools,economy,social"
      PGRST_DB_ANON_ROLE: "anon"
      PGRST_DB_URI: "postgresql://..."
```

---

## Alternativa 2: Via SQL (Configuração do Banco)

Se não tiver acesso ao Coolify, configure diretamente no PostgreSQL:

```sql
-- Adicionar schemas ao search_path do role authenticator
ALTER ROLE authenticator SET search_path TO public, tools, economy, social;

-- Adicionar schemas ao search_path do role anon
ALTER ROLE anon SET search_path TO public, tools, economy, social;

-- Adicionar schemas ao search_path do role authenticated
ALTER ROLE authenticated SET search_path TO public, tools, economy, social;

-- Recarregar configurações
SELECT pg_reload_conf();
```

Execute isso no Supabase SQL Editor e reinicie as conexões.

---

## Verificação Final

Depois de aplicar a solução, teste:

```bash
cd "C:\Users\Gilberto Silva\Documents\GitHub\api\dist-api"
node test-schema-access.js
```

Deve retornar:
```
✅ Sucesso: [{ id: ..., name: ..., ... }]
❌ Erro: null
```

---

## 📋 Próximos Passos (Depois da Configuração)

1. ✅ Configurar PostgREST com schemas corretos
2. ✅ Testar acesso via Supabase JS
3. ✅ Reiniciar backend: `node server.js`
4. ✅ Testar endpoints no browser

---

## 🆘 Se Não Funcionar

Me envie:
1. Screenshot da configuração do PostgREST no Coolify
2. Output do comando: `node test-schema-access.js`
3. Logs do container PostgREST

Vou te ajudar a debugar! 🚀
