const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { isAdminEmail } = require('../utils/adminAccess');

const JWT_SECRET = () => process.env.JWT_SECRET || 'interviewforge-dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    isAdmin: isAdminEmail(user.email),
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
}

let googleClient = null;
function getGoogleClient() {
  if (!googleClient) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return null;
    googleClient = new OAuth2Client(clientId);
  }
  return googleClient;
}

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const credential = String(req.body.credential || '').trim();
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const client = getGoogleClient();
    if (!client) {
      return res.status(503).json({ message: 'Google sign-in is not configured' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = String(payload?.email || '')
      .trim()
      .toLowerCase();
    const name = String(payload?.name || payload?.given_name || 'User').trim();
    const avatar = payload?.picture || null;

    if (!googleId || !email) {
      return res.status(401).json({ message: 'Invalid Google account' });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ message: 'Google email is not verified' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.password ? 'local' : 'google';
      }
      if (name && user.name !== name) user.name = name;
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      user = await User.create({
        email,
        googleId,
        name,
        avatar,
        authProvider: 'google',
      });
    }

    const token = signToken(user);
    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error('Google login failed:', err.message);
    res.status(401).json({ message: 'Google sign-in failed' });
  }
};

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET());
    // Prefer claims from a valid JWT — skip an extra User.findById on every request.
    // /auth/me still loads the live user document when needed.
    if (decoded.id && decoded.email) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        isAdmin: isAdminEmail(decoded.email),
      };
      return next();
    }

    const user = await User.findById(decoded.id).select('_id email').lean();
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      isAdmin: isAdminEmail(user.email),
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};

/** Create/update the single admin account from env (or defaults). */
let adminEnsurePromise = null;
exports.ensureAdminUser = async () => {
  // Deduplicate concurrent cold-start calls
  if (adminEnsurePromise) return adminEnsurePromise;

  adminEnsurePromise = (async () => {
    const email = (process.env.ADMIN_EMAIL || 'arun375797').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Job@2026';
    const name = process.env.ADMIN_NAME || 'Arun';
    const syncPassword = process.env.SYNC_ADMIN_PASSWORD === 'true';

    let user = await User.findOne({ email }).select(syncPassword ? '+password' : 'email name');
    if (!user) {
      user = await User.create({ email, password, name });
      console.log(`Admin user created: ${email}`);
      return user;
    }

    // Only bcrypt-compare when SYNC_ADMIN_PASSWORD=true (avoids ~100–300ms on every cold start)
    if (syncPassword) {
      const matches = await user.comparePassword(password);
      if (!matches) {
        user.password = password;
        user.name = name;
        await user.save();
        console.log(`Admin password updated for: ${email}`);
        return user;
      }
    }

    if (user.name !== name) {
      user.name = name;
      await user.save();
    } else {
      console.log(`Admin user ready: ${email}`);
    }
    return user;
  })().catch((err) => {
    adminEnsurePromise = null;
    throw err;
  });

  return adminEnsurePromise;
};
