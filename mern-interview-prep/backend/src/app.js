require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const questionRoutes = require('./routes/questions');
const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const { ensureSeeded } = require('./utils/seed');
const { ensureAdminUser, protect } = require('./controllers/authController');

function parseOrigins() {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true';
  const onVercel = Boolean(process.env.VERCEL);
  const allowedOrigins = parseOrigins();

  // CORS first — preflight must succeed even if DB is down
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (!allowedOrigins.length) return cb(null, true);
        if (allowedOrigins.includes('*')) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        // Allow Vercel preview URLs if any CLIENT_URL is a vercel.app host
        if (
          origin.endsWith('.vercel.app') &&
          allowedOrigins.some((o) => o.includes('vercel.app'))
        ) {
          return cb(null, true);
        }
        console.warn(`CORS blocked origin: ${origin}; allowed: ${allowedOrigins.join(', ')}`);
        return cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.options('*', cors());

  app.use(express.json({ limit: '2mb' }));
  if (!onVercel) {
    app.use(morgan(isProd ? 'combined' : 'dev'));
  }

  // Skip heavy boot for CORS preflight
  let bootPromise = null;
  app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    try {
      if (!bootPromise) {
        bootPromise = (async () => {
          await connectDB();
          await ensureAdminUser();
          const skipSeed =
            process.env.SKIP_AUTO_SEED === 'true' ||
            (onVercel && process.env.FORCE_SEED !== 'true');
          if (!skipSeed) {
            await ensureSeeded();
          }
        })().catch((err) => {
          bootPromise = null;
          throw err;
        });
      }
      await bootPromise;
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'mern-interview-prep',
      message: 'API is running. Use /api/health, /api/auth/login, /api/questions',
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'mern-interview-prep',
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      vercel: onVercel,
    });
  });

  // Canonical routes
  app.use('/api/auth', authRoutes);
  app.use('/api/questions', protect, questionRoutes);
  app.use('/api/plans', protect, planRoutes);

  // Aliases if VITE_API_URL was set without /api
  app.use('/auth', authRoutes);
  app.use('/questions', protect, questionRoutes);
  app.use('/plans', protect, planRoutes);

  if (isProd && !onVercel && process.env.SERVE_FRONTEND === 'true') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(
      express.static(frontendDist, {
        index: false,
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
        },
      })
    );

    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/questions')) {
        return res.status(404).json({ message: 'API route not found' });
      }
      res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      message: 'API route not found',
      path: req.path,
      hint: 'Use /api/auth/login or /api/questions',
    });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  });

  return app;
}

module.exports = { createApp };
