# 🚀 Guia de Deploy - API na Samm.host

## 📊 Informações do Seu PC

### Rede Local (LAN):
- **IP Local**: `192.168.168.100`
- **Gateway**: `192.168.168.1`
- **Máscara**: `255.255.255.0`

### Internet:
- **IP Público**: `177.73.205.198`

---

## ⚙️ Configuração de IPs Autorizados

### No arquivo `.env` do servidor:
```env
ALLOWED_IPS=192.168.168.100,177.73.205.198
```

Isso permite:
- ✅ Acesso do seu PC pela rede local (192.168.168.100)
- ✅ Acesso do seu PC pela internet (177.73.205.198)
- ✅ Acesso do servidor local (127.0.0.1, ::1 - sempre incluídos)

---

## 🌐 Testando a API

### 1. Teste Local (seu PC):
```bash
curl http://localhost:3000/
```

### 2. Teste via Samm.host:
```bash
curl https://api.samm.host/
```

### 3. Teste Validação CPF:
```bash
curl -X POST https://api.samm.host/validate-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "12345678901"}'
```

### 4. Teste Cálculo:
```bash
curl -X POST https://api.samm.host/calcular \
  -H "Content-Type: application/json" \
  -d '{"operacao": "somar", "a": 10, "b": 5}'
```

---

## 📝 Passos para Deploy no Servidor

### 1. Conectar ao servidor via SSH:
```bash
ssh usuario@api.samm.host
```

### 2. Clonar o repositório:
```bash
git clone https://github.com/gilbertoromanholew/api.git
cd api
```

### 3. Instalar dependências:
```bash
npm install
```

### 4. Configurar `.env` no servidor:
```bash
nano .env
```

Conteúdo:
```env
PORT=3000
HOST=0.0.0.0
ALLOWED_IPS=177.73.205.198
LOG_LEVEL=info
LOG_FILE=false
```

**Importante**: No servidor, adicione apenas o IP público que você quer autorizar.

### 5. Testar localmente no servidor:
```bash
npm start
```

### 6. Instalar PM2 (para manter rodando):
```bash
npm install -g pm2
pm2 start server.js --name api
pm2 save
pm2 startup
```

### 7. Configurar Nginx (proxy reverso):
```nginx
server {
    listen 80;
    server_name api.samm.host;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. Configurar SSL (HTTPS):
```bash
sudo certbot --nginx -d api.samm.host
```

---

## 🔒 Importante sobre IPs

### IP que o servidor vê:
Quando você acessa `https://api.samm.host` do seu PC, o servidor vê:
- **req.ip**: `177.73.205.198` (seu IP público)

### Para permitir múltiplos IPs:
```env
ALLOWED_IPS=177.73.205.198,200.100.50.25,150.200.100.50
```

### Para permitir qualquer IP (NÃO RECOMENDADO):
Remova ou comente o middleware `ipFilter` em `server.js`

---

## 🐛 Troubleshooting

### Erro 403 (Pare de tentar hackear!):
**Causa**: Seu IP não está autorizado

**Solução**:
1. Verifique seu IP público: https://www.whatismyip.com/
2. Adicione ao `.env` do servidor:
   ```env
   ALLOWED_IPS=177.73.205.198
   ```
3. Reinicie a API:
   ```bash
   pm2 restart api
   ```

### API não responde:
**Verificar**:
```bash
# Ver logs
pm2 logs api

# Status do processo
pm2 status

# Reiniciar
pm2 restart api
```

### IP mudou:
Se seu IP público mudar (comum em conexões residenciais):
1. Verifique novo IP: `curl ifconfig.me`
2. Atualize `.env` no servidor
3. Reinicie API

---

## 📱 Testando do Navegador

### Documentação:
```
https://api.samm.host/
```

### Validar CPF (use Postman ou Insomnia):
- **Método**: POST
- **URL**: `https://api.samm.host/validate-cpf`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "cpf": "12345678901"
  }
  ```

---

## 🔄 Atualizando o Código

### No servidor:
```bash
cd ~/api
git pull origin main
npm install
pm2 restart api
```

---

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
pm2 logs api
```

### Ver status:
```bash
pm2 status
```

### Ver uso de recursos:
```bash
pm2 monit
```

---

## ✅ Checklist de Deploy

- [ ] Servidor configurado (Node.js instalado)
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` configurado com IP autorizado
- [ ] API testada localmente (`npm start`)
- [ ] PM2 instalado e configurado
- [ ] Nginx configurado (proxy reverso)
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado (porta 80 e 443)
- [ ] DNS apontando para o servidor
- [ ] Teste de acesso externo funcionando

---

**Última atualização**: Outubro 2025
**Seu IP Público**: 177.73.205.198
**IP Local**: 192.168.168.100
**Gateway**: 192.168.168.1
