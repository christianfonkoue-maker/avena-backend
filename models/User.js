/**
 * AVENA — User Model
 * models/User.js
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const { firstName, lastName, email, studentId, universityId, program, year, password } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, student_id, university_id, program, year, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, first_name, last_name, email, student_id, university_id, program, year, role, email_verified, created_at`,
      [firstName, lastName, email, studentId, universityId, program, year, passwordHash]
    );
    
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await db.query(
      `SELECT u.*, un.name as university_name, un.domain as university_domain
       FROM users u
       LEFT JOIN universities un ON u.university_id = un.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT u.*, un.name as university_name, un.domain as university_domain
       FROM users u
       LEFT JOIN universities un ON u.university_id = un.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by student ID
   */
  static async findByStudentId(studentId) {
    const result = await db.query(
      `SELECT * FROM users WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update user profile (only editable fields)
   */
  static async updateProfile(id, updates) {
    const allowedFields = ['avatar_url', 'bio', 'program', 'year'];
    const setClauses = [];
    const values = [];
    let idx = 1;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Convert camelCase to snake_case for DB
        const dbField = field === 'avatar_url' ? 'avatar_url' : field;
        setClauses.push(`${dbField} = $${idx}`);
        values.push(updates[field]);
        idx++;
      }
    }
    
    if (setClauses.length === 0) return null;
    
    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, first_name, last_name, email, student_id, university_id, program, year, avatar_url, bio, role`,
      values
    );
    
    return result.rows[0] || null;
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [passwordHash, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Verify user email
   */
  static async verifyEmail(id) {
    const result = await db.query(
      `UPDATE users SET email_verified = true WHERE id = $1 RETURNING id, email_verified`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update avatar URL
   */
  static async updateAvatar(id, avatarUrl) {
    const result = await db.query(
      `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING avatar_url`,
      [avatarUrl, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user stats (products, services, events count)
   */
  static async getStats(userId) {
    const products = await db.query(
      `SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'active'`,
      [userId]
    );
    const services = await db.query(
      `SELECT COUNT(*) FROM services WHERE provider_id = $1 AND status = 'active'`,
      [userId]
    );
    const events = await db.query(
      `SELECT COUNT(*) FROM events WHERE organizer_id = $1 AND status = 'upcoming'`,
      [userId]
    );
    
    return {
      products: parseInt(products.rows[0].count),
      services: parseInt(services.rows[0].count),
      events: parseInt(events.rows[0].count),
    };
  }

  /**
   * Verify password
   */
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;