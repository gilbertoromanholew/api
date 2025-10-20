-- ============================================
-- CONFIGURAÇÃO DE LIMPEZA AUTOMÁTICA DE OTPs EXPIRADOS
-- ============================================
-- Este script configura a limpeza automática de códigos OTP expirados
-- usando pg_cron para executar a cada hora

-- Habilitar a extensão pg_cron (se ainda não estiver habilitada)
-- NOTA: No Supabase self-hosted, você precisa habilitar isso via dashboard
-- ou executando como superuser
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar limpeza automática de códigos OTP expirados
-- Executa a cada hora (0 minutos de cada hora)
SELECT cron.schedule(
    'clean-expired-otp-codes',           -- Nome da tarefa
    '0 * * * *',                         -- Cron expression: A cada hora
    $$SELECT clean_expired_otp_codes()$$ -- Comando SQL a executar
);

-- Verificar se a tarefa foi agendada com sucesso
SELECT * FROM cron.job WHERE jobname = 'clean-expired-otp-codes';

-- ============================================
-- ALTERNATIVA: Trigger automático
-- ============================================
-- Se pg_cron não estiver disponível, você pode usar um trigger
-- que limpa códigos expirados antes de inserir novos

CREATE OR REPLACE FUNCTION trigger_clean_expired_otp_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpar códigos expirados antes de inserir novo
    DELETE FROM otp_codes
    WHERE expires_at < NOW()
    AND used_at IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela otp_codes
DROP TRIGGER IF EXISTS clean_expired_otp_on_insert ON otp_codes;
CREATE TRIGGER clean_expired_otp_on_insert
    BEFORE INSERT ON otp_codes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_clean_expired_otp_before_insert();

-- ============================================
-- COMANDOS ÚTEIS
-- ============================================

-- Listar todas as tarefas agendadas:
-- SELECT * FROM cron.job;

-- Remover agendamento (se necessário):
-- SELECT cron.unschedule('clean-expired-otp-codes');

-- Executar limpeza manualmente:
-- SELECT clean_expired_otp_codes();

-- Ver últimas execuções da tarefa:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'clean-expired-otp-codes') ORDER BY start_time DESC LIMIT 10;

-- ============================================
-- ESTATÍSTICAS
-- ============================================

-- Ver quantos códigos OTP existem (total)
-- SELECT COUNT(*) as total_otp_codes FROM otp_codes;

-- Ver quantos códigos estão expirados mas não usados
-- SELECT COUNT(*) as expired_unused_codes 
-- FROM otp_codes 
-- WHERE expires_at < NOW() AND used_at IS NULL;

-- Ver quantos códigos foram usados
-- SELECT COUNT(*) as used_codes 
-- FROM otp_codes 
-- WHERE used_at IS NOT NULL;

-- Ver códigos OTP por status
-- SELECT 
--     CASE 
--         WHEN used_at IS NOT NULL THEN 'usado'
--         WHEN expires_at < NOW() THEN 'expirado'
--         ELSE 'valido'
--     END as status,
--     COUNT(*) as quantidade
-- FROM otp_codes
-- GROUP BY status;
