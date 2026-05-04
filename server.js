/**
 * AVENA — Backend Server
 * server.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
console.log('EMAIL_USER from env:', process.env.EMAIL_USER);

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');

// Import Socket.IO handlers
const setupSocketHandlers = require('./socket');

const app = express();
const server = http.createServer(app);

// ─── ORIGINES AUTORISÉES ──────────────────────────────────────────────────────
// Ajoute ici tous tes domaines Vercel (preview + production)
const ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  // Domaine Vercel production — remplace par ton vrai domaine
  'https://avena.vercel.app',
  // Pattern pour toutes les preview deployments Vercel de ton projet
  /^https:\/\/avena(-[a-z0-9]+)*\.vercel\.app$/,
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // requêtes sans origin (ex: Postman, mobile)
  return ALLOWED_ORIGINS.some(allowed =>
    allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
  );
}

// ─── SOCKET.IO CORS ───────────────────────────────────────────────────────────
const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn('Socket.IO CORS bloqué:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── EXPRESS CORS ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { ok: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Avena API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// Setup Socket.IO
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Avena backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time chat`);
});