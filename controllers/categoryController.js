/**
 * AVENA — Category Controller (Mega Menu)
 * controllers/categoryController.js
 */

const Category = require('../models/Category');
const Product = require('../models/Product');

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

// ========== NOUVEAU ==========
/**
 * Get category details for category page (with product count and filters)
 */
async function getCategoryDetails(req, res) {
  const { categoryKey } = req.params;
  const { sub } = req.query;
  
  try {
    const category = await Category.getCategoryWithDetails(categoryKey, sub);
    if (!category) {
      return res.status(404).json({ ok: false, error: 'Category not found.' });
    }
    
    res.json({ ok: true, category });
  } catch (error) {
    console.error('Get category details error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

// ========== NOUVEAU ==========
/**
 * Get filter schema for a category (price ranges, popular filters, dynamic filters)
 */
async function getFilterSchema(req, res) {
  const { categoryKey } = req.params;
  const { sub } = req.query;
  
  try {
    // Get price ranges
    const priceStats = await Product.getPriceRanges(categoryKey, sub);
    
    // Define price ranges (in GHS)
    const priceRanges = [
      { min: 0, max: 1800, label: 'Under 1.8K' },
      { min: 1800, max: 5900, label: '1.8 - 5.9K' },
      { min: 5900, max: 9000, label: '5.9 - 9K' },
      { min: 9000, max: 24000, label: '9 - 24K' },
      { min: 24000, max: null, label: 'More than 24K' }
    ];
    
    // Get popular filters from database
    const popularFiltersResult = await Category.getCategoryWithDetails(categoryKey, sub);
    const popularFilters = popularFiltersResult?.popularFilters || [];
    
    // Define dynamic filters for electronics category (can be extended)
    let dynamicFilters = [];
    if (categoryKey === 'electronics') {
      dynamicFilters = [
        { key: 'processor', label: 'Processor', type: 'checkbox' },
        { key: 'ram', label: 'RAM', type: 'checkbox' },
        { key: 'storage', label: 'Storage Capacity', type: 'checkbox' },
        { key: 'brand', label: 'Brand', type: 'checkbox' },
        { key: 'os', label: 'Operating System', type: 'checkbox' },
        { key: 'display_size', label: 'Display Size', type: 'checkbox' }
      ];
    }
    
    res.json({
      ok: true,
      schema: {
        priceRanges,
        popularFilters,
        dynamicFilters
      }
    });
  } catch (error) {
    console.error('Get filter schema error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

// ========== NOUVEAU ==========
/**
 * Get available options for a specific filter
 */
async function getFilterOptions(req, res) {
  const { categoryKey, filterKey } = req.params;
  const { sub } = req.query;
  
  try {
    const options = await Product.getFilterOptions(categoryKey, filterKey, sub);
    res.json({
      ok: true,
      options: options.map(opt => ({
        value: opt.value,
        label: opt.value,
        count: parseInt(opt.count)
      }))
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  getAllCategories,
  getFeaturedCategories,
  getCategoryByKey,
  getCategoryDetails,     // NOUVEAU
  getFilterSchema,        // NOUVEAU
  getFilterOptions        // NOUVEAU
};