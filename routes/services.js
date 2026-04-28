/**
 * AVENA — Services Routes
 * routes/services.js
 */

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, ownershipCheck } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { validateService, validateIdParam } = require('../middleware/validation');

router.post('/', 
  authenticate, 
  uploadSingle('image'),
  validateService, 
  serviceController.createService
);

router.get('/', serviceController.getServices);
router.get('/me', authenticate, serviceController.getMyServices);
router.get('/:id', validateIdParam, serviceController.getService);

router.put('/:id', 
  authenticate, 
  ownershipCheck('service'),
  validateIdParam,
  serviceController.updateService
);

router.delete('/:id', 
  authenticate, 
  ownershipCheck('service'),
  validateIdParam,
  serviceController.deleteService
);

module.exports = router;