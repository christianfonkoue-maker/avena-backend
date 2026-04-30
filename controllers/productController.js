/**
 * AVENA — Product Controller
 * controllers/productController.js
 */

const db = require('../config/db');

// Create a product
async function createProduct(req, res) {
  const { title, description, category, subcategory, price, stock, condition } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `INSERT INTO products (title, description, category, subcategory, price, stock, condition, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, category, subcategory || null, price, stock || 1, condition || 'new', userId]
    );
    
    res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Get all products
async function getProducts(req, res) {
  try {
    const result = await db.query(
      `SELECT p.*, u.first_name, u.last_name 
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.status = 'active'
       ORDER BY p.created_at DESC`
    );
    
    const products = result.rows.map(p => ({
      ...p,
      seller: {
        id: p.seller_id,
        name: `${p.first_name} ${p.last_name}`
      },
      seller_id: undefined,
      first_name: undefined,
      last_name: undefined
    }));
    
    res.json({ ok: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Get single product
async function getProduct(req, res) {
  const { id } = req.params;
  
  try {
    const productResult = await db.query(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url as seller_avatar
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }
    
    // Récupérer les images
    const imagesResult = await db.query(
      `SELECT url FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );
    
    const product = productResult.rows[0];
    product.images = imagesResult.rows.map(row => row.url);
    product.coverImage = product.cover_image || (product.images[0] || null);
    
    product.seller = {
      id: product.seller_id,
      name: `${product.first_name} ${product.last_name}`,
      avatar: product.seller_avatar
    };
    
    delete product.seller_id;
    delete product.first_name;
    delete product.last_name;
    delete product.seller_avatar;
    delete product.cover_image;
    
    res.json({ ok: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Get my products
async function getMyProducts(req, res) {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT * FROM products WHERE seller_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ ok: true, products: result.rows });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Update product
async function updateProduct(req, res) {
  const { id } = req.params;
  const { title, description, price, stock } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE products SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock),
        updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, price, stock, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }
    
    res.json({ ok: true, product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Delete product
async function deleteProduct(req, res) {
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }
    
    res.json({ ok: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct
};