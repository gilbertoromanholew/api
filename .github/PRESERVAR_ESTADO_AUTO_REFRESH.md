# 🔄 Como Preservar Estado de UI Durante Auto-Refresh

## 📋 Índice
- [Problema](#-problema)
- [Solução Conceitual](#-solução-conceitual)
- [Implementação Passo a Passo](#-implementação-passo-a-passo)
- [Código Completo](#-código-completo)
- [Casos de Uso](#-casos-de-uso)
- [Padrões de Implementação](#-padrões-de-implementação)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Problema

### Cenário Comum:
Você tem uma interface que atualiza automaticamente (auto-refresh) para mostrar dados em tempo real, mas quando o usuário interage com a UI (expande/colapsa seções, abre modais, etc.), o auto-refresh **reconstrói todo o HTML**, fazendo a interface **perder o estado visual** escolhido pelo usuário.

### Exemplo Prático:
```
1. Usuário clica para FECHAR a seção "Detalhes" ▼ → ▶
2. Interface salva: seção está fechada
3. 3 segundos depois: auto-refresh dispara
4. Sistema busca novos dados da API
5. Sistema reconstrói TODO o HTML
6. ❌ Seção "Detalhes" volta a estar ABERTA ▼
7. Usuário precisa fechar de novo... e de novo... e de novo...
```

### Por Que Isso Acontece?

Quando você usa `innerHTML` para atualizar a interface:
```javascript
element.innerHTML = `<div>Novo conteúdo</div>`;
```

O navegador **destrói** todo o DOM existente e **cria um novo do zero**, perdendo:
- Estados de expansão/colapso
- Checkboxes marcados
- Inputs com texto digitado
- Scrolls posicionados
- Elementos com classes CSS dinâmicas
- Qualquer manipulação JavaScript no DOM

---

## 💡 Solução Conceitual

### A Ideia:
**"Salvar o estado ANTES de reconstruir, e RESTAURAR o estado DEPOIS de reconstruir"**

### Os 3 Pilares:

1. **📦 Armazenamento de Estado** - Guardar o que o usuário fez
2. **🔄 Reconstrução da UI** - Atualizar com novos dados
3. **♻️ Restauração de Estado** - Aplicar de volta o que estava salvo

### Fluxo Completo:
```
┌─────────────────────────────────────────────┐
│  1. USUÁRIO INTERAGE                        │
│     ▼ Colapsa seção                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  2. SISTEMA SALVA ESTADO                    │
│     estado['minha-secao'] = 'colapsado'     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  3. AUTO-REFRESH DISPARA                    │
│     Busca novos dados da API                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  4. RECONSTRÓI HTML                         │
│     element.innerHTML = novoHTML            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  5. RESTAURA ESTADO SALVO                   │
│     Se estado['minha-secao'] == 'colapsado' │
│     Então: fecha a seção                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  ✅ USUÁRIO VÊ INTERFACE COMO DEIXOU        │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Implementação Passo a Passo

### Passo 1: Criar Variáveis Globais de Estado

Crie objetos para armazenar o estado da interface:

```javascript
// ===== VARIÁVEIS GLOBAIS =====
// Armazena o estado de cada elemento da interface
let estadosExpandidos = {}; 
// Exemplo: { 'secao-1': true, 'secao-2': false }

// Se você tem múltiplos contextos (ex: um modal por IP):
let estadosPorContexto = {};
// Exemplo: { 
//   '192.168.1.1': { 'secao-1': true, 'secao-2': false },
//   '192.168.1.2': { 'secao-1': false, 'secao-2': true }
// }
```

### Passo 2: Salvar Estado Quando Usuário Interage

Modifique suas funções de interação para salvar o estado:

```javascript
// ===== FUNÇÃO ORIGINAL (SEM SALVAR ESTADO) =====
function toggleSecao(secaoId) {
    const secao = document.getElementById(secaoId);
    const icone = document.getElementById(secaoId + '-icon');
    
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
    }
}

// ===== FUNÇÃO MODIFICADA (COM SALVAMENTO DE ESTADO) =====
function toggleSecao(secaoId) {
    const secao = document.getElementById(secaoId);
    const icone = document.getElementById(secaoId + '-icon');
    
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
    }
    
    // 💾 SALVAR O ESTADO ATUAL
    estadosExpandidos[secaoId] = (secao.style.display === 'block');
}

// ===== VERSÃO COM CONTEXTO (Ex: Modal por IP) =====
function toggleSecao(secaoId, contexto) {
    const secao = document.getElementById(secaoId);
    const icone = document.getElementById(secaoId + '-icon');
    
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
    }
    
    // 💾 SALVAR O ESTADO POR CONTEXTO
    if (!estadosPorContexto[contexto]) {
        estadosPorContexto[contexto] = {};
    }
    estadosPorContexto[contexto][secaoId] = (secao.style.display === 'block');
}
```

### Passo 3: Restaurar Estado Após Reconstruir HTML

Adicione código no final da função que reconstrói a interface:

```javascript
// ===== FUNÇÃO QUE ATUALIZA A INTERFACE =====
async function atualizarInterface() {
    // 1. Buscar dados atualizados
    const response = await fetch('/api/dados');
    const data = await response.json();
    
    // 2. Reconstruir HTML (isso DESTRÓI o estado)
    const container = document.getElementById('container');
    container.innerHTML = `
        <div id="secao-1">
            <h3 onclick="toggleSecao('secao-1')">
                <span id="secao-1-icon">▼</span> Seção 1
            </h3>
            <div id="secao-1-content">Conteúdo...</div>
        </div>
        <div id="secao-2">
            <h3 onclick="toggleSecao('secao-2')">
                <span id="secao-2-icon">▼</span> Seção 2
            </h3>
            <div id="secao-2-content">Conteúdo...</div>
        </div>
    `;
    
    // 3. ♻️ RESTAURAR ESTADOS SALVOS
    Object.keys(estadosExpandidos).forEach(secaoId => {
        const secao = document.getElementById(secaoId + '-content');
        const icone = document.getElementById(secaoId + '-icon');
        
        if (secao && icone) {
            const estaExpandido = estadosExpandidos[secaoId];
            secao.style.display = estaExpandido ? 'block' : 'none';
            icone.textContent = estaExpandido ? '▼' : '▶';
        }
    });
}

// ===== VERSÃO COM CONTEXTO =====
async function atualizarModal(contexto) {
    // 1. Buscar dados
    const response = await fetch(`/api/dados/${contexto}`);
    const data = await response.json();
    
    // 2. Reconstruir HTML
    const modal = document.getElementById('modal-body');
    modal.innerHTML = gerarHTML(data);
    
    // 3. ♻️ RESTAURAR ESTADOS DESTE CONTEXTO
    if (estadosPorContexto[contexto]) {
        Object.keys(estadosPorContexto[contexto]).forEach(secaoId => {
            const secao = document.getElementById(secaoId);
            const icone = document.getElementById(secaoId + '-icon');
            
            if (secao && icone) {
                const estaExpandido = estadosPorContexto[contexto][secaoId];
                secao.style.display = estaExpandido ? 'block' : 'none';
                icone.textContent = estaExpandido ? '▼' : '▶';
            }
        });
    }
}
```

### Passo 4: Configurar Auto-Refresh

```javascript
// Auto-refresh a cada 3 segundos
setInterval(() => {
    atualizarInterface();
}, 3000);

// Ou com contexto (ex: modal aberto)
let modalAberto = null;

setInterval(() => {
    if (modalAberto) {
        atualizarModal(modalAberto);
    }
}, 3000);
```

---

## 📝 Código Completo

### Exemplo Real: Dashboard com Modal de Detalhes

```javascript
// ==================== VARIÁVEIS GLOBAIS ====================
let modalAberto = null; // Qual modal está aberto
let estadosPorIP = {}; // { 'IP': { 'secaoId': true/false } }

// ==================== SALVAR ESTADO ====================
function toggleSecaoModal(secaoId) {
    const secao = document.getElementById(secaoId);
    const icone = document.getElementById(secaoId + '-icon');
    
    // Toggle visual
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
    }
    
    // 💾 Salvar estado
    if (!estadosPorIP[modalAberto]) {
        estadosPorIP[modalAberto] = {};
    }
    estadosPorIP[modalAberto][secaoId] = (secao.style.display === 'block');
}

// ==================== ABRIR MODAL ====================
async function abrirModal(ip) {
    modalAberto = ip;
    await atualizarModal(ip);
    document.getElementById('modal').classList.add('show');
}

// ==================== FECHAR MODAL ====================
function fecharModal() {
    modalAberto = null;
    document.getElementById('modal').classList.remove('show');
}

// ==================== ATUALIZAR MODAL ====================
async function atualizarModal(ip) {
    try {
        // 1. Buscar dados
        const response = await fetch(`/api/detalhes/${ip}`);
        const data = await response.json();
        
        // 2. Reconstruir HTML
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>Detalhes: ${ip}</h2>
            
            <!-- Seção Endpoints -->
            <div>
                <h3 onclick="toggleSecaoModal('endpoints-${ip}')">
                    <span id="endpoints-${ip}-icon">▼</span> 
                    Endpoints (${data.endpoints.length})
                </h3>
                <ul id="endpoints-${ip}">
                    ${data.endpoints.map(ep => `<li>${ep}</li>`).join('')}
                </ul>
            </div>
            
            <!-- Seção Navegadores -->
            <div>
                <h3 onclick="toggleSecaoModal('browsers-${ip}')">
                    <span id="browsers-${ip}-icon">▼</span> 
                    Navegadores (${data.browsers.length})
                </h3>
                <ul id="browsers-${ip}">
                    ${data.browsers.map(br => `<li>${br}</li>`).join('')}
                </ul>
            </div>
        `;
        
        // 3. ♻️ Restaurar estados salvos
        if (estadosPorIP[ip]) {
            Object.keys(estadosPorIP[ip]).forEach(secaoId => {
                const secao = document.getElementById(secaoId);
                const icone = document.getElementById(secaoId + '-icon');
                
                if (secao && icone) {
                    const estaExpandido = estadosPorIP[ip][secaoId];
                    secao.style.display = estaExpandido ? 'block' : 'none';
                    icone.textContent = estaExpandido ? '▼' : '▶';
                }
            });
        }
        
    } catch (error) {
        console.error('Erro ao atualizar modal:', error);
    }
}

// ==================== AUTO-REFRESH ====================
// Atualizar modal a cada 3 segundos se estiver aberto
setInterval(() => {
    if (modalAberto) {
        atualizarModal(modalAberto);
    }
}, 3000);
```

---

## 🎯 Casos de Uso

### 1. Seções Expansíveis/Colapsáveis

```javascript
// Estado: { 'secao-detalhes': true, 'secao-logs': false }

function toggleSecao(id) {
    const secao = document.getElementById(id);
    estadosExpandidos[id] = secao.style.display === 'none';
    secao.style.display = estadosExpandidos[id] ? 'block' : 'none';
}

function restaurarEstados() {
    Object.keys(estadosExpandidos).forEach(id => {
        const secao = document.getElementById(id);
        if (secao) {
            secao.style.display = estadosExpandidos[id] ? 'block' : 'none';
        }
    });
}
```

### 2. Checkboxes/Toggles

```javascript
// Estado: { 'filtro-ativos': true, 'filtro-inativos': false }

let estadosFiltros = {};

function toggleFiltro(filtroId) {
    const checkbox = document.getElementById(filtroId);
    estadosFiltros[filtroId] = checkbox.checked;
}

function restaurarFiltros() {
    Object.keys(estadosFiltros).forEach(filtroId => {
        const checkbox = document.getElementById(filtroId);
        if (checkbox) {
            checkbox.checked = estadosFiltros[filtroId];
        }
    });
}
```

### 3. Tabs Ativas

```javascript
// Estado: { 'tabAtiva': 'tab-2' }

let tabAtiva = 'tab-1';

function mudarTab(tabId) {
    tabAtiva = tabId;
    // Lógica de mudar tab...
}

function restaurarTab() {
    if (tabAtiva) {
        const tab = document.getElementById(tabAtiva);
        if (tab) {
            tab.classList.add('active');
        }
    }
}
```

### 4. Posição de Scroll

```javascript
// Estado: { 'lista-logs': 250 }

let posicoesScroll = {};

function salvarScroll(elementoId) {
    const elemento = document.getElementById(elementoId);
    posicoesScroll[elementoId] = elemento.scrollTop;
}

function restaurarScroll() {
    Object.keys(posicoesScroll).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.scrollTop = posicoesScroll[id];
        }
    });
}

// Salvar antes de atualizar
document.getElementById('lista-logs').addEventListener('scroll', () => {
    salvarScroll('lista-logs');
});
```

### 5. Modais Abertos

```javascript
// Estado: { 'modalAberto': 'modal-detalhes-192.168.1.1' }

let modalAberto = null;

function abrirModal(modalId) {
    modalAberto = modalId;
    // Lógica de abrir modal...
}

function fecharModal() {
    modalAberto = null;
}

// No auto-refresh, só atualizar se modal estiver aberto
setInterval(() => {
    if (modalAberto) {
        atualizarModal(modalAberto);
    }
}, 3000);
```

---

## 🎨 Padrões de Implementação

### Padrão 1: Estado Simples (Single Context)

Use quando há apenas **um contexto** (uma página, um componente):

```javascript
let estados = {
    secaoExpandida: true,
    filtroAtivo: 'todos',
    paginaAtual: 1
};

function salvarEstado(chave, valor) {
    estados[chave] = valor;
}

function restaurarEstados() {
    // Aplicar todos os estados de uma vez
}
```

### Padrão 2: Estado por Entidade (Multiple Contexts)

Use quando há **múltiplos contextos** (vários modais, várias cards):

```javascript
let estadosPorEntidade = {
    'ip-1': { secoes: {...}, filtros: {...} },
    'ip-2': { secoes: {...}, filtros: {...} }
};

function salvarEstado(entidadeId, chave, valor) {
    if (!estadosPorEntidade[entidadeId]) {
        estadosPorEntidade[entidadeId] = {};
    }
    estadosPorEntidade[entidadeId][chave] = valor;
}

function restaurarEstados(entidadeId) {
    // Restaurar apenas estados desta entidade
}
```

### Padrão 3: Estado Hierárquico

Use quando há **hierarquia de estados**:

```javascript
let estadoGlobal = {
    dashboard: {
        filtros: { ativo: true, periodo: '7d' },
        ordenacao: 'data'
    },
    modais: {
        'ip-1': {
            secoes: { endpoints: false, logs: true },
            pagina: 2
        }
    }
};
```

### Padrão 4: Estado com Timestamp

Use quando precisa **invalidar estados antigos**:

```javascript
let estadosComTimestamp = {
    'secao-1': { 
        valor: true, 
        timestamp: Date.now() 
    }
};

function salvarEstado(chave, valor) {
    estadosComTimestamp[chave] = {
        valor: valor,
        timestamp: Date.now()
    };
}

function restaurarEstados() {
    const CINCO_MINUTOS = 5 * 60 * 1000;
    const agora = Date.now();
    
    Object.keys(estadosComTimestamp).forEach(chave => {
        const estado = estadosComTimestamp[chave];
        
        // Só restaurar se não for muito antigo
        if (agora - estado.timestamp < CINCO_MINUTOS) {
            aplicarEstado(chave, estado.valor);
        }
    });
}
```

---

## 🔍 Troubleshooting

### Problema 1: Estado não está sendo restaurado

**Sintoma:** Após o refresh, os elementos voltam ao estado inicial.

**Causas Comuns:**
1. IDs dos elementos mudaram após reconstrução
2. Estado está sendo restaurado ANTES do HTML ser reconstruído
3. Estado não está sendo salvo corretamente

**Solução:**
```javascript
// ❌ ERRADO - IDs inconsistentes
<div id="secao-1">...</div> // Primeira renderização
<div id="secao-${index}">...</div> // Segunda renderização (ID diferente!)

// ✅ CORRETO - IDs consistentes
<div id="secao-${itemId}">...</div> // Sempre usa o mesmo ID

// ❌ ERRADO - Restaurar antes de reconstruir
restaurarEstados();
element.innerHTML = novoHTML; // Sobrescreve tudo!

// ✅ CORRETO - Restaurar DEPOIS de reconstruir
element.innerHTML = novoHTML;
restaurarEstados(); // Agora os elementos existem

// ❌ ERRADO - Não está salvando
function toggle(id) {
    elemento.style.display = 'none';
    // Esqueceu de salvar!
}

// ✅ CORRETO - Salvar explicitamente
function toggle(id) {
    elemento.style.display = 'none';
    estados[id] = false; // Salvar estado
}
```

### Problema 2: Estado se perde ao trocar de página

**Sintoma:** Ao navegar entre páginas, o estado é perdido.

**Solução:**
```javascript
// Usar localStorage para persistir entre páginas
function salvarEstado(chave, valor) {
    estados[chave] = valor;
    localStorage.setItem('estados', JSON.stringify(estados));
}

function carregarEstados() {
    const salvos = localStorage.getItem('estados');
    if (salvos) {
        estados = JSON.parse(salvos);
    }
}

// Carregar ao iniciar
window.addEventListener('load', () => {
    carregarEstados();
    restaurarEstados();
});
```

### Problema 3: Performance ruim com muitos estados

**Sintoma:** A restauração demora muito quando há centenas de elementos.

**Solução:**
```javascript
// ✅ Otimização 1: Restaurar apenas elementos visíveis
function restaurarEstadosVisiveis() {
    Object.keys(estados).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && isElementVisible(elemento)) {
            aplicarEstado(id, estados[id]);
        }
    });
}

// ✅ Otimização 2: Debounce do salvamento
const salvarEstadoDebounced = debounce((chave, valor) => {
    estados[chave] = valor;
}, 300);

// ✅ Otimização 3: Limpar estados não usados
function limparEstadosAntigos() {
    Object.keys(estados).forEach(id => {
        if (!document.getElementById(id)) {
            delete estados[id]; // Elemento não existe mais
        }
    });
}
```

### Problema 4: Conflito entre múltiplos auto-refreshes

**Sintoma:** Múltiplos intervalos estão rodando simultaneamente.

**Solução:**
```javascript
let intervalId = null;

function iniciarAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (intervalId) {
        clearInterval(intervalId);
    }
    
    // Criar novo intervalo
    intervalId = setInterval(() => {
        atualizarInterface();
    }, 3000);
}

function pararAutoRefresh() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// Limpar ao sair da página
window.addEventListener('beforeunload', pararAutoRefresh);
```

---

## 🎓 Conceitos Avançados

### 1. Estado Derivado

Alguns estados podem ser **calculados** ao invés de salvos:

```javascript
// Em vez de salvar quantos itens estão selecionados:
let estadoSelecao = {
    'item-1': true,
    'item-2': true,
    'item-3': false
};

// Calcular quantos estão selecionados:
function contarSelecionados() {
    return Object.values(estadoSelecao).filter(v => v).length;
}
```

### 2. Estado Imutável

Use spread operator para evitar mutações indesejadas:

```javascript
// ❌ Mutação direta
estados.secoes['nova-secao'] = true;

// ✅ Imutabilidade
estados = {
    ...estados,
    secoes: {
        ...estados.secoes,
        'nova-secao': true
    }
};
```

### 3. Middleware de Estado

Adicione lógica entre salvar e aplicar:

```javascript
function salvarEstadoComValidacao(chave, valor) {
    // Validar
    if (!validarEstado(chave, valor)) {
        console.warn('Estado inválido:', chave, valor);
        return;
    }
    
    // Salvar
    estados[chave] = valor;
    
    // Notificar (opcional)
    notificarMudancaDeEstado(chave, valor);
}
```

---

## 📚 Recursos Adicionais

### Bibliotecas que Ajudam:
- **React/Vue/Angular:** Frameworks já gerenciam estado automaticamente
- **Redux/Vuex:** Gerenciadores de estado globais
- **LocalForage:** Persistência de estado offline-first
- **ImmerJS:** Trabalhar com estados imutáveis facilmente

### Alternativas ao `innerHTML`:
```javascript
// 1. Virtual DOM (React, Vue)
// Compara diferenças e atualiza apenas o necessário

// 2. Morphdom (biblioteca)
// Faz "morphing" do DOM (atualiza apenas diferenças)
import morphdom from 'morphdom';
morphdom(elementoAntigo, novoHTML);

// 3. Atualização Manual Seletiva
// Atualizar apenas números, sem reconstruir HTML
document.getElementById('contador').textContent = novoValor;
```

---

## ✅ Checklist de Implementação

Use este checklist ao implementar preservação de estado:

- [ ] **Identificar** quais elementos precisam preservar estado
- [ ] **Criar** variáveis globais de estado apropriadas
- [ ] **Garantir** que IDs dos elementos sejam consistentes
- [ ] **Salvar** estado em todas as funções de interação
- [ ] **Restaurar** estado APÓS reconstruir HTML
- [ ] **Testar** com auto-refresh ativo
- [ ] **Verificar** se estados múltiplos (ex: vários modais) funcionam
- [ ] **Limpar** estados antigos periodicamente
- [ ] **Documentar** quais estados estão sendo preservados
- [ ] **Considerar** persistência (localStorage) se necessário

---

## 🎯 Conclusão

Esta técnica resolve o problema clássico de **"UI que perde estado durante atualizações dinâmicas"**.

### Quando Usar:
✅ Auto-refresh de dados  
✅ Single Page Applications (SPA)  
✅ Dashboards em tempo real  
✅ Interfaces com polling  
✅ WebSockets que atualizam UI  

### Quando NÃO Usar:
❌ Se você pode usar frameworks modernos (React/Vue/Angular)  
❌ Se não há auto-refresh  
❌ Se a UI é estática  

### Alternativas:
- **Frameworks modernos:** Gerenciam estado automaticamente
- **Web Components:** Encapsulam estado
- **Morphdom:** Atualiza apenas diferenças do DOM

---

**Desenvolvido como solução para o Dashboard de Logs**  
**Data:** Outubro 2025  
**Repositório:** api (Node.js + Express)
