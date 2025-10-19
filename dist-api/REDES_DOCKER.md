# 🌐 Configuração de Redes Docker - Produção

## 📋 IPs e Redes Liberadas

A API possui um sistema de **IP Filter** para segurança. Em produção, as seguintes redes estão liberadas:

```env
ALLOWED_IPS=127.0.0.1,localhost,::1,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16
```

### 🔍 Detalhamento:

| Range | Descrição | Por quê? |
|-------|-----------|----------|
| `127.0.0.1` | Localhost IPv4 | Acesso local ao container |
| `localhost` | Localhost (nome) | Compatibilidade |
| `::1` | Localhost IPv6 | Suporte IPv6 |
| `10.0.0.0/8` | **Redes Docker do Coolify** | Coolify usa `10.0.0.0/24`, `10.0.1.0/24`, etc. |
| `10.244.0.0/16` | **ZeroTier Network** | Incluído em `10.0.0.0/8` |
| `192.168.0.0/16` | **Redes privadas classe C** | Redes locais e Docker customizado |

## ✅ Por que essas redes?

### 1. **Docker Network Coolify**
- Coolify cria redes na faixa `10.0.x.0/24`
- Detectadas: `10.0.0.0/24`, `10.0.1.0/24`, `10.0.2.0/24`, `10.0.3.0/24`, `10.0.4.0/24`, `10.0.5.0/24`
- Supabase Kong está em uma dessas redes
- API precisa se comunicar com Kong
- **`10.0.0.0/8` cobre TODAS essas subredes!**

### 2. **ZeroTier Network**
- Usa a faixa `10.244.x.x`
- Permite acesso seguro remoto

### 3. **Redes Privadas**
- `10.0.0.0/8`: Classe A (16 milhões de IPs)
- `192.168.0.0/16`: Classe C (65 mil IPs)
- Garante que qualquer container Docker possa acessar

## 🚀 Como funciona no Coolify?

```
┌─────────────────────────────────────────┐
│  Nginx/Proxy Coolify (10.0.x.2)         │
│  └─ Encaminha para API                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Container (10.0.x.3)                │
│  └─ IP Filter: 10.0.0.0/8 ✅            │
│  └─ Acessa supabase-kong:8000            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Supabase Kong (10.0.x.4:8000)          │
│  └─ Recebe requests da API ✅           │
└─────────────────────────────────────────┘
```

## 🔒 Segurança

### ✅ O que ESTÁ permitido:
- Containers Docker do Coolify
- Supabase Kong interno
- ZeroTier Network
- Acesso local (127.0.0.1)

### ❌ O que NÃO está permitido:
- IPs públicos da internet (bloqueados)
- IPs não autorizados

## 🧪 Como testar se está funcionando?

### 1️⃣ Dentro do container da API:
```bash
# SSH no container
docker exec -it <api-container-id> /bin/sh

# Testar acesso ao Kong
curl http://supabase-kong:8000/rest/v1/
```

### 2️⃣ Ver logs da API:
```bash
# Ver se houve bloqueio de IP
docker logs <api-container-id> | grep "bloqueado"

# Ver acessos permitidos
docker logs <api-container-id> | grep "permitido"
```

### 3️⃣ Testar proxy reverso:
```bash
# De fora do container
curl https://samm.host/supabase/rest/v1/
```

## 🆘 Troubleshooting

### Erro: "IP bloqueado" nos logs
**Sintoma:** API bloqueia requests do Kong ou Coolify

**Solução:**
1. Ver qual IP está sendo bloqueado nos logs
2. Identificar a rede Docker: `docker network inspect <network-name>`
3. Adicionar a faixa de IP em `ALLOWED_IPS`

### Erro: "Cannot connect to supabase-kong"
**Sintoma:** API não consegue acessar Kong

**Soluções:**
1. Verificar se estão na mesma rede:
   ```bash
   docker network inspect <network-name>
   ```
2. Conectar API à rede do Supabase:
   ```bash
   docker network connect <supabase-network> <api-container>
   ```
3. Verificar se Kong está rodando:
   ```bash
   docker ps | grep supabase-kong
   ```

### Erro: "502 Bad Gateway" no proxy
**Sintoma:** Proxy retorna erro 502

**Causas possíveis:**
- Kong não está acessível na rede Docker
- `SUPABASE_INTERNAL_URL` está incorreto
- Containers não estão na mesma rede

**Debug:**
```bash
# Ver logs do proxy
docker logs <api-container> | grep "Proxy Supabase"

# Testar conectividade de dentro da API
docker exec -it <api-container> wget -O- http://supabase-kong:8000/rest/v1/
```

## 📝 Checklist de Deploy

Antes de fazer deploy no Coolify:

- [ ] Executar `config.bat` → opção `[2] Produção`
- [ ] Verificar `.env` gerado tem os IPs corretos
- [ ] Fazer commit e push das alterações
- [ ] No Coolify: Adicionar variáveis de ambiente
- [ ] No Coolify: Verificar redes Docker compartilhadas
- [ ] Após deploy: Testar `https://samm.host/supabase/rest/v1/`
- [ ] Verificar logs da API para erros de rede

## 🔧 Comandos Úteis

```bash
# Ver todas as redes Docker
docker network ls

# Inspecionar rede específica
docker network inspect <network-name>

# Ver IP de um container
docker inspect <container-id> | grep IPAddress

# Conectar container a uma rede
docker network connect <network-name> <container-name>

# Testar conectividade entre containers
docker exec -it <api-container> ping supabase-kong
docker exec -it <api-container> wget -O- http://supabase-kong:8000
```

---

**Última atualização:** 19 de outubro de 2025
