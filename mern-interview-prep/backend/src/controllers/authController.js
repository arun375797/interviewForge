const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Plan = require('../models/Plan');
const UserProgress = require('../models/UserProgress');
const Notebook = require('../models/Notebook');
const NotebookPage = require('../models/NotebookPage');
const { isAdminEmail } = require('../utils/adminAccess');
const { getJwtSecret, getJwtExpires, getAdminCredentials } = require('../config/env');

const AUTH_CACHE_TTL_MS = 2 * 60 * 1000;
const authUserCache = new Map();

function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    isAdmin: isAdminEmail(user.email),
    isBlocked: Boolean(user.isBlocked),
  };
}

function toManagedUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    authProvider: user.authProvider || 'local',
    isAdmin: isAdminEmail(user.email),
    isBlocked: Boolean(user.isBlocked),
    lastLoginAt: user.lastLoginAt || null,
    loginCount: user.loginCount || 0,
    createdAt: user.createdAt,
  };
}

async function rejectIfBlocked(user, res) {
  if (isAdminEmail(user?.email)) return false;
  if (!user?.isBlocked) return false;
  res.status(403).json({ message: 'Your account has been blocked' });
  return true;
}

async function recordLogin(user) {
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save();
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    getJwtSecret(),
    { expiresIn: getJwtExpires() }
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
    if (await rejectIfBlocked(user, res)) return;
    if (user.isBlocked && isAdminEmail(user.email)) {
      user.isBlocked = false;
      await user.save();
    }

    await recordLogin(user);
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
    if (await rejectIfBlocked(user, res)) return;
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
      if (await rejectIfBlocked(user, res)) return;
      if (user.isBlocked && isAdminEmail(user.email)) {
        user.isBlocked = false;
      }
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

    await recordLogin(user);
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

    const decoded = jwt.verify(token, getJwtSecret());
    const cached = authUserCache.get(decoded.id);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    const user = await User.findById(decoded.id).select('_id email isBlocked').lean();
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (user.isBlocked && !isAdminEmail(user.email)) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      isAdmin: isAdminEmail(user.email),
    };
    authUserCache.set(String(user._id), {
      user: req.user,
      expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    });
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

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .lean();
    res.json(users.map(toManagedUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setUserBlocked = async (req, res) => {
  try {
    const blocked = req.body.blocked === true;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isAdminEmail(user.email)) {
      return res.status(403).json({ message: 'Admin accounts cannot be blocked' });
    }
    if (String(user._id) === String(req.user.id) && blocked) {
      return res.status(403).json({ message: 'You cannot block your own account' });
    }

    user.isBlocked = blocked;
    await user.save();
    authUserCache.delete(String(user._id));
    res.json(toManagedUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isAdminEmail(user.email)) {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }
    if (String(user._id) === String(req.user.id)) {
      return res.status(403).json({ message: 'You cannot delete your own account' });
    }

    const userId = user._id;
    const email = user.email;

    await Promise.all([
      UserProgress.deleteMany({ userId }),
      Plan.deleteMany({ userId }),
      NotebookPage.deleteMany({ userId }),
      Notebook.deleteMany({ userId }),
    ]);
    await user.deleteOne();

    res.json({ message: 'User and all related data deleted', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Create/update the single admin account from env (or defaults). */
let adminEnsurePromise = null;
exports.ensureAdminUser = async () => {
  // Deduplicate concurrent cold-start calls
  if (adminEnsurePromise) return adminEnsurePromise;

  adminEnsurePromise = (async () => {
    const { email, password, name } = getAdminCredentials();
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
