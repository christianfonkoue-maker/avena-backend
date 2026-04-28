/**
 * AVENA — Message Controller
 * controllers/messageController.js
 */

const Message = require('../models/Message');

/**
 * Send a message
 */
async function sendMessage(req, res) {
  const userId = req.user.id;
  const { to, subject, body, contextType, contextId } = req.body;
  
  try {
    // Validate recipient exists
    const recipientCheck = await require('../config/db').query(
      'SELECT id FROM users WHERE id = $1',
      [to]
    );
    
    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Recipient not found.' });
    }
    
    const message = await Message.send({
      senderId: userId,
      receiverId: to,
      subject,
      body,
      contextType,
      contextId,
    });
    
    res.status(201).json({ ok: true, message, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get user's conversations
 */
async function getConversations(req, res) {
  const userId = req.user.id;
  
  try {
    const conversations = await Message.getConversations(userId);
    res.json({ ok: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get conversation with a specific user
 */
async function getConversation(req, res) {
  const userId = req.user.id;
  const { userId: otherUserId } = req.params;
  
  try {
    const messages = await Message.getConversation(userId, otherUserId);
    res.json({ ok: true, messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get unread message count
 */
async function getUnreadCount(req, res) {
  const userId = req.user.id;
  
  try {
    const count = await Message.getUnreadCount(userId);
    res.json({ ok: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Mark conversation as read
 */
async function markConversationAsRead(req, res) {
  const userId = req.user.id;
  const { userId: otherUserId } = req.params;
  
  try {
    const count = await Message.markConversationAsRead(userId, otherUserId);
    res.json({ ok: true, count, message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Delete a message
 */
async function deleteMessage(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const result = await Message.deleteMessage(id, userId);
    if (!result) {
      return res.status(404).json({ ok: false, error: 'Message not found.' });
    }
    
    res.json({ ok: true, message: 'Message deleted.' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  getUnreadCount,
  markConversationAsRead,
  deleteMessage,
};