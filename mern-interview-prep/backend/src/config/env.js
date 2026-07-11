require('dotenv').config();

const DEV_JWT_FALLBACK = 'dev-only-jwt-secret-not-for-production-use';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function validateEnv() {
  const errors = [];

  if (!process.env.MONGO_URI?.trim()) {
    errors.push('MONGO_URI must be set in backend/.env');
  }

  if (!process.env.ADMIN_EMAIL?.trim()) {
    errors.push('ADMIN_EMAIL must be set in backend/.env');
  }

  if (!process.env.ADMIN_PASSWORD?.trim()) {
    errors.push('ADMIN_PASSWORD must be set in backend/.env');
  }

  if (!process.env.ADMIN_EMAILS?.trim() && !process.env.ADMIN_EMAIL?.trim()) {
    errors.push('ADMIN_EMAILS (or ADMIN_EMAIL) must be set in backend/.env');
  }

  if (isProduction()) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push(
        'JWT_SECRET must be a random string of at least 32 characters in production'
      );
    }
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
      errors.push('ADMIN_PASSWORD must be at least 12 characters in production');
    }
    if (!process.env.CLIENT_URL?.trim()) {
      errors.push('CLIENT_URL must list allowed frontend origin(s) in production');
    }
  } else if (!process.env.JWT_SECRET) {
    console.warn(
      '[env] JWT_SECRET not set — using dev-only fallback. Set a strong JWT_SECRET in backend/.env before deploying.'
    );
  }

  if (errors.length) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function getJwtSecret() {
  return process.env.JWT_SECRET || DEV_JWT_FALLBACK;
}

function getJwtExpires() {
  return process.env.JWT_EXPIRES || '7d';
}

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    name: (process.env.ADMIN_NAME || 'Admin').trim(),
  };
}

module.exports = {
  validateEnv,
  getJwtSecret,
  getJwtExpires,
  getAdminCredentials,
  isProduction,
};
