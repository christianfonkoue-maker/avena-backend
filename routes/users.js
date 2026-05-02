/**
 * AVENA — Users Routes
 * routes/users.js
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const db = require('../config/db');

router.get('/dashboard', authenticate, userController.getDashboard);

// ⚠️ PLACER /search AVANT /:id
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ users: [] });
  }

  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, avatar_url 
       FROM users 
       WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/avatar', authenticate, uploadSingle('avatar'), userController.updateAvatar);

module.exports = router;