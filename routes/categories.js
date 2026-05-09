/**
 * AVENA — Categories Routes (Mega Menu)
 * routes/categories.js
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:categoryKey/details', categoryController.getCategoryDetails);           // NOUVEAU
router.get('/:categoryKey/filters/schema', categoryController.getFilterSchema);       // NOUVEAU
router.get('/:categoryKey/filters/options/:filterKey', categoryController.getFilterOptions); // NOUVEAU
router.get('/:key', categoryController.getCategoryByKey);

module.exports = router;