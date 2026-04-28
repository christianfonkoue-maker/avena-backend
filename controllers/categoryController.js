/**
 * AVENA — Category Controller (Mega Menu)
 * controllers/categoryController.js
 */

const Category = require('../models/Category');

/**
 * Get all categories with subcategories and links
 */
async function getAllCategories(req, res) {
  try {
    const categories = await Category.getAll();
    res.json({ ok: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get featured categories
 */
async function getFeaturedCategories(req, res) {
  try {
    const categories = await Category.getFeatured();
    res.json({ ok: true, categories });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get single category by key
 */
async function getCategoryByKey(req, res) {
  const { key } = req.params;
  
  try {
    const category = await Category.getByKey(key);
    if (!category) {
      return res.status(404).json({ ok: false, error: 'Category not found.' });
    }
    
    res.json({ ok: true, category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  getAllCategories,
  getFeaturedCategories,
  getCategoryByKey,
};