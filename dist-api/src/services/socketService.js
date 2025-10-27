/**
 * 🔌 SOCKET.IO SERVICE - Real-time Events
 * 
 * Sistema de WebSocket para atualizações em tempo real:
 * - Créditos atualizados
 * - Conquistas desbloqueadas
 * - Status de assinatura
 * - Notificações do sistema
 * 
 * SEGURANÇA:
 * - Autenticação via JWT token
 * - Rooms isoladas por usuário
 * - Rate limiting de eventos
 */

import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwtUtils.js';
import { setUserOnline, setUserOffline, updateHeartbeat } from './presenceService.js';

let io = null;
const connectedUsers = new Map(); // userId -> socketId

/**
 * Inicializar Socket.IO
 * @param {http.Server} server - Servidor HTTP do Express
 */
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configurações de performance
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      // Verificar JWT
      const decoded = verifyToken(token);
      
      if (!decoded || !decoded.userId) {
        return next(new Error('Token inválido'));
      }

      // Anexar dados do usuário ao socket
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      console.error('❌ Erro na autenticação WebSocket:', error.message);
      next(new Error('Autenticação falhou'));
    }
  });

  // Conexão estabelecida
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const socketId = socket.id;
    const ipAddress = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'];
    
    console.log(`✅ WebSocket conectado: ${userId}`);
    
    // Registrar usuário conectado
    connectedUsers.set(userId, socketId);
    
    // Marcar como online no banco de dados
    await setUserOnline(userId, socketId, ipAddress, userAgent);
    
    // Adicionar usuário à sua room privada
    socket.join(`user:${userId}`);
    
    // Se for admin, adicionar à room de admins
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.join('admin');
    }
    
    // Notificar admins sobre usuário online
    emitPresenceUpdate(userId, true);
    
    // Enviar confirmação de conexão
    socket.emit('connected', {
      message: 'Conectado ao servidor em tempo real',
      userId,
      timestamp: new Date().toISOString()
    });

    // Evento de desconexão
    socket.on('disconnect', async () => {
      console.log(`❌ WebSocket desconectado: ${userId}`);
      connectedUsers.delete(userId);
      
      // Marcar como offline no banco de dados
      await setUserOffline(userId);
      
      // Notificar admins sobre usuário offline
      emitPresenceUpdate(userId, false);
    });

    // Ping/Pong para manter conexão viva e atualizar heartbeat
    socket.on('ping', async () => {
      socket.emit('pong', { timestamp: Date.now() });
      
      // Atualizar heartbeat no banco (última atividade)
      await updateHeartbeat(userId);
    });
  });

  console.log('🔌 Socket.IO inicializado com sucesso');
  return io;
}

/**
 * Obter instância do Socket.IO
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
}

/**
 * Verificar se usuário está conectado
 */
export function isUserConnected(userId) {
  return connectedUsers.has(userId);
}

/**
 * Obter número de usuários conectados
 */
export function getConnectedUsersCount() {
  return connectedUsers.size;
}

// ============================================
// EVENTOS DE NEGÓCIO
// ============================================

/**
 * Notificar atualização de créditos
 */
export function emitCreditsUpdate(userId, creditsData) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('credits:updated', {
    total: creditsData.total,
    bonus: creditsData.bonus,
    purchased: creditsData.purchased,
    timestamp: new Date().toISOString()
  });
  
  console.log(`💰 Créditos atualizados para usuário ${userId}:`, creditsData.total);
}

/**
 * Notificar conquista desbloqueada
 */
export function emitAchievementUnlocked(userId, achievement) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('achievement:unlocked', {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    points: achievement.points,
    icon: achievement.icon,
    timestamp: new Date().toISOString()
  });
  
  console.log(`🏆 Conquista desbloqueada para usuário ${userId}:`, achievement.title);
}

/**
 * Notificar mudança de nível
 */
export function emitLevelUp(userId, levelData) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('level:up', {
    newLevel: levelData.level,
    newTitle: levelData.title,
    pointsRequired: levelData.pointsRequired,
    timestamp: new Date().toISOString()
  });
  
  console.log(`⬆️ Level up para usuário ${userId}:`, levelData.level);
}

/**
 * Notificar mudança de assinatura
 */
