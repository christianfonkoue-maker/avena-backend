/**
 * AVENA — Event Model
 * models/Event.js
 */

const db = require('../config/db');

class Event {
  /**
   * Create a new event
   */
  static async create(eventData) {
    const { title, description, category, organizerId, date, time, endTime, location, isPaid, price, capacity, coverImage, tags } = eventData;
    
    const result = await db.query(
      `INSERT INTO events (title, description, category, organizer_id, date, time, end_time, location, is_paid, price, capacity, cover_image, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [title, description, category, organizerId, date, time || null, endTime || null, location, isPaid || false, price || 0, capacity || null, coverImage, tags || []]
    );
    
    return result.rows[0];
  }

  /**
   * Get event by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT e.*, 
              u.first_name, u.last_name, u.avatar_url as organizer_avatar, u.university_id,
              (SELECT json_agg(image_url) FROM event_images WHERE event_id = e.id ORDER BY sort_order) as images
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const event = result.rows[0];
    event.organizer = {
      id: event.organizer_id,
      name: `${event.first_name} ${event.last_name}`,
      avatar: event.organizer_avatar,
      university: event.university_id,
    };
    delete event.organizer_id;
    delete event.first_name;
    delete event.last_name;
    delete event.organizer_avatar;
    
    return event;
  }

  /**
   * Get all events with filters
   */
  static async findAll(filters = {}) {
    const { category, organizerId, status, fromDate, toDate, search, limit = 24, offset = 0 } = filters;
    
    let query = `
      SELECT e.*, u.first_name, u.last_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    
    if (category) {
      query += ` AND e.category = $${idx++}`;
      params.push(category);
    }
    
    if (organizerId) {
      query += ` AND e.organizer_id = $${idx++}`;
      params.push(organizerId);
    }
    
    if (status) {
      query += ` AND e.status = $${idx++}`;
      params.push(status);
    }
    
    if (fromDate) {
      query += ` AND e.date >= $${idx++}`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND e.date <= $${idx++}`;
      params.push(toDate);
    }
    
    if (search) {
      query += ` AND (e.title ILIKE $${idx++} OR e.description ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY e.date ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    return result.rows.map(e => ({
      ...e,
      organizer: {
        id: e.organizer_id,
        name: `${e.first_name} ${e.last_name}`,
      },
      organizer_id: undefined,
      first_name: undefined,
      last_name: undefined,
    }));
  }

  /**
   * Get upcoming events
   */
  static async getUpcoming(limit = 12) {
    const result = await db.query(
      `SELECT e.*, u.first_name, u.last_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.date >= CURRENT_DATE AND e.status = 'upcoming'
       ORDER BY e.date ASC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  /**
   * Get events by organizer
   */
  static async findByOrganizer(organizerId) {
    const result = await db.query(
      `SELECT * FROM events WHERE organizer_id = $1 ORDER BY date DESC`,
      [organizerId]
    );
    return result.rows;
  }

  /**
   * Update event
   */
  static async update(id, updates) {
    const allowedFields = ['title', 'description', 'category', 'date', 'time', 'end_time', 'location', 'is_paid', 'price', 'capacity', 'cover_image', 'tags', 'status'];
    const setClauses = [];
    const values = [];
    let idx = 1;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${idx}`);
        values.push(updates[field]);
        idx++;
      }
    }
    
    if (setClauses.length === 0) return null;
    
    values.push(id);
    const result = await db.query(
      `UPDATE events SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete event
   */
  static async delete(id) {
    const result = await db.query(
      `UPDATE events SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Increment registered count
   */
  static async incrementRegistered(eventId) {
    const result = await db.query(
      `UPDATE events SET registered_count = registered_count + 1 WHERE id = $1 RETURNING registered_count`,
      [eventId]
    );
    return result.rows[0]?.registered_count || 0;
  }
}

module.exports = Event;