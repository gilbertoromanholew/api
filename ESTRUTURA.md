# Estrutura da API - Organização Modular

## 📁 Estrutura de Pastas

```
api/
├── server.js                    # Arquivo principal - apenas configurações básicas
├── package.json                 # Dependências do projeto
├── .gitignore                   # Arquivos ignorados pelo Git
├── documentation.txt            # Documentação temporária da API
└── src/                        # Código fonte organizado
    ├── config/                 # Configurações
    │   └── allowedIPs.js       # Lista de IPs autorizados
    ├── middlewares/            # Middlewares customizados
    │   └── ipFilter.js         # Filtro de segurança por IP
    ├── utils/                  # Funções utilitárias
    │   └── cpfValidator.js     # Validação de CPF
    ├── controllers/            # Lógica de negócio
    │   ├── cpfController.js    # Controller de validação de CPF
    │   └── pdfController.js    # Controller de leitura de PDF
    └── routes/                 # Definição de rotas
        ├── index.js            # Rota raiz (informações da API)
        ├── cpfRoutes.js        # Rotas relacionadas a CPF
        └── pdfRoutes.js        # Rotas relacionadas a PDF
```

## 🔒 Segurança

**Proteção do código:**
1. O código do backend NUNCA é exposto ao cliente - só as respostas JSON são enviadas
2. Clientes só veem as requisições/respostas HTTP no DevTools, não o código-fonte
3. Use `.gitignore` para não enviar informações sensíveis ao repositório
4. Mantenha chaves secretas e senhas em variáveis de ambiente (arquivo `.env`)

**Filtro de IP:**
- Apenas IPs autorizados podem acessar qualquer endpoint
- Configure os IPs em: `src/config/allowedIPs.js`

## 📝 Vantagens desta estrutura:

1. **Modularidade**: Cada funcionalidade em seu próprio arquivo
2. **Manutenibilidade**: Fácil de encontrar e editar código específico
3. **Escalabilidade**: Simples adicionar novos endpoints/funcionalidades
4. **Segurança**: Código backend nunca é exposto ao cliente
5. **Organização**: Clara separação de responsabilidades

## 🚀 Como adicionar novos endpoints:

1. Crie um controller em `src/controllers/nomeController.js`
2. Crie as rotas em `src/routes/nomeRoutes.js`
3. Importe e use as rotas no `server.js`
4. Atualize a documentação

## ⚠️ Importante sobre segurança:

- Clientes NUNCA têm acesso ao código do servidor
- No DevTools, eles só veem:
  - URLs das requisições
  - Dados enviados (headers, body)
  - Respostas recebidas (JSON)
- O código JavaScript do backend roda APENAS no servidor
- Apenas suas respostas JSON são enviadas ao cliente
