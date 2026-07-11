require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { validateEnv, isProduction } = require('./config/env');
const questionRoutes = require('./routes/questions');
const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const notebookRoutes = require('./routes/notebooks');
const ideRoutes = require('./routes/ide');
const { ensureSeeded } = require('./utils/seed');
const { ensureUserProgressMigration } = require('./utils/migrateUserProgress');
const { ensureAdminUser, protect } = require('./controllers/authController');

validateEnv();

function parseOrigins() {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

const ideLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many IDE requests. Please slow down.' },
});

function createApp() {
  const app = express();
  const isProd = isProduction() || process.env.SERVE_FRONTEND === 'true';
  const onVercel = Boolean(process.env.VERCEL);
  const allowedOrigins = parseOrigins();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS first — preflight must succeed even if DB is down
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (isProduction() && !allowedOrigins.length) {
          console.warn(`CORS blocked origin in production: ${origin}`);
          return cb(null, false);
        }
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

  // Skip heavy boot for CORS preflight and health checks (keeps cold starts snappy)
  let bootPromise = null;
  function ensureBooted() {
    if (!bootPromise) {
      bootPromise = (async () => {
        await connectDB();
        // Fast path: ensure admin exists without bcrypt on every wake.
        // Set SYNC_ADMIN_PASSWORD=true only when rotating the admin password.
        await ensureAdminUser();
        const skipSeed =
          process.env.SKIP_AUTO_SEED === 'true' ||
          (onVercel && process.env.FORCE_SEED !== 'true');
        if (!skipSeed) {
          await ensureSeeded();
        }
        await ensureUserProgressMigration();
      })().catch((err) => {
        bootPromise = null;
        throw err;
      });
    }
    return bootPromise;
  }

  app.use(async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (req.path === '/api/health' || req.path === '/health') {
      // Wake DB in the background without delaying the health response
      ensureBooted().catch(() => {});
      return next();
    }
    try {
      await ensureBooted();
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
    });
  });

  // Canonical routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/google', authLimiter);
  app.use('/auth/login', authLimiter);
  app.use('/auth/google', authLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/questions', protect, questionRoutes);
  app.use('/api/plans', protect, planRoutes);
  app.use('/api/notebooks', protect, notebookRoutes);
  app.use('/api/ide', protect, ideLimiter, ideRoutes);
  // Aliases if VITE_API_URL was set without /api
  app.use('/auth', authRoutes);
  app.use('/questions', protect, questionRoutes);
  app.use('/plans', protect, planRoutes);
  app.use('/notebooks', protect, notebookRoutes);
  app.use('/ide', protect, ideLimiter, ideRoutes);
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
    const status = err.status || 500;
    const message =
      status >= 500 && isProduction()
        ? 'Internal server error'
        : err.message || 'Server error';
    res.status(status).json({ message });
  });
  return app;
}

module.exports = { createApp };
