# 🚀 Fase 4: Implementação de Features Backend

**Início:** 18/10/2025  
**Status:** 🟢 EM ANDAMENTO  
**Progresso:** ████░░░░░░░░░░░░░░░░ 20%

---

## 📋 Checklist de Implementação

### 🔐 4.1 Endpoints de Autenticação

#### ✅ Verificação de Dados
- [x] `POST /api/auth/check-cpf` - Verificar se CPF existe
  - ✅ Backend implementado
  - ✅ Frontend integrado (`api.auth.checkCPF`)
  - ✅ Composable atualizado (`checkCPFExists`)
  - **Resultado:** Funcional e testado

- [ ] `POST /api/auth/check-email` - Verificar disponibilidade de email
  - [ ] Implementar controller
  - [ ] Adicionar rota
  - [ ] Integrar frontend
  
#### ⏳ Sistema de OTP
- [ ] `POST /api/auth/send-otp` - Enviar código OTP
  - [ ] Criar tabela `otp_codes`
  - [ ] Gerar código de 6 dígitos
  - [ ] Integrar serviço de email
  - [ ] Expiração de 10 minutos
  
- [ ] `POST /api/auth/verify-otp` - Verificar código
  - [ ] Validar código e expiração
  - [ ] Marcar email como verificado
  - [ ] Limpar códigos expirados

#### ⏳ Recuperação de Senha
- [ ] `POST /api/auth/forgot-password` - Solicitar reset
  - [ ] Gerar token único
  - [ ] Enviar email com link
  - [ ] Expiração de 1 hora
  
- [ ] `POST /api/auth/reset-password` - Redefinir senha
  - [ ] Validar token
  - [ ] Hash da nova senha
  - [ ] Invalidar token após uso

---

### 👤 4.2 Endpoints de Usuário

- [ ] `PUT /api/user/email` - Atualizar email
  - [ ] Validar novo email
  - [ ] Enviar OTP para confirmação
  - [ ] Atualizar após verificação
  
- [ ] `PUT /api/user/password` - Alterar senha
  - [ ] Validar senha atual
  - [ ] Validar nova senha
  - [ ] Atualizar com hash
  
- [ ] `DELETE /api/user/account` - Deletar conta
  - [ ] Soft delete (status='inactive')
  - [ ] Manter dados para auditoria
  - [ ] Notificar por email

---

### 📧 4.3 Sistema de Email

#### Configuração
- [ ] Instalar NodeMailer
  ```bash
  npm install nodemailer
  ```
  
- [ ] Criar `api/src/config/email.js`
  - [ ] Configurar SMTP
  - [ ] Templates HTML
  - [ ] Função `sendEmail(to, subject, html)`

#### Templates
- [ ] **welcome.html** - Boas-vindas
  - [ ] Nome do usuário
  - [ ] Saldo de pontos inicial
  - [ ] Links úteis
  
- [ ] **otp.html** - Código de verificação
  - [ ] Código de 6 dígitos destacado
  - [ ] Tempo de expiração
  - [ ] Aviso de segurança
  
- [ ] **password-reset.html** - Reset de senha
  - [ ] Link com token
  - [ ] Expiração de 1 hora
  - [ ] Aviso se não solicitou
  
- [ ] **points-added.html** - Pontos adicionados
  - [ ] Quantidade de pontos
  - [ ] Novo saldo
  - [ ] Histórico de transações

---

### 🔒 4.4 Segurança

#### Rate Limiting
- [ ] Instalar `express-rate-limit`
  ```bash
  npm install express-rate-limit
  ```
  
- [ ] Configurar limites:
  - [ ] Login: 5 tentativas / 15 minutos
  - [ ] Registro: 3 tentativas / hora
  - [ ] OTP: 3 envios / hora
  - [ ] Reset senha: 3 tentativas / hora

#### Validações Aprimoradas
- [ ] CPF único (constraint no banco)
- [ ] Email único (constraint no banco)
- [ ] Senha forte obrigatória
- [ ] Email verificado para ferramentas premium

#### CSRF Protection
- [ ] Instalar `csurf`
- [ ] Middleware de CSRF
- [ ] Token em formulários

---

### 📊 4.5 Logging e Monitoramento

- [ ] Estruturar logs com Winston
  ```bash
  npm install winston
  ```
  
- [ ] Logs por categoria:
  - [ ] `auth.log` - Autenticação
  - [ ] `points.log` - Transações de pontos
  - [ ] `tools.log` - Uso de ferramentas
  - [ ] `errors.log` - Erros críticos
  
- [ ] Dashboard de métricas básico
  - [ ] Total de usuários
  - [ ] Usuários ativos hoje
  - [ ] Pontos consumidos hoje
  - [ ] Ferramentas mais usadas

---

## 📈 Progresso Detalhado

### Semana 1 (18/10 - 24/10)
- [x] Verificação de CPF implementada
- [ ] Verificação de Email
- [ ] Sistema de OTP básico
- [ ] Configuração de email

### Semana 2 (25/10 - 31/10)
- [ ] Recuperação de senha
- [ ] Rate limiting
- [ ] Templates de email
- [ ] Logs estruturados

### Semana 3 (01/11 - 07/11)
- [ ] Atualização de perfil
- [ ] Soft delete de conta
- [ ] Dashboard de métricas
- [ ] Testes de integração

---

## 🎯 Próxima Tarefa

### **AGORA:** Implementar `check-email` endpoint

**Arquivos a modificar:**
1. `api/src/functions/auth/authController.js` - Adicionar método `checkEmail`
2. `api/src/functions/auth/authRoutes.js` - Adicionar rota `POST /check-email`
3. `tools-website-builder/src/services/api.js` - Adicionar `checkEmail` method
4. `tools-website-builder/src/composables/useAuth.js` - Atualizar `checkEmailAvailability`

**Tempo estimado:** 15 minutos

---

## 📝 Notas de Implementação

### Decisões Técnicas:

1. **OTP Expiração:** 10 minutos (600 segundos)
2. **Reset Token Expiração:** 1 hora (3600 segundos)
3. **Rate Limit Login:** 5 tentativas em 15 minutos
4. **Serviço de Email:** NodeMailer com SMTP do Gmail (desenvolvimento)
5. **Soft Delete:** Manter `deleted_at` timestamp ao invés de deletar fisicamente

### Dependências Novas:
```json
{
  "nodemailer": "^6.9.7",
  "express-rate-limit": "^7.1.5",
  "winston": "^3.11.0",
  "csurf": "^1.11.0"
}
```

---

## ✅ Critérios de Conclusão da Fase 4

- [ ] Todos os endpoints listados implementados
- [ ] Sistema de email funcionando
- [ ] Rate limiting ativo
- [ ] Logs estruturados
- [ ] Testes de integração passando
- [ ] Documentação atualizada

**Meta:** Concluir até 07/11/2025 🎯
