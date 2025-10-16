# 🎯 TEMPLATE - Como Criar Nova Funcionalidade# 🎯 TEMPLATE - Como Criar Nova Funcionalidade# 🎯 TEMPLATE - Como Criar Nova Funcionalidade



> **⏱️ Tempo estimado: 5 minutos**



Este template tem tudo que você precisa para criar uma nova funcionalidade na API.> **⏱️ Tempo estimado: 5 minutos**> **⏱️ Tempo estimado: 5 minutos**



---



## 🚀 Passo a Passo RápidoEste template tem tudo que você precisa para criar uma nova funcionalidade na API.Este template tem tudo que você precisa para criar uma nova funcionalidade na API.



### 1️⃣ Copie esta pasta



```powershell------

# Windows (PowerShell) - Na raiz do projeto

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -Recurse

```

## 🚀 Passo a Passo Rápido## 🚀 Passo a Passo Rápido

**Exemplo real:** Criar funcionalidade para gerar QR Code

```powershell

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

```### 1️⃣ Copie esta pasta### 1️⃣ Copie esta pasta



---



### 2️⃣ Decida quais arquivos você precisa```powershell```powershell



| Arquivo | Quando usar | Obrigatório? |# Windows (PowerShell) - Na raiz do projeto# Windows (PowerShell) - Na raiz do projeto

|---------|-------------|--------------|

| **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** |Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -RecurseCopy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/NOME_DA_SUA_FUNCIONALIDADE" -Recurse

| **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** |

| **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não |``````

| **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não |



---

**Exemplo real:** Criar funcionalidade para gerar QR Code**Exemplo real:** Criar funcionalidade para gerar QR Code

### 3️⃣ Renomeie e customize os arquivos

```powershell```powershell

#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):

Copy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -RecurseCopy-Item -Path "src/functions/_TEMPLATE" -Destination "src/functions/qrcode" -Recurse

1. **`templateController.js`** → **`suaController.js`**

   - Contém a lógica de negócio``````

   - Usa `BaseController` para respostas padronizadas

   

2. **`templateRoutes.js`** → **`suaRoutes.js`**

   - Define as rotas (GET, POST, PUT, DELETE)------

   - Adiciona validação nos endpoints



#### 📄 Arquivos OPCIONAIS (copie só se precisar):

### 2️⃣ Decida quais arquivos você precisa### 2️⃣ Decida quais arquivos você precisa

3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*

   - Funções auxiliares complexas

   - Validações customizadas

   - Formatações especiais| Arquivo | Quando usar | Obrigatório? || Arquivo | Quando usar | Obrigatório? |

   

   **⚠️ Copie APENAS SE:**|---------|-------------|--------------||---------|-------------|--------------|

   - Tiver lógica complexa reutilizável

   - Tiver cálculos matemáticos| **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** || **`*Controller.js`** | Sempre! Contém a lógica da sua funcionalidade | ✅ **SIM** |

   - Tiver formatações de dados

   | **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** || **`*Routes.js`** | Sempre! Define as rotas HTTP (GET, POST, etc.) | ✅ **SIM** |

   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)

| **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não || **`*Utils.js`** | Só se tiver funções auxiliares reutilizáveis | ❌ Não |

#### 🗑️ Arquivo para DELETAR:

| **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não || **`README.md`** | Opcional - documenta sua funcionalidade | ❌ Não |

4. **`README.md`** - Delete após ler este guia!



---

------

### 4️⃣ Edite o Controller



Abra `suaController.js` e implemente sua lógica:

### 3️⃣ Renomeie e customize os arquivos### 3️⃣ Renomeie e customize os arquivos

