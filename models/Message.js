/**
 * AVENA — Message Model
 * models/Message.js
 */

const db = require('../config/db');

class Message {
  /**
   * Send a new message
   */
  static async send(messageData) {
    const { senderId, receiverId, subject, body, contextType, contextId } = messageData;
    
    // Generate conversation ID (simple: based on participants)
    const conversationId = [senderId, receiverId].sort().join('_');
    
    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, subject, body, context_type, context_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [conversationId, senderId, receiverId, subject || null, body, contextType || null, contextId || null]
    );
    
    return result.rows[0];
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId) {
    const result = await db.query(
      `SELECT DISTINCT ON (m.conversation_id) 
              m.conversation_id,
              m.receiver_id,
              m.sender_id,
              m.body as last_message,
              m.created_at as last_message_at,
              m.subject,
              u.first_name, 
              u.last_name,
              u.avatar_url,
              (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND conversation_id = m.conversation_id AND is_read = false) as unread_count
       FROM messages m
       JOIN users u ON (u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY m.conversation_id, m.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      conversationId: row.conversation_id,
      otherUser: {
        id: row.sender_id === userId ? row.receiver_id : row.sender_id,
        name: `${row.first_name} ${row.last_name}`,
        avatar: row.avatar_url,
      },
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      subject: row.subject,
      unreadCount: parseInt(row.unread_count),
    }));
  }

  /**
   * Get messages in a conversation
   */
  static async getConversation(userId, otherUserId) {
    const conversationId = [userId, otherUserId].sort().join('_');
    
    const result = await db.query(
      `SELECT m.*, 
              u.first_name as sender_first_name, 
              u.last_name as sender_last_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Mark messages as read
    await db.query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversationId, userId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: `${row.sender_first_name} ${row.sender_last_name}`,
      receiverId: row.receiver_id,
      subject: row.subject,
      body: row.body,
      isRead: row.is_read,
      contextType: row.context_type,
      contextId: row.context_id,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId, userId) {
    const result = await db.query(
      `UPDATE messages SET is_read = true 
       WHERE id = $1 AND receiver_id = $2 AND is_read = false
       RETURNING id`,
      [messageId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(userId, otherUserId) {
    const conversationId = [userId, otherUserId].sort().join('_');
    const result = await db.query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false
       RETURNING id`,
      [conversationId, userId]
    );
    return result.rowCount;
  }

  /**
   * Delete a message (for user)
   */
  static async deleteMessage(messageId, userId) {
    const result = await db.query(
      `DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) RETURNING id`,
      [messageId, userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Message;