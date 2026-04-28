/**
 * AVENA — Events Routes
 * routes/events.js
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, ownershipCheck } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { validateEvent, validateIdParam } = require('../middleware/validation');

router.post('/', 
  authenticate, 
  uploadSingle('image'),
  validateEvent, 
  eventController.createEvent
);

router.get('/', eventController.getEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/me', authenticate, eventController.getMyEvents);
router.get('/me/registered', authenticate, eventController.getMyRegisteredEvents);
router.get('/:id', validateIdParam, eventController.getEvent);

router.put('/:id', 
  authenticate, 
  ownershipCheck('event'),
  validateIdParam,
  eventController.updateEvent
);

router.delete('/:id', 
  authenticate, 
  ownershipCheck('event'),
  validateIdParam,
  eventController.deleteEvent
);

router.post('/:id/register', 
  authenticate, 
  validateIdParam,
  eventController.registerForEvent
);

module.exports = router;