```javascript

import { BaseController } from '../../core/BaseController.js';



class SuaController extends BaseController {#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):#### 📄 Arquivos OBRIGATÓRIOS (sempre copie):

    async seuMetodo(req, res) {

        return this.execute(req, res, async (req, res) => {

            const { parametro } = req.body;

            1. **`templateController.js`** → **`suaController.js`**1. **`templateController.js`** → **`suaController.js`**

            // Sua lógica aqui

            const resultado = `Processado: ${parametro}`;   - Contém a lógica de negócio   - Contém a lógica de negócio

            

            // Retorna sucesso   - Usa `BaseController` para respostas padronizadas   - Usa `BaseController` para respostas padronizadas

            return this.success(res, { resultado }, 'Operação realizada');

        });      

    }

}2. **`templateRoutes.js`** → **`suaRoutes.js`**2. **`templateRoutes.js`** → **`suaRoutes.js`**



export default new SuaController();   - Define as rotas (GET, POST, PUT, DELETE)   - Define as rotas (GET, POST, PUT, DELETE)

```

   - Adiciona validação nos endpoints   - Adiciona validação nos endpoints

---



### 5️⃣ Edite as Routes

#### 📄 Arquivo OPCIONAL (copie só se precisar):#### 📄 Arquivos OPCIONAIS (copie só se precisar):

Abra `suaRoutes.js` e defina suas rotas:



```javascript

import { Router } from 'express';3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*3. **`templateUtils.js`** → **`suaUtils.js`** *(opcional)*

import suaController from './suaController.js';

import { validate } from '../../middlewares/validator.js';   - Funções auxiliares complexas   - Funções auxiliares complexas



const router = Router();   - Validações customizadas   - Validações customizadas



// Schema de validação   - Formatações especiais   - Formatações especiais

const schema = {

    required: ['parametro'],      

    types: { parametro: 'string' }

};   **⚠️ Copie APENAS SE:**   **⚠️ Copie APENAS SE:**



// Rota   - Tiver lógica complexa reutilizável (cálculos, validações)   - Tiver lógica complexa reutilizável

router.post('/sua-rota', validate(schema), (req, res) => 

    suaController.seuMetodo(req, res)   - Tiver formatações de dados (máscaras, conversões)   - Tiver cálculos matemáticos

);

   - Tiver funções usadas em vários lugares   - Tiver formatações de dados

export default router;

```      



---   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)   **❌ NÃO copie se:** Sua funcionalidade é simples (CRUD básico)



### 6️⃣ Reinicie o servidor



```powershell#### 🗑️ Arquivo para DELETAR:---

npm start

```



**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**4. **`README.md`** - Delete após ler este guia!### 4️⃣ Edite o Controller



---



## 📚 Exemplos Práticos---Abra `suaController.js` e implemente sua lógica:



### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)



**Objetivo:** Criar endpoint que ecoa uma mensagem### 4️⃣ Edite o Controller```javascript



**Arquivos necessários:**import { BaseController } from '../../core/BaseController.js';

- ✅ `echoController.js`

- ✅ `echoRoutes.js`Abra `suaController.js` e implemente sua lógica:

- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)

class SuaController extends BaseController {

```javascript

// echoController.js```javascript    async seuMetodo(req, res) {

import { BaseController } from '../../core/BaseController.js';

import { BaseController } from '../../core/BaseController.js';        return this.execute(req, res, async (req, res) => {

class EchoController extends BaseController {

    async ecoar(req, res) {            const { parametro } = req.body;

        return this.execute(req, res, async (req, res) => {

            const { mensagem } = req.body;class SuaController extends BaseController {            

            

            // Lógica simples - não precisa de Utils    async seuMetodo(req, res) {            // Sua lógica aqui

            const resultado = {

                original: mensagem,        return this.execute(req, res, async (req, res) => {            const resultado = `Processado: ${parametro}`;

                eco: mensagem.toUpperCase(),

                tamanho: mensagem.length            const { parametro } = req.body;            

            };

                                    // Retorna sucesso

            return this.success(res, resultado, 'Eco processado');

        });            // Sua lógica aqui            return this.success(res, { resultado }, 'Operação realizada');

    }

}            const resultado = `Processado: ${parametro}`;        });



export default new EchoController();                }

```

            // Retorna sucesso}

```javascript

// echoRoutes.js            return this.success(res, { resultado }, 'Operação realizada');

import { Router } from 'express';

import echoController from './echoController.js';        });export default new SuaController();

import { validate } from '../../middlewares/validator.js';

    }```

const router = Router();

}

const echoSchema = {

    required: ['mensagem'],---

    types: { mensagem: 'string' },

    length: { mensagem: { min: 1, max: 500 } }export default new SuaController();

};

```### 5️⃣ Edite as Routes

router.post('/echo', validate(echoSchema), (req, res) => 

    echoController.ecoar(req, res)

);

---Abra `suaRoutes.js` e defina suas rotas:

export default router;

```



**Teste:**### 5️⃣ Edite as Routes```javascript

```powershell

curl -X POST http://localhost:3000/echo `import { Router } from 'express';