export function emitSubscriptionUpdate(userId, subscriptionData) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('subscription:updated', {
    plan: subscriptionData.plan,
    status: subscriptionData.status,
    isPro: subscriptionData.isPro,
    expiresAt: subscriptionData.expiresAt,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📦 Assinatura atualizada para usuário ${userId}:`, subscriptionData.plan);
}

/**
 * Notificar perfil atualizado
 */
export function emitProfileUpdate(userId, profileData) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('profile:updated', {
    firstName: profileData.firstName,
    fullName: profileData.fullName,
    email: profileData.email,
    timestamp: new Date().toISOString()
  });
  
  console.log(`👤 Perfil atualizado para usuário ${userId}`);
}

/**
 * Notificação genérica do sistema
 */
export function emitNotification(userId, notification) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    type: notification.type || 'info', // info, success, warning, error
    title: notification.title,
    message: notification.message,
    action: notification.action, // Opcional: { label, url }
    timestamp: new Date().toISOString()
  });
  
  console.log(`🔔 Notificação enviada para usuário ${userId}:`, notification.title);
}

/**
 * Broadcast para todos os usuários conectados
 */
export function broadcastToAll(event, data) {
  if (!io) return;
  
  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Broadcast para todos: ${event}`);
}

/**
 * Enviar para grupo de usuários (ex: admins)
 */
export function emitToRole(role, event, data) {
  if (!io) return;
  
  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`� Evento ${event} enviado para role: ${role}`);
}

// ============================================
// FUNÇÕES ADMIN-SPECIFIC
// ============================================

/**
 * Emitir alerta para todos admins online
 * 
 * @param {object} alert - Dados do alerta
 * @param {string} alert.title - Título do alerta
 * @param {string} alert.message - Mensagem
 * @param {string} alert.type - Tipo: 'info', 'warning', 'error', 'success'
 * @param {string} alert.userId - ID do usuário relacionado (opcional)
 * @param {object} alert.data - Dados adicionais (opcional)
 */
export function emitAdminAlert(alert) {
  if (!io) return;
  
  io.to('admin').emit('admin:alert', {
    title: alert.title,
    message: alert.message,
    type: alert.type || 'info',
    userId: alert.userId,
    data: alert.data || {},
    timestamp: new Date().toISOString()
  });
  
  console.log(`🚨 Alerta admin: ${alert.title}`);
}

/**
 * Notificar admins sobre ação de usuário
 * 
 * @param {string} userId - ID do usuário que executou a ação
 * @param {string} action - Tipo de ação
 * @param {object} details - Detalhes da ação
 */
export function emitUserAction(userId, action, details = {}) {
  if (!io) return;
  
  io.to('admin').emit('admin:user-action', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  
  console.log(`👤 Ação de usuário notificada aos admins: ${action}`);
}

/**
 * Notificar admins sobre novo usuário registrado
 */
export function emitNewUserRegistered(userData) {
  if (!io) return;
  
  io.to('admin').emit('admin:new-user', {
    userId: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    timestamp: new Date().toISOString()
  });
  
  console.log(`✨ Novo usuário notificado aos admins: ${userData.email}`);
}

/**
 * Notificar admins sobre atualização de presença
 * (Usuário conectou ou desconectou)
 */
export function emitPresenceUpdate(userId, isOnline) {
  if (!io) return;
  
  io.to('admin').emit('admin:presence-update', {
    userId,
    isOnline,
    timestamp: new Date().toISOString()
  });
  
  console.log(`${isOnline ? '🟢' : '🔴'} Presença atualizada para admins: ${userId}`);
}

/**
 * Broadcast de estatísticas em tempo real para admins
 */
export function emitAdminStats(stats) {
  if (!io) return;
  
  io.to('admin').emit('admin:stats-update', {
    ...stats,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📊 Estatísticas atualizadas para admins`);
}

export default {
  initializeSocket,
  getIO,
  isUserConnected,
  getConnectedUsersCount,
  emitCreditsUpdate,
  emitAchievementUnlocked,
  emitLevelUp,
  emitSubscriptionUpdate,
  emitProfileUpdate,
  emitNotification,
  broadcastToAll,
  emitToRole
};
