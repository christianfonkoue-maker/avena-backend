/**
 * AVENA - Admin Routes
 * routes/admin.js
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isAdmin, isSuperAdmin } = require('../middleware/roleCheck');

// Dashboard
router.get('/dashboard', authenticate, isAdmin, require('../controllers/adminController').getDashboard);

// Products management
router.get('/products', authenticate, isAdmin, require('../controllers/adminController').getProducts);
router.put('/products/bulk-status', authenticate, isAdmin, require('../controllers/adminController').bulkUpdateStatus);
router.delete('/products/bulk', authenticate, isAdmin, require('../controllers/adminController').bulkDeleteProducts);

// Orders management
router.get('/orders', authenticate, isAdmin, require('../controllers/adminController').getOrders);
router.put('/orders/:id/status', authenticate, isAdmin, require('../controllers/adminController').updateOrderStatus);

// Sellers management
router.get('/sellers', authenticate, isAdmin, require('../controllers/adminController').getSellers);
router.get('/sellers/:id', authenticate, isAdmin, require('../controllers/adminController').getSellerDetails);
// router.get('/sellers/:id/documents', authenticate, isAdmin, require('../controllers/adminController').getSellerDocuments);
router.put('/sellers/:id/commission', authenticate, isAdmin, require('../controllers/adminController').updateSellerCommission);
router.post('/sellers/:id/approve', authenticate, isAdmin, require('../controllers/adminController').approveSeller);
router.post('/sellers/:id/reject', authenticate, isAdmin, require('../controllers/adminController').rejectSeller);
router.get('/sellers/export', authenticate, isAdmin, require('../controllers/adminController').exportSellers);

// Customers management
router.get('/customers', authenticate, isAdmin, require('../controllers/adminController').getCustomers);
// router.get('/customers/:id', authenticate, isAdmin, require('../controllers/adminController').getCustomerDetails);
router.post('/customers/:id/block', authenticate, isAdmin, require('../controllers/adminController').blockCustomer);

// Categories management (COMMENTÉ - fonctions manquantes)
// router.post('/categories', authenticate, isAdmin, require('../controllers/adminController').createCategory);
// router.put('/categories/:id', authenticate, isAdmin, require('../controllers/adminController').updateCategory);
// router.delete('/categories/:id', authenticate, isAdmin, require('../controllers/adminController').deleteCategory);
// router.post('/categories/reorder', authenticate, isAdmin, require('../controllers/adminController').reorderCategories);

// Banners management
router.get('/banners', authenticate, isAdmin, require('../controllers/adminController').getBanners);
router.post('/banners', authenticate, isAdmin, require('../controllers/adminController').createBanner);
router.put('/banners/:id', authenticate, isAdmin, require('../controllers/adminController').updateBanner);
router.delete('/banners/:id', authenticate, isAdmin, require('../controllers/adminController').deleteBanner);

// Pages statiques (COMMENTÉ - fonctions manquantes)
// router.get('/pages', authenticate, isAdmin, require('../controllers/adminController').getStaticPages);
// router.post('/pages', authenticate, isAdmin, require('../controllers/adminController').createStaticPage);
// router.put('/pages/:id', authenticate, isAdmin, require('../controllers/adminController').updateStaticPage);
// router.delete('/pages/:id', authenticate, isAdmin, require('../controllers/adminController').deleteStaticPage);

// Analytics
router.get('/analytics', authenticate, isAdmin, require('../controllers/adminController').getAnalytics);
// router.get('/analytics/export', authenticate, isAdmin, require('../controllers/adminController').exportAnalytics);
// router.get('/analytics/top-products', authenticate, isAdmin, require('../controllers/adminController').getTopProducts);

// Settings
router.get('/settings', authenticate, isAdmin, require('../controllers/adminController').getSettings);
router.put('/settings', authenticate, isAdmin, require('../controllers/adminController').updateSettings);
// router.get('/settings/payment-methods', authenticate, isAdmin, require('../controllers/adminController').getPaymentMethods);
// router.put('/settings/payment-methods/:code', authenticate, isAdmin, require('../controllers/adminController').updatePaymentMethod);
// router.get('/settings/shipping-zones', authenticate, isAdmin, require('../controllers/adminController').getShippingZones);
// router.post('/settings/shipping-zones', authenticate, isAdmin, require('../controllers/adminController').createShippingZone);
// router.put('/settings/shipping-zones/:id', authenticate, isAdmin, require('../controllers/adminController').updateShippingZone);
// router.delete('/settings/shipping-zones/:id', authenticate, isAdmin, require('../controllers/adminController').deleteShippingZone);

// Stock management (COMMENTÉ - fonctions manquantes)
// router.get('/stock', authenticate, isAdmin, require('../controllers/adminController').getStockOverview);
// router.post('/stock/:id/adjust', authenticate, isAdmin, require('../controllers/adminController').adjustStock);
// router.get('/stock/alerts', authenticate, isAdmin, require('../controllers/adminController').getStockAlerts);
// router.get('/stock/history', authenticate, isAdmin, require('../controllers/adminController').getStockHistory);

// Moderation (COMMENTÉ - fonctions manquantes)
// router.get('/moderation/products', authenticate, isAdmin, require('../controllers/adminController').getPendingProducts);
// router.post('/moderation/products/:id/approve', authenticate, isAdmin, require('../controllers/adminController').approveProduct);
// router.post('/moderation/products/:id/reject', authenticate, isAdmin, require('../controllers/adminController').rejectProduct);
// router.get('/moderation/reports', authenticate, isAdmin, require('../controllers/adminController').getReports);
// router.post('/moderation/reports/:id/resolve', authenticate, isAdmin, require('../controllers/adminController').resolveReport);
// router.get('/moderation/reviews', authenticate, isAdmin, require('../controllers/adminController').getReviews);
// router.post('/moderation/reviews/:id/hide', authenticate, isAdmin, require('../controllers/adminController').hideReview);

// Notifications
router.get('/notifications', authenticate, isAdmin, require('../controllers/adminController').getNotifications);
router.post('/notifications/:id/read', authenticate, isAdmin, require('../controllers/adminController').markNotificationRead);
router.post('/notifications/mark-all-read', authenticate, isAdmin, require('../controllers/adminController').markAllNotificationsRead);

module.exports = router;