  -H "Content-Type: application/json" `

  -d '{"mensagem":"Olá Mundo"}'Abra `suaRoutes.js` e defina suas rotas:import suaController from './suaController.js';

```

import { validate } from '../../middlewares/validator.js';

---

```javascript

### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)

import { Router } from 'express';const router = Router();

**Objetivo:** Validar CPF com formatação e cálculo de dígitos

import suaController from './suaController.js';

**Arquivos necessários:**

- ✅ `cpfController.js`import { validate } from '../../middlewares/validator.js';// Schema de validação

- ✅ `cpfRoutes.js`

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)const schema = {



```javascriptconst router = Router();    required: ['parametro'],

// cpfUtils.js - Funções auxiliares complexas

export function removerFormatacao(cpf) {    types: { parametro: 'string' }

    return cpf.replace(/[^\d]/g, '');

}// Schema de validação};



export function validarDigitos(cpf) {const schema = {

    const numeros = cpf.slice(0, 9);

    const digitos = cpf.slice(9);    required: ['parametro'],// Rota

    

    // Cálculo do primeiro dígito    types: { parametro: 'string' }router.post('/sua-rota', validate(schema), (req, res) => 

    let soma = 0;

    for (let i = 0; i < 9; i++) {};    suaController.seuMetodo(req, res)

        soma += parseInt(numeros[i]) * (10 - i);

    });

    const primeiroDigito = (soma * 10) % 11 % 10;

    // Rota

    // Cálculo do segundo dígito

