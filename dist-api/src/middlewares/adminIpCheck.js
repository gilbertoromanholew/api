/**
 * Middleware de Validação de IP para Acesso Admin
 * 
 * ✅ SIMPLES E SEGURO: Usa a MESMA lista ALLOWED_IPS do ipFilter.js
 * 
 * Configuração via .env:
 * - DEV:  ALLOWED_IPS=127.0.0.1,10.244.0.0/16
 * - PROD: ALLOWED_IPS=10.244.0.0/16,<IP_VPS>
 * 
 * 🔒 Sem flags extras, sem confusão, sem vulnerabilidades
 */

import { getClientIP, isIPInRange, getConnectionOrigin } from '../utils/ipUtils.js';
import { allowedIPs } from '../config/allowedIPs.js';
import logger from '../config/logger.js';

/**
 * Verifica se o IP está autorizado para acesso admin
 * @param {string} ip - IP a ser verificado
 * @returns {boolean} - true se autorizado
 */
export function isAdminIPAllowed(ip) {
  // 🔒 Usa a MESMA lista de IPs permitidos do sistema
  // Configurada via .env ALLOWED_IPS
  return allowedIPs.some(allowedIP => isIPInRange(ip, allowedIP));
}

/**
 * Middleware para validar IP antes de acesso admin
 * Usado em rotas que requerem acesso da rede ZeroTier
 */
export const adminIpCheck = (req, res, next) => {
  const clientIp = getClientIP(req);
  const isAllowed = isAdminIPAllowed(clientIp);

  // 🔒 Log de segurança detalhado
  const logData = {
    ip: clientIp,
    allowed: isAllowed,
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    }
  };

  if (isAllowed) {
    logger.security('✅ Admin IP Check: AUTORIZADO', logData);
  } else {
    logger.warn('🚨 Admin IP Check: BLOQUEADO - Tentativa de acesso não autorizado', logData);
  }

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied: IP not authorized for admin access',
      yourIP: clientIp,
      allowedNetworks: allowedIPs,
      timestamp: new Date().toISOString()
    });
  }

  // IP autorizado - permitir acesso
  next();
};

/**
 * Middleware apenas para verificar IP (não bloqueia)
 * Usado no endpoint público /admin/check-ip
 */
export const checkAdminIP = (req, res, next) => {
  const clientIp = getClientIP(req);
  const isAllowed = isAdminIPAllowed(clientIp);
  const origin = getConnectionOrigin(clientIp);

  // Adicionar informações ao req para uso posterior
  req.adminIPCheck = {
    ip: clientIp,
    allowed: isAllowed,
    network: isAllowed ? origin.network : 'Unknown',
    timestamp: new Date().toISOString()
  };

  next();
};

export default adminIpCheck;
