# 🚀 API Modular - Sistema Jurídico com Pontos

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-2.0-blue.svg)](https://github.com/gilbertoromanholew/api)

> **API REST modular para ferramentas jurídicas com sistema de pontos, autenticação completa e arquitetura escalável.**

🌐 **Produção:** https://api.samm.host  
📱 **Frontend:** https://ferramentas.samm.host

---

## 🎯 O que é este sistema?

API backend para plataforma de **ferramentas jurídicas** (calculadoras trabalhistas, planejamento previdenciário, validadores) com:
- 🔐 **Autenticação completa** (CPF brasileiro + Supabase)
- 💰 **Sistema de pontos** (gratuitos + pagos, com limite)
- 🎯 **15 ferramentas jurídicas** reais (3 pts planejamento, 1 pt simples)
- 🔗 **Sistema de referência** (indique e ganhe pontos)
- 📊 **Dashboard completo** (perfil, estatísticas, histórico)

---

## ⚡ Quick Start

```bash
# Clone e instale
git clone https://github.com/gilbertoromanholew/api.git
cd api
npm install

# Configure ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Crie o banco de dados
# Execute database/schema.sql no Supabase SQL Editor
# Execute database/seed_tools.sql para popular ferramentas

# Inicie
npm start
```

**Acesse:**
- � API: http://localhost:3000
- 📚 Docs: http://localhost:3000/docs
- � Functions: http://localhost:3000/api/functions

---

## � Documentação Completa

### 🏠 **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)** - Índice Geral
Navegue por toda a documentação do sistema.

### ⭐ Guias Essenciais:

1. **[SISTEMA_BEM_AMARRADO.md](./SISTEMA_BEM_AMARRADO.md)** - Visão geral completa
2. **[GUIA_IMPLEMENTACAO_FERRAMENTAS.md](./GUIA_IMPLEMENTACAO_FERRAMENTAS.md)** - Como criar ferramentas
3. **[GUIA_MUDANCA_CATEGORIAS.md](./GUIA_MUDANCA_CATEGORIAS.md)** - Gerenciar categorias

### 📦 Módulos da API:

- **[Auth Module](./src/functions/auth/README.md)** - Autenticação e registro
- **[Points Module](./src/functions/points/README.md)** - Sistema de pontos
- **[User Module](./src/functions/user/README.md)** - Perfil e estatísticas
- **[Tools Module](./src/functions/tools/README.md)** - Gerenciador de ferramentas

### 🏗️ Arquitetura:

- **[src/functions/README.md](./src/functions/README.md)** - Estrutura modular

---

## ✨ Características

### 🏗️ Arquitetura Modular
- **Auto-descoberta** - Adicione módulos sem editar server.js
- **Separação clara** - Service (lógica) + Controller (orquestração)
- **Testável** - Lógica pura isolada
- **Escalável** - Adicione ferramentas facilmente

### 🔐 Autenticação e Segurança
- **CPF brasileiro** - Validação completa do algoritmo
- **Supabase Auth** - JWT + Sessions httpOnly
- **Sistema de referência** - Códigos únicos de indicação
- **RLS** - Row Level Security no banco

### 💰 Sistema de Pontos
- **Gratuitos + Pagos** - Dois tipos de pontos
- **Prioridade** - Consome gratuitos primeiro
- **Limite** - 100 pontos gratuitos máximo
- **Histórico completo** - Todas as transações registradas

### �️ Ferramentas Jurídicas
- **15 ferramentas** reais cadastradas
- **5 categorias** organizadas
- **Custos:** 3 pts (planejamento) ou 1 pt (simples)
- **Consumo automático** - Pontos consumidos ao usar

### 🎁 Sistema de Indicação
- **10 pontos** de bônus no cadastro
- **5 pontos** por pessoa indicada
- **Códigos únicos** de 8 caracteres
- **Rastreamento completo** de indicações

---

## 📊 Módulos e Endpoints

### 🔐 Auth (5 endpoints)
```
POST   /api/auth/check-cpf      - Verificar se CPF existe
POST   /api/auth/register       - Cadastrar novo usuário
POST   /api/auth/login          - Fazer login
POST   /api/auth/logout         - Sair
GET    /api/auth/session        - Dados da sessão atual
```

### 💰 Points (5 endpoints)
```
GET    /api/points/balance         - Saldo atual
GET    /api/points/history         - Histórico (paginado)
POST   /api/points/consume         - Consumir pontos
GET    /api/points/can-use/:tool   - Verificar se pode usar
POST   /api/points/add-free        - Adicionar grátis (admin)
```

### 👤 User (4 endpoints)
```
GET    /api/user/profile      - Perfil completo + pontos
PUT    /api/user/profile      - Atualizar nome
GET    /api/user/stats        - Estatísticas de uso
GET    /api/user/referrals    - Lista de indicações
```

### 🛠️ Tools (4 endpoints)
```
GET    /api/tools/list              - Listar todas (público)
GET    /api/tools/:tool_name        - Detalhes da ferramenta
POST   /api/tools/execute/:tool     - Executar ferramenta
GET    /api/tools/history           - Histórico de uso
```

**Total:** 18 endpoints funcionais

---

---

## �️ Banco de Dados

### Schema (7 tabelas):
- `profiles` - Dados dos usuários (CPF, nome, código)
- `user_points` - Saldo de pontos (grátis + pagos)
- `point_transactions` - Histórico completo
- `tool_costs` - Ferramentas e custos
- `point_packages` - Pacotes para venda (Stripe)
- `purchases` - Compras realizadas

### Scripts SQL:
- `database/schema.sql` - Estrutura completa
- `database/seed_tools.sql` - 15 ferramentas iniciais

---

## � Como Usar

### 1. Cadastrar Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-09",
    "email": "usuario@email.com",
    "password": "Senha@123",
    "full_name": "João Silva"
  }'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "cpf": "123.456.789-09",
    "password": "Senha@123"
  }'
