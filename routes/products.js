/**
 * AVENA — Products Routes
 * routes/products.js
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, ownershipCheck } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const { validateProduct, validateIdParam } = require('../middleware/validation');

router.post('/', 
  authenticate, 
  uploadMultiple('images', 5),
  validateProduct, 
  productController.createProduct
);

router.get('/', productController.getProducts);
router.get('/me', authenticate, productController.getMyProducts);
router.get('/paginated', productController.getProductsPaginated);   // ← AVANT :id
router.get('/:id', validateIdParam, productController.getProduct);    // ← APRÈS

router.put('/:id', 
  authenticate, 
  ownershipCheck('product'),
  validateIdParam,
  productController.updateProduct
);

router.delete('/:id', 
  authenticate, 
  ownershipCheck('product'),
  validateIdParam,
  productController.deleteProduct
);

module.exports = router;