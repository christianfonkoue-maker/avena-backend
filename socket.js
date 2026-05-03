/**
 * AVENA — Socket.IO Configuration
 * socket.js
 */

const Message = require('./models/Message');

// Normalise les colonnes snake_case de PostgreSQL en camelCase
// car Message.send() retourne les colonnes brutes (sender_id, receiver_id, etc.)
function normalizeMessage(row) {
  return {
    id:          row.id,
    senderId:    row.sender_id    ?? row.senderId,
    receiverId:  row.receiver_id  ?? row.receiverId,
    body:        row.body,
    subject:     row.subject      || '',
    isRead:      row.is_read      ?? row.isRead      ?? false,
    contextType: row.context_type ?? row.contextType ?? null,
    contextId:   row.context_id   ?? row.contextId   ?? null,
    createdAt:   row.created_at   ?? row.createdAt   ?? new Date().toISOString(),
  };
}

function setupSocketHandlers(io) {
  const onlineUsers = new Map(); // userId (string) -> socketId

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('user:join', (userId) => {
      if (userId) {
        // Toujours stocker en string pour cohérence avec les data-id du DOM
        const uid = String(userId);
        onlineUsers.set(uid, socket.id);
        socket.userId = uid;
        console.log(`✅ User ${uid} is online`);
      }
    });

    socket.on('message:send', async (data) => {
      const { to, subject, body, contextType, contextId, senderName } = data;
      const from = socket.userId;

      if (!from || !to || !body) {
        socket.emit('message:error', { error: 'Missing required fields' });
        return;
      }

      try {
        const raw = await Message.send({
          senderId:    from,
          receiverId:  to,
          subject,
          body,
          contextType,
          contextId,
        });

        // Normaliser snake_case → camelCase
        const message = normalizeMessage(raw);

        // Confirmation à l'expéditeur
        socket.emit('message:sent', { message });

        // Émettre au destinataire avec senderId correct en camelCase
        const recipientSocketId = onlineUsers.get(String(to));
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:received', {
            message: {
              ...message,
              senderName: senderName || 'User',
            },
          });

          io.to(recipientSocketId).emit('notification:new', {
            type:    'message',
            from:    from,
            message: body.substring(0, 100),
          });
        }

      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    socket.on('message:read', async (data) => {
      const { messageId, conversationWith } = data;
      const userId = socket.userId;

      if (messageId) {
        await Message.markAsRead(messageId, userId);
      }
      if (conversationWith) {
        await Message.markConversationAsRead(userId, conversationWith);
      }

      const senderSocketId = onlineUsers.get(String(conversationWith));
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read-receipt', {
          userId,
          conversationWith,
        });
      }
    });

    socket.on('typing:start', (data) => {
      const recipientSocketId = onlineUsers.get(String(data.to));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', { from: socket.userId });
      }
    });

    socket.on('typing:stop', (data) => {
      const recipientSocketId = onlineUsers.get(String(data.to));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', { from: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`🔌 User ${socket.userId} disconnected`);
      }
    });
  });
}

module.exports = setupSocketHandlers;