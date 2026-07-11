export const ADMIN_SHARED_STORAGE_KEY = 'admin-shared';

export function userStorageKey(baseKey, userId, isAdmin = false) {
  if (isAdmin) return `${baseKey}:${ADMIN_SHARED_STORAGE_KEY}`;
  if (!userId) return baseKey;
  return `${baseKey}:${userId}`;
}
