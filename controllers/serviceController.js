/**
 * AVENA — Service Controller
 * controllers/serviceController.js
 */

const Service = require('../models/Service');
const { getFileUrl } = require('../middleware/upload');
const db = require('../config/db');

/**
 * Create a new service
 */
async function createService(req, res) {
  const userId = req.user.id;
  const { title, description, category, subcategory, price, priceType, deliveryDays } = req.body;
  
  try {
    let coverImage = null;
    let imageUrl = null;
    
    if (req.file) {
      // Construire l'URL complète de l'image
      const baseUrl = `http://localhost:5000`;
      imageUrl = `${baseUrl}/uploads/services/${req.file.filename}`;
      coverImage = imageUrl;
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    } else {
      // Image par défaut
      coverImage = `https://placehold.co/600x400/4361ee/ffffff?text=${encodeURIComponent(title)}`;
    }
    
    // Créer le service
    const result = await db.query(
      `INSERT INTO services (title, description, category, subcategory, provider_id, price, price_type, delivery_days, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, category, subcategory || null, userId, price, priceType || 'fixed', deliveryDays || null, coverImage]
    );
    
    const service = result.rows[0];
    
    // Sauvegarder l'image dans service_images si présente
    if (imageUrl) {
      await db.query(
        `INSERT INTO service_images (service_id, url, sort_order) VALUES ($1, $2, $3)`,
        [service.id, imageUrl, 0]
      );
    }
    
    res.status(201).json({ ok: true, service, message: 'Service created successfully!' });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get all services
 */
async function getServices(req, res) {
  const { category, search, limit, offset } = req.query;
  
  try {
    const services = await Service.findAll({
      category,
      search,
      limit: limit ? parseInt(limit) : 24,
      offset: offset ? parseInt(offset) : 0,
    });
    
    res.json({ ok: true, services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get single service
 */
async function getService(req, res) {
  const { id } = req.params;
  
  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ ok: false, error: 'Service not found.' });
    }
    
    res.json({ ok: true, service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

/**
 * Update service
 */
async function updateService(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const service = await Service.update(id, updates);
    if (!service) {
      return res.status(404).json({ ok: false, error: 'Service not found.' });
    }
    
    res.json({ ok: true, service, message: 'Service updated successfully!' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Delete service
 */
async function deleteService(req, res) {
  const { id } = req.params;
  
  try {
    const service = await Service.delete(id);
    if (!service) {
      return res.status(404).json({ ok: false, error: 'Service not found.' });
    }
    
    res.json({ ok: true, message: 'Service deleted successfully!' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get services by current user
 */
async function getMyServices(req, res) {
  const userId = req.user.id;
  
  try {
    const services = await Service.findByProvider(userId);
    res.json({ ok: true, services });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getMyServices,
};