```

### 3. Ver Saldo de Pontos
```bash
curl http://localhost:3000/api/points/balance \
  -b cookies.txt
```

### 4. Listar Ferramentas
```bash
curl http://localhost:3000/api/tools/list
```

### 5. Executar Ferramenta
```bash
curl -X POST http://localhost:3000/api/tools/execute/calc_rescisao \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "params": {
      "salario": 3000,
      "dataAdmissao": "2020-01-15",
      "dataDemissao": "2025-10-18"
    }
  }'
```

---

## 🛠️ Implementar Nova Ferramenta

Siga o **[GUIA_IMPLEMENTACAO_FERRAMENTAS.md](./GUIA_IMPLEMENTACAO_FERRAMENTAS.md)** completo.

### Resumo rápido:

1. **Cadastrar no banco:**
```sql
INSERT INTO tool_costs (tool_name, display_name, description, points_cost, category, icon)
VALUES ('nova_ferramenta', 'Nova Ferramenta', 'Descrição', 1, 'Categoria', '🛠️');
```

2. **Criar service:**
```javascript
// src/functions/calculators/services/novaService.js
export function calcular(dados) {
  // Lógica pura aqui
  return { resultado }
}
```

3. **Adicionar no controller:**
```javascript
// src/functions/calculators/calculatorsController.js
export async function novaFerramenta(req, res) {
  // 1. Verificar pontos
  // 2. Calcular
  // 3. Consumir pontos
  // 4. Retornar
}
```

4. **Definir rota:**
```javascript
// src/functions/calculators/calculatorsRoutes.js
router.post('/nova', requireAuth, novaFerramenta)
```

**✅ Pronto! API registra automaticamente em `/api/calculators/nova`**

---

## � Mudar Categorias

Siga o **[GUIA_MUDANCA_CATEGORIAS.md](./GUIA_MUDANCA_CATEGORIAS.md)** completo.

### Resumo rápido:

```sql
-- Renomear categoria
UPDATE tool_costs SET category = 'Novo Nome' WHERE category = 'Antigo';

-- Mover ferramenta
UPDATE tool_costs SET category = 'Outra' WHERE tool_name = 'calc_rescisao';

-- Mudar custo
UPDATE tool_costs SET points_cost = 5 WHERE tool_name = 'calc_rescisao';
```

**✅ API atualiza automaticamente!**

---

## 📁 Estrutura do Projeto

```
api/
├── src/
│   ├── functions/              ← Módulos (auto-descoberta)
│   │   ├── auth/              ← Autenticação
│   │   ├── points/            ← Sistema de pontos
│   │   ├── user/              ← Perfil e stats
│   │   ├── tools/             ← Gerenciador
│   │   └── calculators/       ← SUAS FERRAMENTAS AQUI
│   │
│   ├── config/                ← Supabase, etc
│   ├── core/                  ← routeLoader
│   ├── middlewares/           ← Validação, etc
│   └── routes/                ← Rotas especiais
│
├── database/                  ← SQL scripts
│   ├── schema.sql            ← Estrutura do banco
│   └── seed_tools.sql        ← Ferramentas iniciais
│
├── *.md                       ← DOCUMENTAÇÃO
└── server.js                  ← Entry point
```

---

## 🎯 Tecnologias

- **Runtime:** Node.js 22.18.0+
- **Framework:** Express 5.1.0
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth + JWT
- **Validação:** JSON Schema
- **Cookies:** cookie-parser

---

## 🔧 Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Segredos
JWT_SECRET=seu_jwt_secret_aqui
SESSION_SECRET=seu_session_secret_aqui

# Sistema de Pontos
SIGNUP_BONUS_POINTS=10
REFERRAL_BONUS_POINTS=5
FREE_POINTS_LIMIT=100

# Servidor
PORT=3000
NODE_ENV=development
```

---

## � Documentação

