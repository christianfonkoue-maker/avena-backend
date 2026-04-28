/**
 * AVENA — Users Routes
 * routes/users.js
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/dashboard', authenticate, userController.getDashboard);
router.get('/:id', userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/avatar', authenticate, uploadSingle('avatar'), userController.updateAvatar);

module.exports = router;