# 🚀 Cheat Sheet: Preservar Estado Durante Auto-Refresh

> **Problema:** Interface perde estado visual (expandido/colapsado) quando auto-refresh reconstrói o HTML.  
> **Solução:** Salvar → Reconstruir → Restaurar

---

## 📦 Template Básico (Copy & Paste)

```javascript
// ========== 1. CRIAR VARIÁVEL DE ESTADO ==========
let estados = {}; 
// Exemplo: { 'secao-1': true, 'secao-2': false }

// ========== 2. SALVAR AO INTERAGIR ==========
function toggle(id) {
    const elemento = document.getElementById(id);
    const expandido = elemento.style.display !== 'none';
    
    // Visual
    elemento.style.display = expandido ? 'none' : 'block';
    
    // 💾 SALVAR
    estados[id] = !expandido;
}

// ========== 3. RESTAURAR APÓS RECONSTRUIR ==========
async function atualizar() {
    // Buscar dados
    const data = await fetch('/api/dados').then(r => r.json());
    
    // Reconstruir HTML
    document.getElementById('container').innerHTML = gerarHTML(data);
    
    // ♻️ RESTAURAR
    Object.keys(estados).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = estados[id] ? 'block' : 'none';
        }
    });
}

// ========== 4. AUTO-REFRESH ==========
setInterval(atualizar, 3000);
```

---

## 🎯 Padrões Comuns

### Expansão/Colapso com Ícone

```javascript
let estados = {};

function toggle(id) {
    const secao = document.getElementById(id);
    const icone = document.getElementById(id + '-icon');
    
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
        estados[id] = true;
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
        estados[id] = false;
    }
}

function restaurar() {
    Object.keys(estados).forEach(id => {
        const secao = document.getElementById(id);
        const icone = document.getElementById(id + '-icon');
        if (secao && icone) {
            secao.style.display = estados[id] ? 'block' : 'none';
            icone.textContent = estados[id] ? '▼' : '▶';
        }
    });
}
```

### Múltiplos Contextos (Ex: Modal por IP)

```javascript
let estadosPorIP = {}; // { 'IP': { 'secao': true/false } }
let modalAberto = null;

function toggle(secaoId) {
    const secao = document.getElementById(secaoId);
    secao.style.display = secao.style.display === 'none' ? 'block' : 'none';
    
    // Salvar por contexto
    if (!estadosPorIP[modalAberto]) {
        estadosPorIP[modalAberto] = {};
    }
    estadosPorIP[modalAberto][secaoId] = secao.style.display === 'block';
}

function restaurar(ip) {
    if (estadosPorIP[ip]) {
        Object.keys(estadosPorIP[ip]).forEach(secaoId => {
            const secao = document.getElementById(secaoId);
            if (secao) {
                secao.style.display = estadosPorIP[ip][secaoId] ? 'block' : 'none';
            }
        });
    }
}
```

### Checkboxes

```javascript
let checkboxes = {};

function salvarCheckbox(id) {
    const checkbox = document.getElementById(id);
    checkboxes[id] = checkbox.checked;
}

function restaurarCheckboxes() {
    Object.keys(checkboxes).forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = checkboxes[id];
    });
}
```

### Posição de Scroll

```javascript
let scrolls = {};

function salvarScroll(id) {
    const elem = document.getElementById(id);
    scrolls[id] = elem.scrollTop;
}

function restaurarScrolls() {
    Object.keys(scrolls).forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.scrollTop = scrolls[id];
    });
}
```

---

## ⚠️ Troubleshooting Rápido

| Problema | Causa | Solução |
|----------|-------|---------|
| Estado não restaura | IDs mudaram | Use IDs consistentes |
| Estado não salva | Esqueceu de salvar | Adicione `estados[id] = valor` |
| Performance ruim | Muitos elementos | Restaure apenas visíveis |
| Estado some | Refresh da página | Use `localStorage` |

---

## 🔧 Exemplo Real Completo

```javascript
// ===== VARIÁVEIS =====
let modalAberto = null;
let estadosPorIP = {};

// ===== TOGGLE =====
function toggleSecao(secaoId) {
    const secao = document.getElementById(secaoId);
    const icone = document.getElementById(secaoId + '-icon');
    
    // Visual
    if (secao.style.display === 'none') {
        secao.style.display = 'block';
        icone.textContent = '▼';
    } else {
        secao.style.display = 'none';
        icone.textContent = '▶';
    }
    
    // Salvar
    if (!estadosPorIP[modalAberto]) {
        estadosPorIP[modalAberto] = {};
    }
    estadosPorIP[modalAberto][secaoId] = (secao.style.display === 'block');
}

// ===== ATUALIZAR =====
async function atualizarModal(ip) {
    const data = await fetch(`/api/dados/${ip}`).then(r => r.json());
    
    // Reconstruir
    document.getElementById('modal-body').innerHTML = `
        <h3 onclick="toggleSecao('secao-${ip}')">
            <span id="secao-${ip}-icon">▼</span> Título
        </h3>
        <div id="secao-${ip}">Conteúdo...</div>
    `;
    
    // Restaurar
    if (estadosPorIP[ip]) {
        Object.keys(estadosPorIP[ip]).forEach(secaoId => {
            const secao = document.getElementById(secaoId);
            const icone = document.getElementById(secaoId + '-icon');
            if (secao && icone) {
                const expandido = estadosPorIP[ip][secaoId];
                secao.style.display = expandido ? 'block' : 'none';
                icone.textContent = expandido ? '▼' : '▶';
            }
        });
    }
}

// ===== AUTO-REFRESH =====
setInterval(() => {
    if (modalAberto) atualizarModal(modalAberto);
}, 3000);
```

---

## 📝 Checklist Rápido

- [ ] Criar variável de estado global
- [ ] Salvar estado em função de interação
- [ ] Restaurar DEPOIS de reconstruir HTML
- [ ] Testar com auto-refresh ativo
- [ ] IDs dos elementos são consistentes

---

## 💡 Dica Pro

```javascript
// Criar helper para evitar repetição
const EstadoManager = {
    estados: {},
    
    salvar(id, valor) {
        this.estados[id] = valor;
    },
    
    restaurarTodos() {
        Object.keys(this.estados).forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = this.estados[id] ? 'block' : 'none';
            }
        });
    }
};

// Uso
EstadoManager.salvar('secao-1', true);
EstadoManager.restaurarTodos();
```

---

**Ver documentação completa:** `.github/PRESERVAR_ESTADO_AUTO_REFRESH.md`
