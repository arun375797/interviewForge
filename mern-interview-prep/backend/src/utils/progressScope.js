const mongoose = require('mongoose');

/** Stable owner id for shared admin progress, plans, and notebooks (not a real User). */
const ADMIN_SHARED_OWNER_ID = new mongoose.Types.ObjectId('647000000000000001000001');

function getProgressOwnerId(req) {
  if (req.user?.isAdmin) return ADMIN_SHARED_OWNER_ID;
  return req.user.id;
}

function isAdminSharedScope(req) {
  return Boolean(req.user?.isAdmin);
}

module.exports = {
  ADMIN_SHARED_OWNER_ID,
  getProgressOwnerId,
  isAdminSharedScope,
};