    soma = 0;router.post('/sua-rota', validate(schema), (req, res) => export default router;

    for (let i = 0; i < 10; i++) {

        soma += parseInt(cpf[i]) * (11 - i);    suaController.seuMetodo(req, res)```

    }

    const segundoDigito = (soma * 10) % 11 % 10;);

    

    return digitos === `${primeiroDigito}${segundoDigito}`;---

}

export default router;

export function formatarCPF(cpf) {

    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');```### 6️⃣ Reinicie o servidor

}

```



```javascript---```powershell

// cpfController.js - Usa as funções do Utils

import { BaseController } from '../../core/BaseController.js';npm start

import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';

### 6️⃣ Reinicie o servidor```

class CPFController extends BaseController {

    async validar(req, res) {

        return this.execute(req, res, async (req, res) => {

            const { cpf } = req.body;```powershell**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**

            

            // Usa as funções do Utilsnpm start

            const cpfLimpo = removerFormatacao(cpf);

            const valido = validarDigitos(cpfLimpo);```---

            const formatado = formatarCPF(cpfLimpo);

            

            return this.success(res, {

                cpfOriginal: cpf,**✨ Pronto! Sua funcionalidade estará disponível automaticamente!**## 📚 Exemplos Práticos

                cpfFormatado: formatado,

                valido: valido

            }, valido ? 'CPF válido' : 'CPF inválido');

        });---### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)

    }

}



export default new CPFController();## 📚 Exemplos Práticos**Objetivo:** Criar endpoint que ecoa uma mensagem

```



---

### 🎯 Exemplo 1: Funcionalidade SIMPLES (não precisa de Utils)**Arquivos necessários:**

## 🤔 Quando Usar Utils?

- ✅ `echoController.js`

### ✅ **USE Utils quando tiver:**

**Objetivo:** Criar endpoint que ecoa uma mensagem- ✅ `echoRoutes.js`

| Tipo de Lógica | Exemplo |

|----------------|---------|- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)

| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |**Arquivos necessários:**

| **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |

| **Conversões** | XML para JSON, Base64, criptografia |- ✅ `echoController.js````javascript

| **Operações reutilizáveis** | Função usada em 3+ lugares |

- ✅ `echoRoutes.js`// echoController.js

### ❌ **NÃO use Utils para:**

- ❌ ~~echoUtils.js~~ (NÃO precisa - lógica é simples)import { BaseController } from '../../core/BaseController.js';

| Tipo de Lógica | Por quê |

|----------------|---------|

| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |```javascriptclass EchoController extends BaseController {

| **Lógica única** | Se usa só 1 vez, deixe no controller |

| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |// echoController.js    async ecoar(req, res) {



---import { BaseController } from '../../core/BaseController.js';        return this.execute(req, res, async (req, res) => {



## 🎨 Padrões de Código            const { mensagem } = req.body;



### ✅ Bom (use this.success e this.error)class EchoController extends BaseController {            

```javascript

async criarItem(req, res) {    async ecoar(req, res) {            // Lógica simples - não precisa de Utils

    return this.execute(req, res, async (req, res) => {

        const item = await database.create(req.body);        return this.execute(req, res, async (req, res) => {            const resultado = {

        return this.success(res, item, 'Item criado', 201);

    });            const { mensagem } = req.body;                original: mensagem,

}

```                            eco: mensagem.toUpperCase(),



### ❌ Ruim (não use res.json diretamente)            // Lógica simples - não precisa de Utils                tamanho: mensagem.length

```javascript

async criarItem(req, res) {            const resultado = {            };

    try {

        const item = await database.create(req.body);                original: mensagem,            

        res.status(201).json({ success: true, data: item });

    } catch (error) {                eco: mensagem.toUpperCase(),            return this.success(res, resultado, 'Eco processado');

        res.status(500).json({ success: false, error: error.message });

    }                tamanho: mensagem.length        });

}

```            };    }



---            }



## 📋 Checklist Final            return this.success(res, resultado, 'Eco processado');



Antes de testar, verifique:        });export default new EchoController();



- [ ] Arquivos renomeados corretamente (sem "template" no nome)    }```

- [ ] Controller estende `BaseController`

- [ ] Routes exporta `export default router`}

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Código documentado com comentários```javascript

- [ ] Testado com curl ou Postman

- [ ] README.md do template foi deletadoexport default new EchoController();// echoRoutes.js



---```import { Router } from 'express';



## 🆘 Troubleshootingimport echoController from './echoController.js';



**Problema:** Rota não encontrada (404)```javascriptimport { validate } from '../../middlewares/validator.js';

- ✅ Verifique se o arquivo termina com `Routes.js`

- ✅ Verifique se tem `export default router` no final// echoRoutes.js

- ✅ Reinicie o servidor

import { Router } from 'express';const router = Router();

**Problema:** Erro de validação

- ✅ Verifique o schema no Routesimport echoController from './echoController.js';

- ✅ Confira se os campos obrigatórios estão no body

- ✅ Veja os tipos de dados (string, number, etc.)import { validate } from '../../middlewares/validator.js';const echoSchema = {



**Problema:** Erro interno (500)    required: ['mensagem'],

- ✅ Veja o console do servidor para stack trace

- ✅ Verifique imports dos módulosconst router = Router();    types: { mensagem: 'string' },

- ✅ Confira se BaseController foi importado corretamente

    length: { mensagem: { min: 1, max: 500 } }

---

const echoSchema = {};

## 📖 Referências Úteis

    required: ['mensagem'],

- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`

- **BaseController:** `src/core/BaseController.js`    types: { mensagem: 'string' },router.post('/echo', validate(echoSchema), (req, res) => 

- **Validator:** `src/middlewares/validator.js`

- **Documentação Express:** [expressjs.com](https://expressjs.com/)    length: { mensagem: { min: 1, max: 500 } }    echoController.ecoar(req, res)



---};);



**🎉 Boa sorte com sua nova funcionalidade!**



*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*router.post('/echo', validate(echoSchema), (req, res) => export default router;


    echoController.ecoar(req, res)```

);

**Teste:**

export default router;```powershell

```curl -X POST http://localhost:3000/echo `

  -H "Content-Type: application/json" `

**Teste:**  -d '{"mensagem":"Olá Mundo"}'

```powershell```

curl -X POST http://localhost:3000/echo `

  -H "Content-Type: application/json" `---

  -d '{"mensagem":"Olá Mundo"}'

```### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)



---**Objetivo:** Validar CPF com formatação e cálculo de dígitos



### 🎯 Exemplo 2: Funcionalidade COMPLEXA (precisa de Utils)**Arquivos necessários:**

- ✅ `cpfController.js`

**Objetivo:** Validar CPF com formatação e cálculo de dígitos- ✅ `cpfRoutes.js`

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)

**Arquivos necessários:**

- ✅ `cpfController.js````javascript

- ✅ `cpfRoutes.js`// cpfUtils.js - Funções auxiliares complexas

- ✅ `cpfUtils.js` (SIM precisa - lógica complexa de validação)export function removerFormatacao(cpf) {

    return cpf.replace(/[^\d]/g, '');

```javascript}

// cpfUtils.js - Funções auxiliares complexas

export function removerFormatacao(cpf) {export function validarDigitos(cpf) {

    return cpf.replace(/[^\d]/g, '');    const numeros = cpf.slice(0, 9);

}    const digitos = cpf.slice(9);

    

export function validarDigitos(cpf) {    // Cálculo do primeiro dígito

    const numeros = cpf.slice(0, 9);    let soma = 0;

    const digitos = cpf.slice(9);    for (let i = 0; i < 9; i++) {

            soma += parseInt(numeros[i]) * (10 - i);

    // Cálculo do primeiro dígito    }

    let soma = 0;    const primeiroDigito = (soma * 10) % 11 % 10;

    for (let i = 0; i < 9; i++) {    

        soma += parseInt(numeros[i]) * (10 - i);    // Cálculo do segundo dígito

    }    soma = 0;

    const primeiroDigito = (soma * 10) % 11 % 10;    for (let i = 0; i < 10; i++) {

            soma += parseInt(cpf[i]) * (11 - i);

    // Cálculo do segundo dígito    }

    soma = 0;    const segundoDigito = (soma * 10) % 11 % 10;

    for (let i = 0; i < 10; i++) {    

        soma += parseInt(cpf[i]) * (11 - i);    return digitos === `${primeiroDigito}${segundoDigito}`;

    }}

    const segundoDigito = (soma * 10) % 11 % 10;

    export function formatarCPF(cpf) {

    return digitos === `${primeiroDigito}${segundoDigito}`;    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

}}

```

export function formatarCPF(cpf) {

    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');```javascript

}// cpfController.js - Usa as funções do Utils

```import { BaseController } from '../../core/BaseController.js';

import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';

```javascript

// cpfController.js - Usa as funções do Utilsclass CPFController extends BaseController {

import { BaseController } from '../../core/BaseController.js';    async validar(req, res) {

import { removerFormatacao, validarDigitos, formatarCPF } from './cpfUtils.js';        return this.execute(req, res, async (req, res) => {

            const { cpf } = req.body;

class CPFController extends BaseController {            

    async validar(req, res) {            // Usa as funções do Utils

        return this.execute(req, res, async (req, res) => {            const cpfLimpo = removerFormatacao(cpf);

            const { cpf } = req.body;            const valido = validarDigitos(cpfLimpo);

                        const formatado = formatarCPF(cpfLimpo);

            // Usa as funções do Utils            

            const cpfLimpo = removerFormatacao(cpf);            return this.success(res, {

            const valido = validarDigitos(cpfLimpo);                cpfOriginal: cpf,

            const formatado = formatarCPF(cpfLimpo);                cpfFormatado: formatado,

                            valido: valido

            return this.success(res, {            }, valido ? 'CPF válido' : 'CPF inválido');

                cpfOriginal: cpf,        });

                cpfFormatado: formatado,    }

                valido: valido}

            }, valido ? 'CPF válido' : 'CPF inválido');

        });export default new CPFController();

    }```

}

---

export default new CPFController();

```## 🤔 Quando Usar Utils?



---### ✅ **USE Utils quando tiver:**



## 🤔 Quando Usar Utils?| Tipo de Lógica | Exemplo |

|----------------|---------|

### ✅ **USE Utils quando tiver:**| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |

| Tipo de Lógica | Exemplo || **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |

|----------------|---------|| **Conversões** | XML para JSON, Base64, criptografia |

| **Cálculos complexos** | Validação de CPF, juros compostos, distância entre coordenadas || **Operações reutilizáveis** | Função usada em 3+ lugares |

| **Formatações** | Máscara de telefone, formatação de moeda, datas |

| **Validações customizadas** | Regex complexos, validação de CNPJ, CEP |### ❌ **NÃO use Utils para:**

| **Conversões** | XML para JSON, Base64, criptografia |

| **Operações reutilizáveis** | Função usada em 3+ lugares || Tipo de Lógica | Por quê |

|----------------|---------|

### ❌ **NÃO use Utils para:**| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |

| Tipo de Lógica | Por quê || **Lógica única** | Se usa só 1 vez, deixe no controller |

|----------------|---------|| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |

| **CRUD simples** | Array.filter(), .find(), .map() são claros no controller |

| **Operações inline** | `text.toUpperCase()`, `Number(value)` são autoexplicativas |---

| **Lógica única** | Se usa só 1 vez, deixe no controller |

| **Queries básicas** | SELECT, INSERT simples não precisam de abstração |## 🎨 Padrões de Código



---### ✅ Bom (use this.success e this.error)

```javascript

## 🎨 Padrões de Códigoasync criarItem(req, res) {

    return this.execute(req, res, async (req, res) => {

### ✅ Bom (use this.success e this.error)        const item = await database.create(req.body);

```javascript        return this.success(res, item, 'Item criado', 201);

async criarItem(req, res) {    });

    return this.execute(req, res, async (req, res) => {}

        const item = await database.create(req.body);```

        return this.success(res, item, 'Item criado', 201);

    });### ❌ Ruim (não use res.json diretamente)

}```javascript

```async criarItem(req, res) {

    try {

### ❌ Ruim (não use res.json diretamente)        const item = await database.create(req.body);

```javascript        res.status(201).json({ success: true, data: item });

async criarItem(req, res) {    } catch (error) {

    try {        res.status(500).json({ success: false, error: error.message });

        const item = await database.create(req.body);    }

        res.status(201).json({ success: true, data: item });}

    } catch (error) {```

        res.status(500).json({ success: false, error: error.message });

    }---

}

```## 📋 Checklist Final



---Antes de testar, verifique:



## 📋 Checklist Final- [ ] Arquivos renomeados corretamente (sem "template" no nome)

- [ ] Controller estende `BaseController`

Antes de testar, verifique:- [ ] Routes exporta `export default router`

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Arquivos renomeados corretamente (sem "template" no nome)- [ ] Código documentado com comentários

- [ ] README.md do template foi deletado- [ ] Testado com curl ou Postman

- [ ] Controller estende `BaseController`

- [ ] Routes exporta `export default router`---

- [ ] Validação adicionada nas rotas sensíveis

- [ ] Código documentado com comentários## 🆘 Troubleshooting

- [ ] Testado com curl ou Postman

**Problema:** Rota não encontrada (404)

---- ✅ Verifique se o arquivo termina com `Routes.js`

- ✅ Verifique se tem `export default router` no final

## 🆘 Troubleshooting- ✅ Reinicie o servidor



**Problema:** Rota não encontrada (404)**Problema:** Erro de validação

- ✅ Verifique se o arquivo termina com `Routes.js`- ✅ Verifique o schema no Routes

- ✅ Verifique se tem `export default router` no final- ✅ Confira se os campos obrigatórios estão no body

- ✅ Reinicie o servidor- ✅ Veja os tipos de dados (string, number, etc.)



**Problema:** Erro de validação**Problema:** Erro interno (500)

- ✅ Verifique o schema no Routes- ✅ Veja o console do servidor para stack trace

- ✅ Confira se os campos obrigatórios estão no body- ✅ Verifique imports dos módulos

- ✅ Veja os tipos de dados (string, number, etc.)- ✅ Confira se BaseController foi importado corretamente



**Problema:** Erro interno (500)---

- ✅ Veja o console do servidor para stack trace

- ✅ Verifique imports dos módulos## 📖 Referências Úteis

- ✅ Confira se BaseController foi importado corretamente

- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`

---- **BaseController:** `src/core/BaseController.js`

- **Validator:** `src/middlewares/validator.js`

## 📖 Referências Úteis- **Documentação Express:** [expressjs.com](https://expressjs.com/)



- **Exemplos reais:** Veja `src/functions/exemplo/` e `src/functions/pdf/`---

- **BaseController:** `src/core/BaseController.js`

- **Validator:** `src/middlewares/validator.js`**🎉 Boa sorte com sua nova funcionalidade!**

- **Documentação Express:** [expressjs.com](https://expressjs.com/)

*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*

---

---

**🎉 Boa sorte com sua nova funcionalidade!**

## 📝 Convenções e Boas Práticas

*Dúvidas? Abra uma issue no GitHub ou consulte os exemplos existentes.*

### ✅ DO (Faça):
- Use a classe `BaseController` para respostas padronizadas
- Adicione validação com `validate(schema)` nas rotas
- Use `async/await` para operações assíncronas
- Documente seu código com comentários JSDoc
- Mantenha controllers enxutos (lógica no Utils)
- Use nomes descritivos para funções e variáveis

### ❌ DON'T (Não faça):
- Não faça tratamento de erro manual (BaseController faz isso)
- Não valide parâmetros no controller (use validator middleware)
- Não acesse `req.body` sem validação
- Não retorne `res.status().json()` manualmente (use `this.success()` / `this.error()`)
- Não repita código (crie funções auxiliares no Utils)

---

## 🎓 Exemplos

### Exemplo 1: Funcionalidade Simples (Echo)
```javascript
// echoController.js
import { BaseController } from '../../core/BaseController.js';

class EchoController extends BaseController {
    async echo(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { message } = req.body;
            this.success(res, { echo: message }, 'Mensagem ecoada');
        });
    }
}

export const echoController = new EchoController();
export const echo = (req, res) => echoController.echo(req, res);
```

```javascript
// echoRoutes.js
import express from 'express';
import { echo } from './echoController.js';
import { validate } from '../../middlewares/validator.js';

const router = express.Router();

const echoSchema = {
    required: ['message'],
    types: { message: 'string' }
};

router.post('/echo', validate(echoSchema), echo);

export default router;
```

### Exemplo 2: Funcionalidade com Dependência Externa
```javascript
// qrcodeController.js
import { BaseController } from '../../core/BaseController.js';
import QRCode from 'qrcode';

class QRCodeController extends BaseController {
    async generate(req, res) {
        return this.execute(req, res, async (req, res) => {
            const { text } = req.body;
            const qrCode = await QRCode.toDataURL(text);
            
            this.success(res, { qrCode }, 'QR Code gerado');
        });
    }
}

export const qrcodeController = new QRCodeController();
export const generate = (req, res) => qrcodeController.generate(req, res);
```

---

## 🔧 Schemas de Validação

### Estrutura do Schema:
```javascript
const schema = {
    // Campos obrigatórios
    required: ['campo1', 'campo2'],
    
    // Tipos de dados
    types: {
        campo1: 'string',  // 'string', 'number', 'boolean', 'array'
        campo2: 'number'
    },
    
    // Valores permitidos (enum)
    enum: {
        campo1: ['valor1', 'valor2', 'valor3']
    },
    
    // Tamanho min/max
    length: {
        campo1: { min: 3, max: 100 }
    }
};
```

---

## 🚀 Próximos Passos

1. **Instale dependências** (se necessário):
   ```bash
   npm install nome-da-lib
   ```

2. **Teste sua funcionalidade**:
   ```bash
   curl -X POST http://localhost:3000/sua-rota \
     -H "Content-Type: application/json" \
     -d '{"parametro": "valor"}'
   ```

3. **Documente no README principal** da API

4. **Adicione testes** (futuro)

---

## 📚 Referências

- [Express.js Docs](https://expressjs.com/)
- [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [REST API Best Practices](https://restfulapi.net/)

---

**Dúvidas? Consulte os controllers existentes em:**
- `src/funcionalidades/validacao/`
- `src/funcionalidades/pdf/`
- `src/funcionalidades/calculo/`
