/**
 * AVENA — Product Model
 * models/Product.js
 */

const db = require('../config/db');

class Product {
  /**
   * Create a new product
   */
  static async create(productData) {
    const { title, description, category, subcategory, price, moq, stock, condition, sellerId, coverImage } = productData;
    
    const result = await db.query(
      `INSERT INTO products (title, description, category, subcategory, price, moq, stock, condition, seller_id, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, category, subcategory, price, moq || 1, stock || 1, condition || 'new', sellerId, coverImage]
    );
    
    return result.rows[0];
  }

  /**
   * Get product by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, 
              u.first_name, u.last_name, u.avatar_url as seller_avatar, u.university_id,
              (SELECT json_agg(image_url) FROM product_images WHERE product_id = p.id ORDER BY sort_order) as images
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const product = result.rows[0];
    product.seller = {
      id: product.seller_id,
      name: `${product.first_name} ${product.last_name}`,
      avatar: product.seller_avatar,
      university: product.university_id,
    };
    delete product.seller_id;
    delete product.first_name;
    delete product.last_name;
    delete product.seller_avatar;
    
    return product;
  }

  /**
   * Get all products with filters
   */
  static async findAll(filters = {}) {
    const { category, subcategory, minPrice, maxPrice, sellerId, search, limit = 24, offset = 0 } = filters;
    
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.avatar_url as seller_avatar
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];
    let idx = 1;
    
    if (category) {
      query += ` AND p.category = $${idx++}`;
      params.push(category);
    }
    
    if (subcategory) {
      query += ` AND p.subcategory = $${idx++}`;
      params.push(subcategory);
    }
    
    if (minPrice) {
      query += ` AND p.price >= $${idx++}`;
      params.push(minPrice);
    }
    
    if (maxPrice) {
      query += ` AND p.price <= $${idx++}`;
      params.push(maxPrice);
    }
    
    if (sellerId) {
      query += ` AND p.seller_id = $${idx++}`;
      params.push(sellerId);
    }
    
    if (search) {
      query += ` AND (p.title ILIKE $${idx++} OR p.description ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Format products with seller info
    return result.rows.map(p => ({
      ...p,
      seller: {
        id: p.seller_id,
        name: `${p.first_name} ${p.last_name}`,
        avatar: p.seller_avatar,
      },
      seller_id: undefined,
      first_name: undefined,
      last_name: undefined,
      seller_avatar: undefined,
    }));
  }

  /**
   * Get products by seller
   */
  static async findBySeller(sellerId) {
    const result = await db.query(
      `SELECT * FROM products WHERE seller_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [sellerId]
    );
    return result.rows;
  }

  /**
   * Update product
   */
  static async update(id, updates) {
    const allowedFields = ['title', 'description', 'category', 'subcategory', 'price', 'moq', 'stock', 'condition', 'cover_image'];
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
      `UPDATE products SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete product (soft delete by setting status)
   */
  static async delete(id) {
    const result = await db.query(
      `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Add product images
   */
  static async addImages(productId, imageUrls) {
    for (let i = 0; i < imageUrls.length; i++) {
      await db.query(
        `INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)`,
        [productId, imageUrls[i], i]
      );
    }
  }

  /**
   * Update product rating (called when new review added)
   */
  static async updateRating(productId) {
    const result = await db.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
       FROM product_reviews
       WHERE product_id = $1`,
      [productId]
    );
    
    const avgRating = parseFloat(result.rows[0].avg_rating) || 0;
    const reviewCount = parseInt(result.rows[0].review_count);
    
    await db.query(
      `UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3`,
      [Math.round(avgRating * 10) / 10, reviewCount, productId]
    );
  }
}

module.exports = Product;