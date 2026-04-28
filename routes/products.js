/**
 * AVENA — Products Routes
 * routes/products.js
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, ownershipCheck } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { validateProduct, validateIdParam } = require('../middleware/validation');

router.post('/', 
  authenticate, 
  uploadSingle('image'),
  validateProduct, 
  productController.createProduct
);

router.get('/', productController.getProducts);
router.get('/me', authenticate, productController.getMyProducts);
router.get('/:id', validateIdParam, productController.getProduct);

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