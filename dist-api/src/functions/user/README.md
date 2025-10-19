# 👤 Módulo User - Perfil e Estatísticas

## 📋 Visão Geral

Módulo responsável por **gerenciamento de perfil e estatísticas** do usuário.

**Status:** ✅ Completo e funcional  
**Requer Auth:** 🔒 Sim (todos os endpoints)

---

## 🎯 Responsabilidades

- ✅ Consulta e atualização de perfil
- ✅ Estatísticas de uso (ferramentas, pontos, compras)
- ✅ Lista de indicações (referrals)
- ✅ Dashboard unificado com todos os dados

---

## 📁 Arquivos

```
user/
├── README.md              ← Este arquivo
├── userRoutes.js          ← Definição de rotas
└── userController.js      ← Lógica dos endpoints
```

---

## 🔗 Endpoints

### 1. **GET** `/api/user/profile`
Retorna perfil completo do usuário (dados + pontos + auth).

**Requer autenticação** 🔒

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "usuario@email.com",
    "email_confirmed": true,
    "full_name": "João da Silva",
    "cpf": "123.456.789-09",
    "referral_code": "XYZ98765",
    "referred_by": "uuid-indicador",
    "created_at": "2025-10-18T10:00:00Z",
    "points": {
      "free_points": 10,
      "paid_points": 0,
      "total_points": 10,
      "free_points_limit": 100,
      "total_earned": 10,
      "total_purchased": 0,
      "total_spent": 0
    }
  }
}
```

**O que retorna:**
- Dados pessoais (nome, CPF, email)
- Status de verificação de email
- Código de indicação do usuário
- Quem o indicou (se aplicável)
- Saldo completo de pontos
- Estatísticas de pontos (ganhos, gastos, comprados)

---

### 2. **PUT** `/api/user/profile`
Atualiza nome completo do usuário.

**Requer autenticação** 🔒

**Body:**
```json
{
  "full_name": "João da Silva Santos"
}
```

**Validações:**
- Mínimo 3 caracteres
- Máximo 100 caracteres

**Resposta:**
```json
{
  "success": true,
  "data": {
    "full_name": "João da Silva Santos",
    "updated_at": "2025-10-18T14:30:00Z"
  }
}
```

**Nota:** CPF e email **não podem** ser alterados por questões de segurança.

---

### 3. **GET** `/api/user/stats`
Retorna estatísticas detalhadas do usuário.

**Requer autenticação** 🔒

**Resposta:**
```json
{
  "success": true,
  "data": {
    "points": {
      "total_earned": 15,
      "total_purchased": 50,
      "total_spent": 12,
      "current_balance": 53
    },
    "usage": {
      "total_transactions": 12,
      "tools_used": 8,
      "most_used_tool": {
        "name": "calc_rescisao",
        "count": 3
      }
    },
    "referrals": {
      "total_referred": 3,
      "bonus_earned": 15
    },
    "purchases": {
      "total_purchases": 2,
      "total_spent_brl": 49.90
    }
  }
}
```

**Estatísticas incluem:**

#### Pontos:
- Total ganho (bônus + referrals)
- Total comprado (Stripe)
- Total gasto (ferramentas)
- Saldo atual

#### Uso:
- Total de transações
- Ferramentas utilizadas
- Ferramenta mais usada

#### Indicações:
- Total de pessoas indicadas
- Bônus ganho com indicações (5 pts cada)

#### Compras:
- Total de compras realizadas
- Valor total gasto em R$

---

### 4. **GET** `/api/user/referrals`
Lista todas as pessoas indicadas pelo usuário.

**Requer autenticação** 🔒

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "referrals": [
      {
        "name": "Maria Silva",
        "joined_at": "2025-10-15T08:00:00Z"
      },
      {
        "name": "Pedro Santos",
        "joined_at": "2025-10-10T14:30:00Z"
      },
      {
        "name": "Ana Costa",
        "joined_at": "2025-10-05T10:15:00Z"
      }
    ]
  }
}
```

**Por privacidade:**
- Não mostra email nem CPF dos indicados
- Apenas nome e data de cadastro
- Ordenado por data (mais recente primeiro)

---

## 🔄 Fluxo de Uso Típico

### Dashboard do Usuário:

