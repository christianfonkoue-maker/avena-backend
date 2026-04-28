/**
 * AVENA — Socket.IO Configuration
 * socket.js
 * 
 * Real-time chat using WebSockets
 */

const Message = require('./models/Message');

function setupSocketHandlers(io) {
  // Store online users
  const onlineUsers = new Map(); // userId -> socketId
  
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    
    // User joins with their ID
    socket.on('user:join', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`✅ User ${userId} is online`);
      }
    });
    
    // Send a message
    socket.on('message:send', async (data) => {
      const { to, subject, body, contextType, contextId } = data;
      const from = socket.userId;
      
      if (!from || !to || !body) {
        socket.emit('message:error', { error: 'Missing required fields' });
        return;
      }
      
      try {
        // Save message to database
        const message = await Message.send({
          senderId: from,
          receiverId: to,
          subject,
          body,
          contextType,
          contextId,
        });
        
        // Emit to sender (confirmation)
        socket.emit('message:sent', { message });
        
        // Check if recipient is online
        const recipientSocketId = onlineUsers.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:received', {
            message: {
              ...message,
              senderName: data.senderName || 'User',
            },
          });
        }
        
        // Emit notification to recipient
        io.to(recipientSocketId).emit('notification:new', {
          type: 'message',
          from: from,
          message: body.substring(0, 100),
        });
        
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });
    
    // Mark message as read
    socket.on('message:read', async (data) => {
      const { messageId, conversationWith } = data;
      const userId = socket.userId;
      
      if (messageId) {
        await Message.markAsRead(messageId, userId);
      }
      
      if (conversationWith) {
        await Message.markConversationAsRead(userId, conversationWith);
      }
      
      // Notify sender that message was read
      const senderSocketId = onlineUsers.get(conversationWith);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read-receipt', {
          userId: userId,
          conversationWith: conversationWith,
        });
      }
    });
    
    // User typing indicator
    socket.on('typing:start', (data) => {
      const { to } = data;
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', {
          from: socket.userId,
        });
      }
    });
    
    socket.on('typing:stop', (data) => {
      const { to } = data;
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', {
          from: socket.userId,
        });
      }
    });
    
    // User disconnects
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`🔌 User ${socket.userId} disconnected`);
      }
    });
  });
}

module.exports = setupSocketHandlers;