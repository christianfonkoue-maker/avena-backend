/**
 * AVENA — User Controller
 * controllers/userController.js
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Event = require('../models/Event');
const { getFileUrl, deleteFile } = require('../middleware/upload');
const path = require('path');

/**
 * Get user profile
 */
async function getProfile(req, res) {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    // Remove sensitive data
    const { password_hash, ...safeUser } = user;
    
    // Get user stats
    const stats = await User.getStats(id);
    
    // Get recent products
    const products = await Product.findBySeller(id);
    const recentProducts = products.slice(0, 4);
    
    // Get recent services
    const services = await Service.findByProvider(id);
    const recentServices = services.slice(0, 4);
    
    // Get recent events
    const events = await Event.findByOrganizer(id);
    const recentEvents = events.slice(0, 4);
    
    res.json({
      ok: true,
      user: safeUser,
      stats,
      recentProducts,
      recentServices,
      recentEvents,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  const userId = req.user.id;
  const { bio, program, year } = req.body;
  
  try {
    const user = await User.updateProfile(userId, { bio, program, year });
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    res.json({ ok: true, user, message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Update avatar
 */
async function updateAvatar(req, res) {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No image file provided.' });
  }
  
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    
    // Mise à jour directe de la base
    const db = require('../config/db');
    const result = await db.query(
      `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING avatar_url`,
      [avatarUrl, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    
    console.log('✅ Avatar mis à jour en base :', result.rows[0].avatar_url);
    res.json({ ok: true, avatarUrl: result.rows[0].avatar_url });
  } catch (error) {
    console.error('❌ Update avatar error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * Get user dashboard data
 */
async function getDashboard(req, res) {
  const userId = req.user.id;
  
  try {
    const products = await Product.findBySeller(userId);
    const services = await Service.findByProvider(userId);
    const events = await Event.findByOrganizer(userId);
    const unreadCount = await require('../models/Message').getUnreadCount(userId);
    const stats = await User.getStats(userId);
    
    res.json({
      ok: true,
      stats,
      products,
      services,
      events,
      unreadCount,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
};