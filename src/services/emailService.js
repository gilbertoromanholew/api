/**
 * Exemplo de serviço para envio de emails
 * 
 * Configure as variáveis de ambiente SMTP no .env para usar.
 * Instale: npm install nodemailer
 */

import logger from '../config/logger.js';
import config from '../config/index.js';

// import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        logger.info(`Enviando email para: ${to}`);
        
        // Configurar transporter (descomente quando configurar)
        // const transporter = nodemailer.createTransport({
        //     host: config.email.host,
        //     port: config.email.port,
        //     secure: false,
        //     auth: {
        //         user: config.email.user,
        //         pass: config.email.password,
        //     },
        // });
        
        // const info = await transporter.sendMail({
        //     from: config.email.user,
        //     to,
        //     subject,
        //     text,
        //     html,
        // });
        
        // logger.info(`Email enviado: ${info.messageId}`);
        // return info;
        
        logger.warn('Serviço de email não configurado. Configure SMTP no .env');
        return { success: false, message: 'Email service not configured' };
    } catch (error) {
        logger.error(`Erro ao enviar email: ${error.message}`);
        throw error;
    }
};

export default {
    sendEmail,
};
