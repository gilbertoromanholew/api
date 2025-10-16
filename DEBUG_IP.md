# 🔍 Debug de IP - Descobrir qual IP está chegando no servidor

## Problema
Quando você acessa `https://api.samm.host/` do seu PC, está recebendo erro de bloqueio mesmo estando na lista de IPs permitidos.

## Causa provável
O servidor está vendo um IP diferente do seu IP real, possivelmente por causa de:
- Proxy reverso (nginx, Apache)
- CDN (Cloudflare, etc)
- Load balancer
- NAT do provedor

## ✅ Passos para descobrir o IP

### 1. Suba as alterações para o servidor
```bash
git add .
git commit -m "Add IP debug logs"
git push
```

### 2. No servidor (api.samm.host), atualize o código
```bash
cd /caminho/da/api
git pull
pm2 restart api
# OU
npm start
```

### 3. Faça uma requisição do seu PC
```powershell
curl https://api.samm.host/
```

### 4. Veja os logs no servidor
```bash
pm2 logs api
# OU se estiver rodando direto
# os logs aparecerão no terminal
```

Você verá algo como:
```
🔍 IP detectado: 172.17.0.1
📋 IPs permitidos: [ '127.0.0.1', '::1', '192.168.168.100', '177.73.205.198' ]
🌐 Headers: 177.73.205.198 undefined
```

### 5. Adicione o IP correto no .env

Se o IP detectado for diferente, adicione-o no arquivo `.env`:

```env
ALLOWED_IPS=192.168.168.100,177.73.205.198,172.17.0.1
```

**OU** se houver o header `x-forwarded-for`, vamos modificar o código para usar esse header.

---

## 🔧 Solução Alternativa - Confiar no X-Forwarded-For

Se você estiver usando proxy/CDN, precisamos modificar o ipFilter para ler o IP do header correto.

Modifique `src/middlewares/ipFilter.js`:

```javascript
export const ipFilter = (req, res, next) => {
    // Pega o IP real considerando proxies
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip;
    
    console.log('🔍 IP detectado:', clientIp);
    console.log('📋 IPs permitidos:', allowedIPs);
    
    if (!allowedIPs.includes(clientIp)) {
        return res.status(403).json({ 
            error: 'Amigo(a), pare de tentar hackear! Grato! ;)'
        });
    }
    next();
};
```

Isso vai pegar o IP real do header `X-Forwarded-For` que proxies/CDNs costumam adicionar.

---

## 📝 Depois de resolver

Remova os logs de debug do `ipFilter.js` e a linha `debug_ip` da resposta de erro.
