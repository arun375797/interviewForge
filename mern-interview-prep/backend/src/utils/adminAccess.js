const DEFAULT_ADMIN_EMAILS = ['arun37579@gmail.com', 'arun375797@gmail.com', 'arun375797'];

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ADMIN_EMAILS;
}

let cachedAdminEmails = null;

function getAdminEmails() {
  if (!cachedAdminEmails) {
    cachedAdminEmails = new Set(parseAdminEmails());
  }
  return cachedAdminEmails;
}

function isAdminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return getAdminEmails().has(normalized);
}

module.exports = { getAdminEmails, isAdminEmail };
