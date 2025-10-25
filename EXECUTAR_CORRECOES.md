# 🚀 SCRIPT DE CORREÇÃO COMPLETA

## Executar no PowerShell (como administrador):

```powershell
# 1. Ir para pasta da API
cd "C:\Users\Gilberto Silva\Documents\GitHub\api"

# 2. Reiniciar backend
pm2 restart all

# 3. Ver logs em tempo real
pm2 logs --lines 50
```

## Executar no Supabase SQL Editor (https://mpanel.samm.host):

```sql
-- Script completo em: api/FIX_BUGS_PRE_V8.sql
-- Copiar e colar TODO o conteúdo e executar (Ctrl+Enter)
```

## Testar no navegador:

1. Abrir: http://localhost:5173/dashboard/ferramentas
2. Abrir console (F12)
3. Verificar logs:
   - ✅ "📊 Total de ferramentas (backend): 15"
   - ✅ "✅ 15 ferramentas carregadas do Supabase"

---

## Se ainda não funcionar:

Execute no terminal do servidor:
```powershell
# Ver logs do backend
pm2 logs api --lines 100
```

Procure por:
- `🔍 [Tools] Buscando ferramentas do banco...`
- `📊 [Tools] Total de ferramentas encontradas: 15`

Se mostrar 0, me mande o log completo!
