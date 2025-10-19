# 🔒 Configuração de IPs - Produção vs Desenvolvimento

## ⚠️ Problema encontrado:

O erro **403 (Access Denied)** acontece porque a API está com filtro de IP muito restritivo.

---

## ✅ Solução rápida (permitir todos):

**`.env` da API:**
```bash
ALLOWED_IPS=*
```

**Reinicie a API:**
```bash
npm start
# ou
pm2 restart aji-api
```

---

## 🔐 Soluções por cenário:

### 1. **Permitir todos (mais simples)**
```bash
ALLOWED_IPS=*
```
✅ Qualquer IP pode acessar  
⚠️ Menos seguro

---

### 2. **Permitir apenas IPs específicos**

Se quiser restringir, adicione os IPs permitidos:

```bash
# Seu IP + IP da VPS
ALLOWED_IPS=69.62.97.115,SEU_IP_DA_VPS,OUTRO_IP
```

---

### 3. **Cloudflare/Proxy reverso**

Se usar Cloudflare/Nginx, permita os IPs deles:

```bash
# IPs do Cloudflare (exemplo)
ALLOWED_IPS=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
```

---

## 🎯 Recomendação para produção:

### **Opção 1: Desabilitar filtro de IP**
Mais simples, deixar a segurança para o firewall da VPS:
```bash
ALLOWED_IPS=*
```

### **Opção 2: Usar middleware de rate limiting**
Instalar express-rate-limit:
```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo de 100 requisições
});

app.use('/api/', limiter);
```

---

## 🔍 Como descobrir o IP que está fazendo requisição:

Adicione temporariamente no `server.js`:

```javascript
app.use((req, res, next) => {
    console.log('IP da requisição:', req.ip);
    console.log('IPs forward:', req.headers['x-forwarded-for']);
    next();
});
```

---

## 📋 Checklist:

- [x] Mudar `ALLOWED_IPS=*` no `.env`
- [ ] Reiniciar a API
- [ ] Testar no navegador
- [ ] Se funcionar, decidir se mantém `*` ou restringe IPs

---

## ⚠️ Observação importante:

Em produção com **Nginx/Cloudflare**, o IP que chega na API pode ser:
- IP do proxy (não do usuário final)
- Por isso é comum usar `ALLOWED_IPS=*` e deixar a segurança no firewall/proxy

---

**Reinicie a API agora e teste!** 🚀
