/**
 * AVENA — Event Controller
 * controllers/eventController.js
 */

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendEventConfirmationEmail } = require('../utils/email');
const { getFileUrl } = require('../middleware/upload');

/**
 * Create a new event
 */
async function createEvent(req, res) {
  const userId = req.user.id;
  const { title, description, category, date, time, endTime, location, isPaid, price, capacity, tags } = req.body;
  
  try {
    let coverImage = null;
    if (req.file) {
      coverImage = getFileUrl(req, req.file.filename, 'uploads/events');
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    }
    
    const event = await Event.create({
      title,
      description,
      category,
      organizerId: userId,
      date,
      time: time || null,
      endTime: endTime || null,
      location,
      isPaid: isPaid === 'true' || isPaid === true,
      price: price ? parseFloat(price) : 0,
      capacity: capacity ? parseInt(capacity) : null,
      coverImage,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
    });
    
    res.status(201).json({ ok: true, event, message: 'Event created successfully!' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get all events with filters
 */
async function getEvents(req, res) {
  const { category, organizerId, status, fromDate, toDate, search, limit, offset } = req.query;
  
  try {
    const events = await Event.findAll({
      category,
      organizerId,
      status,
      fromDate,
      toDate,
      search,
      limit: limit ? parseInt(limit) : 24,
      offset: offset ? parseInt(offset) : 0,
    });
    
    res.json({ ok: true, events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get upcoming events
 */
async function getUpcomingEvents(req, res) {
  const { limit } = req.query;
  
  try {
    const events = await Event.getUpcoming(limit ? parseInt(limit) : 12);
    res.json({ ok: true, events });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get single event
 */
async function getEvent(req, res) {
  const { id } = req.params;
  
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ ok: false, error: 'Event not found.' });
    }
    
    res.json({ ok: true, event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Update event
 */
async function updateEvent(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const event = await Event.update(id, updates);
    if (!event) {
      return res.status(404).json({ ok: false, error: 'Event not found.' });
    }
    
    res.json({ ok: true, event, message: 'Event updated successfully!' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Delete event
 */
async function deleteEvent(req, res) {
  const { id } = req.params;
  
  try {
    const event = await Event.delete(id);
    if (!event) {
      return res.status(404).json({ ok: false, error: 'Event not found.' });
    }
    
    res.json({ ok: true, message: 'Event cancelled successfully!' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Register for an event
 */
async function registerForEvent(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ ok: false, error: 'Event not found.' });
    }
    
    const result = await Registration.register(id, userId);
    
    if (result.alreadyRegistered) {
      return res.status(400).json({ ok: false, error: 'You are already registered for this event.' });
    }
    
    if (result.isFull) {
      return res.status(400).json({ ok: false, error: 'This event is fully booked.' });
    }
    
    // Send confirmation email for free events
    if (!event.is_paid) {
      await sendEventConfirmationEmail(
        req.user.email,
        req.user.first_name,
        event.title,
        event.date,
        event.location
      );
    }
    
    res.json({ 
      ok: true, 
      isPaid: event.is_paid,
      message: event.is_paid 
        ? 'This is a paid event. The organizer will contact you for payment.'
        : 'Registration confirmed! A confirmation email has been sent.',
      event: event.is_paid ? { organizerId: event.organizer.id } : null,
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get events by current user
 */
async function getMyEvents(req, res) {
  const userId = req.user.id;
  
  try {
    const events = await Event.findByOrganizer(userId);
    res.json({ ok: true, events });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

/**
 * Get user's registered events
 */
async function getMyRegisteredEvents(req, res) {
  const userId = req.user.id;
  
  try {
    const registrations = await Registration.getUserRegistrations(userId);
    res.json({ ok: true, registrations });
  } catch (error) {
    console.error('Get registered events error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
}

module.exports = {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
  getMyRegisteredEvents,
};