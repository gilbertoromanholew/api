# 🚀 Guia Rápido: Executar Migration 003

## ⚡ Passos Rápidos

### 1️⃣ Copiar SQL

**Windows (PowerShell):**
```powershell
Get-Content .\003_add_role_system.sql | Set-Clipboard
```

**Mac/Linux:**
```bash
cat 003_add_role_system.sql | pbcopy  # Mac
cat 003_add_role_system.sql | xclip -selection clipboard  # Linux
```

**Manualmente:**
- Abra `003_add_role_system.sql`
- Selecione tudo (`Ctrl+A`)
- Copie (`Ctrl+C`)

---

### 2️⃣ Executar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **GDTools**
3. Menu lateral → **SQL Editor**
4. Cole o SQL (`Ctrl+V`)
5. **Importante:** Verifique se o email está correto:
   ```sql
   WHERE email = 'm.gilbertoromanhole@gmail.com'
   ```
6. Clique em **Run** (ou `Ctrl + Enter`)

---

### 3️⃣ Verificar Resultado

Você deve ver:

```
✅ Coluna role adicionada com sucesso

Listando admins:
┌──────────────────────┬─────────────────┬──────────────┬───────┬──────────────────────────┐
│ id                   │ full_name       │ cpf          │ role  │ email                    │
├──────────────────────┼─────────────────┼──────────────┼───────┼──────────────────────────┤
│ uuid...              │ Gilberto Silva  │ 123456789... │ admin │ m.gilbertoromanhole@...  │
└──────────────────────┴─────────────────┴──────────────┴───────┴──────────────────────────┘
```

---

### 4️⃣ Testar no Frontend

1. Acesse: https://gdtools.app/auth
2. Faça login com `m.gilbertoromanhole@gmail.com`
3. Vá para `/dashboard`
4. **Deve aparecer:** Menu "🛡️ Segurança" no sidebar
5. Clique em **Segurança**
6. Deve carregar o dashboard com:
   - Stats cards
   - Alertas recentes
   - Top IPs
   - Métricas

---

### 5️⃣ Testar Endpoints (Opcional)

**Via Browser DevTools:**
```javascript
// Console do navegador (F12)
fetch('https://api.gdtools.app/auth/dashboard', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

**Via cURL:**
```bash
curl -X GET https://api.gdtools.app/auth/dashboard \
  -H "Cookie: sb-access-token=SEU_TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "overview": { ... },
    "alerts": { ... },
    "topIPs": [ ... ],
    "adminUser": {
      "email": "m.gilbertoromanhole@gmail.com",
      "role": "admin"
    }
  }
}
```

---

## ❌ Problemas Comuns

### "Column role does not exist"
→ A migration não foi executada. Execute novamente.

### "Email not found"
→ Verifique se o email está correto no SQL:
```sql
SELECT email FROM auth.users WHERE email LIKE '%gilberto%';
```

### "403 Forbidden"
→ Seu usuário não é admin. Verifique:
```sql
SELECT p.role, u.email 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'SEU_EMAIL';
```

### "401 Unauthorized"
→ Você não está logado. Faça login em `/auth` primeiro.

---

## 🔄 Rollback (Reverter)

Se precisar desfazer:

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS role_check;
DROP INDEX IF EXISTS idx_profiles_role;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
```

⚠️ **CUIDADO:** Isso remove a coluna e **todos os dados** de role!

---

## ✅ Checklist Final

- [ ] Migration executada sem erros
- [ ] Verificação retornou meu usuário como admin
- [ ] Menu "Segurança" aparece no sidebar
- [ ] Dashboard de Segurança carrega sem erros
- [ ] Stats cards mostram dados
- [ ] Alertas aparecem (ou "Nenhum alerta")
- [ ] Auto-refresh funciona

---

## 🎉 Sucesso!

Se todos os itens acima funcionaram, a **Fase 3 está completa e operacional**! 🚀

Próximos passos:
1. ✅ Testar criar alguns alertas (simule força bruta)
2. 📧 Implementar envio de emails (SMTP/Supabase)
3. 📊 Adicionar gráficos (Chart.js)
4. 💾 Migrar para PostgreSQL (opcional)
