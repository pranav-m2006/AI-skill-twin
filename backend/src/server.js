'use strict';
require('./config/env'); // Validates required env vars on startup

const express = require('express');
const cors = require('cors');
const path = require('path');
const { port, nodeEnv, uploadDir } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const roadmapRoutes = require('./routes/roadmap');
const userRoutes = require('./routes/user');
const apiRoutes = require('./routes/api');

const app = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
const allowedOrigins = [
  'https://ai-skill-twin.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: nodeEnv, time: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/user', userRoutes);
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Central error handler — must be last
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
app.listen(port, () => {
  console.log(`[PlaceMate AI] Server running on http://localhost:${port} (${nodeEnv})`);

  // ─── Hourly notification cron ────────────────────────────────────────────
  // Runs in the background; does NOT block startup or affect existing routes.
  const { runHourlyNotifications } = require('./services/notificationService');
  const HOUR_MS = 60 * 60 * 1000;

  // Fire once after 5s on startup (so dev users see notifs immediately),
  // then every hour thereafter.
  setTimeout(async () => {
    await runHourlyNotifications();
    setInterval(runHourlyNotifications, HOUR_MS);
  }, 5000);
});

module.exports = app;
