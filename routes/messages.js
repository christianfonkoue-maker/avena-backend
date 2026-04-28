/**
 * AVENA — Messages Routes
 * routes/messages.js
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');

router.post('/', authenticate, validateMessage, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/unread-count', authenticate, messageController.getUnreadCount);
router.get('/conversation/:userId', authenticate, messageController.getConversation);
router.put('/conversation/:userId/read', authenticate, messageController.markConversationAsRead);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;