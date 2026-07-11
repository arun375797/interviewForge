function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

let cachedAdminEmails = null;

function getAdminEmails() {
  if (!cachedAdminEmails) {
    const emails = parseAdminEmails();
    if (!emails.length) {
      throw new Error('ADMIN_EMAIL or ADMIN_EMAILS must be set in backend/.env');
    }
    cachedAdminEmails = new Set(emails);
  }
  return cachedAdminEmails;
}

function isAdminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return getAdminEmails().has(normalized);
}

module.exports = { getAdminEmails, isAdminEmail };
