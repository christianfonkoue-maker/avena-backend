/**
 * AVENA — Registration Model (Event Registrations)
 * models/Registration.js
 */

const db = require('../config/db');

class Registration {
  /**
   * Register user for an event
   */
  static async register(eventId, userId) {
    // Check if already registered
    const existing = await db.query(
      `SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    
    if (existing.rows.length > 0) {
      return { alreadyRegistered: true };
    }
    
    // Check event capacity
    const eventResult = await db.query(
      `SELECT capacity, registered_count FROM events WHERE id = $1`,
      [eventId]
    );
    
    const event = eventResult.rows[0];
    if (event.capacity && event.registered_count >= event.capacity) {
      return { isFull: true };
    }
    
    // Register user
    const result = await db.query(
      `INSERT INTO event_registrations (event_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [eventId, userId]
    );
    
    // Increment event registered count
    await db.query(
      `UPDATE events SET registered_count = registered_count + 1 WHERE id = $1`,
      [eventId]
    );
    
    return { registration: result.rows[0], alreadyRegistered: false, isFull: false };
  }

  /**
   * Check if user is registered for an event
   */
  static async isRegistered(eventId, userId) {
    const result = await db.query(
      `SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Unregister user from an event
   */
  static async unregister(eventId, userId) {
    const result = await db.query(
      `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id`,
      [eventId, userId]
    );
    
    if (result.rows.length > 0) {
      // Decrement event registered count
      await db.query(
        `UPDATE events SET registered_count = registered_count - 1 WHERE id = $1`,
        [eventId]
      );
    }
    
    return result.rows[0] || null;
  }

  /**
   * Get all registrations for an event
   */
  static async getEventRegistrations(eventId) {
    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email, u.student_id, u.avatar_url
       FROM event_registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.registered_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  /**
   * Get all events a user is registered for
   */
  static async getUserRegistrations(userId) {
    const result = await db.query(
      `SELECT r.*, e.title, e.date, e.time, e.location, e.cover_image
       FROM event_registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = $1
       ORDER BY r.registered_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = Registration;