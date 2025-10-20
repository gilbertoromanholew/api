# 🕐 Configuração de Limpeza Automática de OTPs

## 📋 Visão Geral

Este documento explica como configurar a limpeza automática de códigos OTP expirados no Supabase.

## 🎯 Objetivo

Códigos OTP têm validade de **10 minutos**. Após expirar, eles devem ser removidos automaticamente do banco de dados para:
- ✅ Economizar espaço
- ✅ Melhorar performance de queries
- ✅ Manter banco organizado

## 🚀 Opções de Implementação

### Opção 1: pg_cron (Recomendado para self-hosted)

**Vantagens:**
- ✅ Limpeza programada e automática
- ✅ Executa a cada hora
- ✅ Não depende de tráfego na aplicação

**Desvantagens:**
- ❌ Requer extensão pg_cron habilitada
- ❌ Pode não estar disponível no Supabase Cloud

**Como configurar:**

1. Acesse o **SQL Editor** do Supabase
2. Execute o arquivo `setup_otp_cleanup.sql` (primeira parte)
3. Verifique se foi agendado:
```sql
SELECT * FROM cron.job WHERE jobname = 'clean-expired-otp-codes';
```

---

### Opção 2: Trigger (Funciona em qualquer ambiente)

**Vantagens:**
- ✅ Funciona no Supabase Cloud
- ✅ Não precisa de pg_cron
- ✅ Limpa sempre que novo OTP é inserido

**Desvantagens:**
- ❌ Só limpa quando há inserção de novo OTP
- ❌ Se não houver registros, códigos expirados ficam no banco

**Como configurar:**

1. Acesse o **SQL Editor** do Supabase
2. Execute o arquivo `setup_otp_cleanup.sql` (segunda parte - ALTERNATIVA)
3. Pronto! A limpeza acontecerá automaticamente

**Código:**
```sql
CREATE OR REPLACE FUNCTION trigger_clean_expired_otp_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM otp_codes
    WHERE expires_at < NOW()
    AND used_at IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS clean_expired_otp_on_insert ON otp_codes;
CREATE TRIGGER clean_expired_otp_on_insert
    BEFORE INSERT ON otp_codes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_clean_expired_otp_before_insert();
```

---

### Opção 3: Limpeza via API (Fallback)

Se nenhuma das opções acima funcionar, podemos adicionar um endpoint na API que limpa códigos expirados:

**Vantagens:**
- ✅ Controle total pela aplicação
- ✅ Pode ser chamado por cron externo (GitHub Actions, etc)

**Desvantagens:**
- ❌ Requer chamada manual ou scheduler externo

**Implementação:**
```javascript
// Adicionar em authRoutes.js
router.post('/admin/cleanup-expired-otp', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabaseAdmin.rpc('clean_expired_otp_codes');
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Códigos OTP expirados removidos com sucesso'
        });
    } catch (error) {
        console.error('Erro ao limpar OTPs:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao limpar códigos expirados'
        });
    }
});
```

Depois, agendar chamada via cron:
```bash
# GitHub Actions (.github/workflows/cleanup-otp.yml)
name: Cleanup Expired OTPs
on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X POST https://samm.host/api/admin/cleanup-expired-otp \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"
```

---

## 📊 Monitoramento

### Ver estatísticas de OTPs:

```sql
-- Ver quantos códigos OTP existem (total)
SELECT COUNT(*) as total_otp_codes FROM otp_codes;

-- Ver quantos códigos estão expirados mas não usados
SELECT COUNT(*) as expired_unused_codes 
FROM otp_codes 
WHERE expires_at < NOW() AND used_at IS NULL;

-- Ver quantos códigos foram usados
SELECT COUNT(*) as used_codes 
FROM otp_codes 
WHERE used_at IS NOT NULL;

-- Ver códigos OTP por status
SELECT 
    CASE 
        WHEN used_at IS NOT NULL THEN 'usado'
        WHEN expires_at < NOW() THEN 'expirado'
        ELSE 'valido'
    END as status,
    COUNT(*) as quantidade
FROM otp_codes
GROUP BY status;
```

### Ver execuções do cron (se usar pg_cron):

```sql
-- Ver últimas execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'clean-expired-otp-codes') 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🎯 Recomendação

**Para Supabase Self-Hosted (Coolify):**
- Use **Opção 2 (Trigger)** - Mais simples e funciona sem configuração extra

**Para Supabase Cloud:**
- Use **Opção 2 (Trigger)** - Garantido que funciona

**Para controle total:**
- Use **Opção 3 (API + GitHub Actions)** - Mais flexível

---

## ✅ Checklist de Implementação

- [ ] Executar `setup_otp_cleanup.sql` no SQL Editor
- [ ] Verificar se função `clean_expired_otp_codes()` existe
- [ ] Testar limpeza manual: `SELECT clean_expired_otp_codes();`
- [ ] Aguardar 1 hora e verificar se limpeza automática funcionou
- [ ] Monitorar logs para erros

---

## 🐛 Troubleshooting

**Erro: "extension pg_cron does not exist"**
- Solução: Use Opção 2 (Trigger) ao invés de pg_cron

**Erro: "permission denied for function clean_expired_otp_codes"**
- Solução: Execute a função com `SECURITY DEFINER` (já está no script)

**Códigos não estão sendo removidos:**
- Verifique se trigger foi criado: `SELECT * FROM pg_trigger WHERE tgname = 'clean_expired_otp_on_insert';`
- Execute limpeza manual: `SELECT clean_expired_otp_codes();`

---

## 📝 Notas Importantes

1. **Backup antes de configurar**: Sempre faça backup antes de executar scripts SQL
2. **Teste em desenvolvimento primeiro**: Teste a configuração em ambiente de dev
3. **Monitore após implementar**: Verifique se está funcionando corretamente
4. **Performance**: A limpeza é rápida e não impacta performance

---

**Precisa de ajuda? Me avise!** 🚀