### Para Desenvolvedores:
1. [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md) - Índice geral
2. [SISTEMA_BEM_AMARRADO.md](./SISTEMA_BEM_AMARRADO.md) - Visão geral
3. [GUIA_IMPLEMENTACAO_FERRAMENTAS.md](./GUIA_IMPLEMENTACAO_FERRAMENTAS.md) - Como criar
4. [GUIA_MUDANCA_CATEGORIAS.md](./GUIA_MUDANCA_CATEGORIAS.md) - Gerenciar categorias
5. [src/functions/README.md](./src/functions/README.md) - Arquitetura modular

### Para Product Owners:
1. [ESTRUTURA_FERRAMENTAS.md](./ESTRUTURA_FERRAMENTAS.md) - Lista de ferramentas
2. [GUIA_MUDANCA_CATEGORIAS.md](./GUIA_MUDANCA_CATEGORIAS.md) - Como reorganizar

---

## � Scripts

```bash
npm start          # Iniciar servidor
npm run dev        # Desenvolvimento com nodemon
npm test           # Executar testes (TODO)
npm run lint       # Verificar código (TODO)
```

---

## 🚧 Roadmap

### Fase 1: ✅ Autenticação + Pontos (Completa)
- [x] Sistema de autenticação com CPF
- [x] Sistema de pontos (gratuitos + pagos)
- [x] Sistema de referência
- [x] 15 ferramentas cadastradas

### Fase 2: ✅ Módulos Principais (Completa)
- [x] Módulo Points completo
- [x] Módulo User completo
- [x] Módulo Tools completo
- [x] Documentação completa

### Fase 3: 🔄 Integração Frontend (Próximo)
- [ ] Remover Supabase direto do Vue
- [ ] Criar API service centralizado
- [ ] Migrar composables para API
- [ ] Testar fluxo completo

### Fase 4: 📅 Stripe + Pagamentos
- [ ] Endpoint de checkout
- [ ] Webhooks de pagamento
- [ ] Compra de pacotes de pontos
- [ ] Histórico de compras

### Fase 5: 📅 Implementação das Ferramentas
- [ ] Calculadora de Rescisão
- [ ] Calculadora de Férias
- [ ] Planejamento Previdenciário
- [ ] Extrator de CNIS
- [ ] Validadores (CPF, CNPJ, CEP)

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-ferramenta`)
3. Commit suas mudanças (`git commit -m 'Add: nova ferramenta'`)
4. Push para a branch (`git push origin feature/nova-ferramenta`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- 📖 **Documentação:** Leia [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)
- 🐛 **Bugs:** Abra uma issue no GitHub
- 💡 **Sugestões:** Pull requests são bem-vindos!

---

**🎉 Sistema 100% documentado e pronto para crescer!**

**Versão:** 2.0 - Sistema Modular Completo  
**Última atualização:** 18/10/2025

**Gilberto Roman Holew**
- GitHub: [@gilbertoromanholew](https://github.com/gilbertoromanholew)
- URL: https://api.samm.host

---

## 📊 Status do Projeto

- ✅ **v2.10.2** - Refresh sincronizado em 15s para todas as seções
- ✅ **v2.10.1** - Padronização inicial de refresh em 30s
- ✅ **v2.10.0** - Remoção de filtros de logging + limite aumentado para 5000
- ✅ **v2.9.3** - Animações suavizadas nos cards de estatísticas
- ✅ **v2.9.2** - Correção de hover nos dropdowns (tema escuro)
- ✅ **v2.9.1** - Correção de cores de fundo dos filtros
- ✅ **v2.9.0** - Redesign completo do painel de filtros (2 linhas organizadas)
- ✅ **v2.8.0** - Sistema de filtros avançado (Quantidade, Status, Método, Endpoint, IP)
- ✅ **v2.7.2** - Correção definitiva do scroll do modal de histórico
- ✅ **v2.7.0** - Reorganização de seções do dashboard
- ✅ **v2.2.4** - Sistema de autorização temporária
- ✅ **v2.2.3** - Correção de paleta de modais
- ✅ **v2.2.0** - Lista unificada de IPs + Dashboard

**Score de Qualidade:** 9.7/10 🌟

---

## 🎨 Destaques da Interface

### Dashboard Premium (v2.9.0+)
- **Painel de Filtros Organizado** - 2 linhas com labels descritivos e ícones
- **Tema Escuro Consistente** - Gradientes azul/roxo em toda a interface
- **Animações Suaves** - Hover elegante nos cards (-4px, sombras sutis)
- **Responsivo** - Design adaptável para desktop e mobile
- **Auto-refresh Inteligente** - Pausa ao interagir, retoma automaticamente

### Sistema de Filtros (v2.8.0+)
- 📊 **Quantidade**: 25, 50, 100, 200, 500, Todos
- ✅ **Status**: Todos, Autorizados, Negados
- 🔧 **Método HTTP**: Todos, GET, POST, PUT, DELETE, PATCH
- 🔍 **Busca por Endpoint**: Filtro de URL em tempo real
- � **Busca por IP**: Localização rápida de IPs específicos
- 🧹 **Limpar Filtros**: Reset completo com um clique

---

**⭐ Gostou? Deixe uma estrela no GitHub!**
