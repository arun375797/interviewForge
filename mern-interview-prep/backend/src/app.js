require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const questionRoutes = require('./routes/questions');
const authRoutes = require('./routes/auth');
const { ensureSeeded } = require('./utils/seed');
const { ensureAdminUser, protect } = require('./controllers/authController');

function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true';
  const onVercel = Boolean(process.env.VERCEL);

  const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (!allowedOrigins.length) return cb(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Ensure DB + admin on each serverless cold start / request path
  let bootPromise = null;
  app.use(async (req, res, next) => {
    try {
      if (!bootPromise) {
        bootPromise = (async () => {
          await connectDB();
          await ensureAdminUser();
          // Full question seed is too heavy for Vercel serverless timeouts.
          // Run `npm run seed` locally against Atlas once, or set FORCE_SEED=true on a long-timeout host.
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

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'mern-interview-prep',
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      vercel: onVercel,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/questions', protect, questionRoutes);

  // Serve React build only when explicitly enabled (Render single-service mode)
  // Never do this on Vercel API project — frontend is a separate project.
  if (isProd && !onVercel && process.env.SERVE_FRONTEND === 'true') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(
      express.static(frontendDist, {
        index: false,
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );

    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
      }
      res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  });

  return app;
}

module.exports = { createApp };