```javascript
// 1. Carregar perfil completo
const profile = await api.get('/user/profile')
// Mostra: Nome, email, saldo de pontos, código de indicação

// 2. Carregar estatísticas
const stats = await api.get('/user/stats')
// Mostra: Gráficos de uso, ferramentas favoritas, indicações

// 3. Listar indicações
const referrals = await api.get('/user/referrals')
// Mostra: Lista de amigos indicados
```

---

## 🧪 Como Testar

### 1. Ver Perfil:
```bash
curl http://localhost:3000/api/user/profile \
  -H "Cookie: session=SEU_TOKEN_AQUI"
```

### 2. Atualizar Nome:
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: session=SEU_TOKEN_AQUI" \
  -d '{"full_name":"Novo Nome Completo"}'
```

### 3. Ver Estatísticas:
```bash
curl http://localhost:3000/api/user/stats \
  -H "Cookie: session=SEU_TOKEN_AQUI"
```

### 4. Ver Indicações:
```bash
curl http://localhost:3000/api/user/referrals \
  -H "Cookie: session=SEU_TOKEN_AQUI"
```

---

## 🎨 Integração com Frontend

### Exemplo de Dashboard Vue:

```vue
<template>
  <div class="dashboard">
    <!-- Perfil -->
    <div class="profile-card">
      <h2>{{ profile.full_name }}</h2>
      <p>{{ profile.email }}</p>
      <div class="points">
        <span>{{ profile.points.total_points }} pontos</span>
      </div>
      <button @click="copyReferralCode">
        Código: {{ profile.referral_code }}
      </button>
    </div>

    <!-- Estatísticas -->
    <div class="stats-grid">
      <StatCard 
        title="Pontos Ganhos"
        :value="stats.points.total_earned"
      />
      <StatCard 
        title="Ferramentas Usadas"
        :value="stats.usage.tools_used"
      />
      <StatCard 
        title="Indicações"
        :value="stats.referrals.total_referred"
      />
    </div>

    <!-- Indicações -->
    <div class="referrals">
      <h3>Pessoas que Você Indicou ({{ referrals.total }})</h3>
      <ul>
        <li v-for="ref in referrals.referrals" :key="ref.joined_at">
          {{ ref.name }} - {{ formatDate(ref.joined_at) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userService } from '@/services/user'

const profile = ref({})
const stats = ref({})
const referrals = ref({ total: 0, referrals: [] })

onMounted(async () => {
  profile.value = await userService.getProfile()
  stats.value = await userService.getStats()
  referrals.value = await userService.getReferrals()
})

const copyReferralCode = () => {
  navigator.clipboard.writeText(profile.value.referral_code)
  showSuccess('Código copiado!')
}
</script>
```

---

## 📊 Tabelas Usadas

- `profiles` - Dados do perfil
- `user_points` - Saldo de pontos
- `point_transactions` - Histórico (para stats)
- `purchases` - Compras realizadas
- `auth.users` (Supabase) - Email e verificação

---

## 🔗 Dependências

- `requireAuth` middleware - Todas as rotas requerem autenticação
- Supabase client - Consultas ao banco
- Points system - Dados de pontos integrados

---

## 🎯 Casos de Uso

### 1. Dashboard Principal
Mostrar resumo completo: perfil + saldo + estatísticas

### 2. Página "Minha Conta"
Permitir edição de nome, ver código de indicação

### 3. Programa de Indicação
Listar quem o usuário indicou, quanto ganhou

### 4. Analytics Pessoal
Mostrar gráficos de uso, ferramentas favoritas

---

## ⚙️ Configuração

Não há configurações especiais. O módulo usa:
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` (de `.env`)
- Middleware `requireAuth` (automático)

---

## 🚀 Melhorias Futuras

- [ ] Upload de avatar/foto
- [ ] Edição de email (com verificação)
- [ ] Preferências do usuário (tema, idioma)
- [ ] Exportação de dados (LGPD)
- [ ] Gráficos de uso ao longo do tempo
- [ ] Ranking de usuários (gamificação)

---

## ⚠️ Notas Importantes

### Segurança:
- Todos os endpoints requerem autenticação
- Usuário só acessa seus próprios dados
- CPF e email são read-only após cadastro

### Performance:
- `/profile` faz 3 queries (otimizável com JOIN)
- `/stats` faz múltiplas agregações (considere cache)

### Privacidade:
- Indicações não expõem dados sensíveis
- Stats não mostram detalhes de outras pessoas

---

**Status:** ✅ Produção  
**Última revisão:** 18/10/2025  
**Mantenedor:** Sistema Core
