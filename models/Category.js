/**
 * AVENA — Category Model (for Mega Menu)
 * models/Category.js
 */

const db = require('../config/db');

class Category {
  /**
   * Get all categories with their subcategory groups and links
   */
  static async getAll() {
    const categoriesResult = await db.query(
      `SELECT id, key, label, emoji, sort_order FROM categories ORDER BY sort_order`
    );
    
    const categories = categoriesResult.rows;
    
    for (const category of categories) {
      const groupsResult = await db.query(
        `SELECT id, title, sort_order FROM subcategory_groups WHERE category_key = $1 ORDER BY sort_order`,
        [category.key]
      );
      
      const groups = groupsResult.rows;
      
      for (const group of groups) {
        const linksResult = await db.query(
          `SELECT label, href, image_url, sort_order FROM subcategory_links WHERE group_id = $1 ORDER BY sort_order`,
          [group.id]
        );
        group.links = linksResult.rows;
      }
      
      category.groups = groups;
    }
    
    return categories;
  }

  /**
   * Get category by key
   */
  static async getByKey(key) {
    const result = await db.query(
      `SELECT id, key, label, emoji FROM categories WHERE key = $1`,
      [key]
    );
    return result.rows[0] || null;
  }

  /**
   * Get featured categories (first 4)
   */
  static async getFeatured() {
    const result = await db.query(
      `SELECT key, label, emoji FROM categories ORDER BY sort_order LIMIT 4`
    );
    return result.rows;
  }

  // ========== NOUVEAU ==========
  /**
   * Get category with additional details for category page
   * Includes product count and popular filters
   */
  static async getCategoryWithDetails(key, subcategory = null) {
    // Get category basic info
    const categoryResult = await db.query(
      `SELECT id, key, label, emoji FROM categories WHERE key = $1`,
      [key]
    );
    
    if (categoryResult.rows.length === 0) return null;
    const category = categoryResult.rows[0];
    
    // Get product count
    let countQuery = `SELECT COUNT(*) FROM products WHERE category = $1 AND status = 'active'`;
    const countParams = [key];
    
    if (subcategory) {
      countQuery += ` AND subcategory = $2`;
      countParams.push(subcategory);
    }
    
    const countResult = await db.query(countQuery, countParams);
    category.productCount = parseInt(countResult.rows[0].count);
    
    // Get popular filters for this category
    const filtersResult = await db.query(
      `SELECT filter_key, filter_label FROM category_popular_filters 
       WHERE category_key = $1 ORDER BY sort_order`,
      [key]
    );
    category.popularFilters = filtersResult.rows;
    
    return category;
  }

  // ========== NOUVEAU ==========
  /**
   * Get all subcategories for a given category
   */
  static async getSubcategories(categoryKey) {
    const result = await db.query(
      `SELECT DISTINCT subcategory FROM products 
       WHERE category = $1 AND status = 'active' AND subcategory IS NOT NULL`,
      [categoryKey]
    );
    return result.rows.map(row => row.subcategory);
  }
}

module.exports = Category;