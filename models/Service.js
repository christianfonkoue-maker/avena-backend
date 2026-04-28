/**
 * AVENA — Service Model
 * models/Service.js
 */

const db = require('../config/db');

class Service {
  /**
   * Create a new service
   */
  static async create(serviceData) {
    const { title, description, category, subcategory, providerId, price, priceType, deliveryDays, coverImage } = serviceData;
    
    const result = await db.query(
      `INSERT INTO services (title, description, category, subcategory, provider_id, price, price_type, delivery_days, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, category, subcategory, providerId, price, priceType || 'fixed', deliveryDays || null, coverImage]
    );
    
    return result.rows[0];
  }

  /**
   * Get service by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT s.*, 
              u.first_name, u.last_name, u.avatar_url as provider_avatar, u.university_id,
              (SELECT json_agg(image_url) FROM service_images WHERE service_id = s.id ORDER BY sort_order) as images
       FROM services s
       LEFT JOIN users u ON s.provider_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const service = result.rows[0];
    service.provider = {
      id: service.provider_id,
      name: `${service.first_name} ${service.last_name}`,
      avatar: service.provider_avatar,
      university: service.university_id,
    };
    delete service.provider_id;
    delete service.first_name;
    delete service.last_name;
    delete service.provider_avatar;
    
    return service;
  }

  /**
   * Get all services with filters
   */
  static async findAll(filters = {}) {
    const { category, providerId, search, limit = 24, offset = 0 } = filters;
    
    let query = `
      SELECT s.*, u.first_name, u.last_name
      FROM services s
      LEFT JOIN users u ON s.provider_id = u.id
      WHERE s.status = 'active'
    `;
    const params = [];
    let idx = 1;
    
    if (category) {
      query += ` AND s.category = $${idx++}`;
      params.push(category);
    }
    
    if (providerId) {
      query += ` AND s.provider_id = $${idx++}`;
      params.push(providerId);
    }
    
    if (search) {
      query += ` AND (s.title ILIKE $${idx++} OR s.description ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    return result.rows.map(s => ({
      ...s,
      provider: {
        id: s.provider_id,
        name: `${s.first_name} ${s.last_name}`,
      },
      provider_id: undefined,
      first_name: undefined,
      last_name: undefined,
    }));
  }

  /**
   * Get services by provider
   */
  static async findByProvider(providerId) {
    const result = await db.query(
      `SELECT * FROM services WHERE provider_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [providerId]
    );
    return result.rows;
  }

  /**
   * Update service
   */
  static async update(id, updates) {
    const allowedFields = ['title', 'description', 'category', 'subcategory', 'price', 'price_type', 'delivery_days', 'cover_image'];
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
      `UPDATE services SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete service (soft delete)
   */
  static async delete(id) {
    const result = await db.query(
      `UPDATE services SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update service rating
   */
  static async updateRating(serviceId) {
    const result = await db.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
       FROM service_reviews
       WHERE service_id = $1`,
      [serviceId]
    );
    
    const avgRating = parseFloat(result.rows[0].avg_rating) || 0;
    const reviewCount = parseInt(result.rows[0].review_count);
    
    await db.query(
      `UPDATE services SET rating = $1, reviews_count = $2 WHERE id = $3`,
      [Math.round(avgRating * 10) / 10, reviewCount, serviceId]
    );
  }
}

module.exports = Service;