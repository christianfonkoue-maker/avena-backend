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
      // Get subcategory groups for this category
      const groupsResult = await db.query(
        `SELECT id, title, sort_order FROM subcategory_groups WHERE category_key = $1 ORDER BY sort_order`,
        [category.key]
      );
      
      const groups = groupsResult.rows;
      
      for (const group of groups) {
        // Get links for this group
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
}

module.exports = Category;