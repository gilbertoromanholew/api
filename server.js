import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { getApiInfo } from './src/routes/index.js';

// Funcionalidades
import cpfRoutes from './src/funcionalidades/validacao/cpfRoutes.js';
import pdfRoutes from './src/funcionalidades/pdf/pdfRoutes.js';
import calculoRoutes from './src/funcionalidades/calculo/calculoRoutes.js';

import config from './src/config/index.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Middleware de segurança - filtro de IP
app.use(ipFilter);

// Rota raiz - Documentação
app.get('/', getApiInfo);

// Funcionalidades da API
app.use(cpfRoutes);        // Validação
app.use(pdfRoutes);        // PDF
app.use(calculoRoutes);    // Cálculo

// Iniciar servidor
app.listen(config.port, config.host, () => {
    console.log(`\n🚀 Servidor rodando na porta ${config.port}`);
    console.log(`📍 Acesse: http://localhost:${config.port}\n`);
    console.log('✅ Funcionalidades ativas:');
    console.log('   - Validação (CPF)');
    console.log('   - Leitura de PDF');
    console.log('   - Cálculo matemático');
    console.log('\n');
});
