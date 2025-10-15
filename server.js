import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ipFilter } from './src/middlewares/ipFilter.js';
import { getApiInfo } from './src/routes/index.js';
import cpfRoutes from './src/routes/cpfRoutes.js';
import pdfRoutes from './src/routes/pdfRoutes.js';
import config from './src/config/index.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Middleware de segurança - filtro de IP
app.use(ipFilter);

// Rota raiz
app.get('/', getApiInfo);

// Rotas da API
app.use(cpfRoutes);
app.use(pdfRoutes);

// Iniciar servidor
app.listen(config.port, config.host, () => {
    console.log(`Servidor rodando na porta ${config.port}`);
    console.log('API iniciada com sucesso!');
});
