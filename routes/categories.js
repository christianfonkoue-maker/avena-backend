/**
 * AVENA — Categories Routes (Mega Menu)
 * routes/categories.js
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:key', categoryController.getCategoryByKey);

module.exports = router;