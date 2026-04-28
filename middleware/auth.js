/**
 * AVENA — Authentication Middleware
 * middleware/auth.js
 * 
 * Verifies JWT token and attaches user to request object
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      ok: false, 
      error: 'No token provided. Please log in.' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token exists in sessions table (optional, for blacklist)
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (sessionResult.rows.length === 0 && process.env.NODE_ENV !== 'development') {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid or expired session.' 
      });
    }
    
    // Get user from database
    const userResult = await db.query(
      `SELECT id, first_name, last_name, email, student_id, university_id, 
              program, year, avatar_url, bio, role, email_verified 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        ok: false, 
        error: 'User not found.' 
      });
    }
    
    req.user = userResult.rows[0];
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        ok: false, 
        error: 'Token expired. Please log in again.' 
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error.' 
    });
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await db.query(
      `SELECT id, first_name, last_name, email, role FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }
  } catch (error) {
    // Ignore token errors in optional auth
  }
  
  next();
}

/**
 * Role-based authorization middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Authentication required.' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'You do not have permission to perform this action.' 
      });
    }
    
    next();
  };
}

/**
 * Check if user owns a resource (product, service, event, etc.)
 */
function ownershipCheck(resourceType) {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user.id;
    
    let query;
    switch (resourceType) {
      case 'product':
        query = 'SELECT seller_id FROM products WHERE id = $1';
        break;
      case 'service':
        query = 'SELECT provider_id FROM services WHERE id = $1';
        break;
      case 'event':
        query = 'SELECT organizer_id FROM events WHERE id = $1';
        break;
      default:
        return next();
    }
    
    try {
      const result = await db.query(query, [resourceId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          error: 'Resource not found.' 
        });
      }
      
      const ownerId = result.rows[0][`${resourceType === 'product' ? 'seller_id' : resourceType === 'service' ? 'provider_id' : 'organizer_id'}`];
      
      if (ownerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          ok: false, 
          error: 'You can only modify your own resources.' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ ok: false, error: 'Internal server error.' });
    }
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  ownershipCheck,
};