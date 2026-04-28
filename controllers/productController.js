/**
 * AVENA — Product Controller
 * controllers/productController.js
 */

const Product = require('../models/Product');
const { getFileUrl, deleteFile } = require('../middleware/upload');
const path = require('path');

/**
 * Create a new product
 */
async function createProduct(req, res) {
  const userId = req.user.id;
  const { title, description, category, subcategory, price, moq, stock, condition } = req.body;
  
  try {
    let coverImage = null;
    
    // Handle uploaded file
    if (req.file) {
      coverImage = getFileUrl(req, req.file.filename, 'uploads/products');
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    }
    
    const product = await Product.create({
      title,
      description,
      category,
      subcategory,
      price: parseFloat(price),
      moq: moq ? parseInt(moq) : 1,
      stock: stock ? parseInt(stock) : 1,
      condition: condition || 'new',
      sellerId: userId,
      coverImage,
    });
    
    // Handle multiple images
    if (req.body.images && Array.isArray(req.body.images)) {
      await Product.addImages(product.id, req.body.images);
    }
    
    res.status(201).json({ ok: true, product, message: 'Product created successfully!' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get all products with filters
 */
async function getProducts(req, res) {
  const { category, subcategory, minPrice, maxPrice, search, limit, offset } = req.query;
  
  try {
    const products = await Product.findAll({
      category,
      subcategory,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      search,
      limit: limit ? parseInt(limit) : 24,
      offset: offset ? parseInt(offset) : 0,
    });
    
    res.json({ ok: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get single product by ID
 */
async function getProduct(req, res) {
  const { id } = req.params;
  
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found.' });
    }
    
    res.json({ ok: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Update product
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const product = await Product.update(id, updates);
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found.' });
    }
    
    res.json({ ok: true, product, message: 'Product updated successfully!' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Delete product
 */
async function deleteProduct(req, res) {
  const { id } = req.params;
  
  try {
    const product = await Product.delete(id);
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found.' });
    }
    
    res.json({ ok: true, message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get products by current user
 */
async function getMyProducts(req, res) {
  const userId = req.user.id;
  
  try {
    const products = await Product.findBySeller(userId);
    res.json({ ok: true, products });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};