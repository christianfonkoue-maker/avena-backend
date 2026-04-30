/**
 * AVENA — Upload Middleware
 * middleware/upload.js
 * 
 * Handles file uploads with multer
 * Supports hybrid mode: local storage or cloud (Cloudinary ready)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure upload directories exist
const uploadDirs = ['uploads/avatars', 'uploads/products', 'uploads/services', 'uploads/events'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for local mode
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    // Détection basée sur le fieldname
    if (file.fieldname === 'avatar') {
      folder = 'uploads/avatars/';
    } 
    else if (file.fieldname === 'product') {
      folder = 'uploads/products/';
    }
    else if (file.fieldname === 'service') {
      folder = 'uploads/services/';
    }
    else if (file.fieldname === 'event') {
      folder = 'uploads/events/';
    }
    else if (file.fieldname === 'image') {
      // Fallback basé sur l'URL de la route
      if (req.baseUrl && req.baseUrl.includes('/services')) {
        folder = 'uploads/services/';
      } else if (req.baseUrl && req.baseUrl.includes('/products')) {
        folder = 'uploads/products/';
      } else if (req.baseUrl && req.baseUrl.includes('/events')) {
        folder = 'uploads/events/';
      } else {
        folder = 'uploads/';
      }
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Utiliser un nom générique sans le fieldname pour éviter les confusions
    cb(null, 'image-' + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload
const uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);

/**
 * Get URL for uploaded file based on mode
 * Supports local and cloud (Cloudinary ready)
 */
function getFileUrl(req, filename, folder) {
  if (process.env.UPLOAD_MODE === 'cloudinary') {
    // For Cloudinary, return the cloud URL (to be implemented)
    return null;
  }
  
  // Local mode
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${folder}/${filename}`;
}

/**
 * Delete file from filesystem
 */
function deleteFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
}

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile,
};