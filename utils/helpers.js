/**
 * AVENA — Helper Functions
 * utils/helpers.js
 */

/**
 * Format date to readable string
 */
function formatDate(dateStr, format = 'long') {
  const date = new Date(dateStr);
  if (format === 'long') {
    return date.toLocaleDateString('en-GH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  if (format === 'short') {
    return date.toLocaleDateString('en-GH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  return date.toLocaleDateString();
}

/**
 * Generate random 6-digit code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate random token
 */
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Check if email domain is a registered university
 */
function extractEmailDomain(email) {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Sanitize user object (remove sensitive data)
 */
function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Pagination helper
 */
function paginate(items, page = 1, limit = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    total: items.length,
    page: page,
    limit: limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  formatDate,
  generateCode,
  generateToken,
  extractEmailDomain,
  sanitizeUser,
  calculateAverageRating,
  paginate,
  escapeHtml,
};