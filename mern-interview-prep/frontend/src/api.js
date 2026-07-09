const TOKEN_KEY = 'interviewforge_token';
const USER_KEY = 'interviewforge_user';

function resolveApiBase() {
  let base = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
  // If someone set https://xxx.vercel.app without /api, append it
  if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  if (!base) base = '/api';
  return base;
}

const API_BASE = resolveApiBase();
const GET_CACHE_TTL_MS = 30 * 1000;
const responseCache = new Map();
const pendingRequests = new Map();

function cacheKeyFor(url, token) {
  return `${token || 'anonymous'}:${url}`;
}

function clearApiCache() {
  responseCache.clear();
  pendingRequests.clear();
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearApiCache();
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredToken();
  const method = (options.method || 'GET').toUpperCase();
  const canUseCache = method === 'GET' && options.cache !== 'no-store';
  const cacheKey = canUseCache ? cacheKeyFor(url, token) : '';

  if (canUseCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;
    if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestPromise = (async () => {
    const res = await fetch(url, { ...options, method, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !path.includes('/auth/login')) {
      clearSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    if (method !== 'GET') clearApiCache();
    if (canUseCache) {
      responseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
      });
    }
    return data;
  })();

  if (canUseCache) {
    pendingRequests.set(cacheKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  return requestPromise;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),
  getSubjects: () => request('/questions/subjects'),
  getTopics: (subject) => request(`/questions/subjects/${subject}/topics`),
  getStats: () => request('/questions/stats'),
  getRandom: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/random${q ? `?${q}` : ''}`);
  },
  getRandomBatch: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/random/batch${q ? `?${q}` : ''}`);
  },
  getQuestions: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions?${q}`);
  },
  getQuestion: (id) => request(`/questions/${id}`),
  createQuestion: (body) =>
    request('/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (id, body) =>
    request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
  toggleBookmark: (id) => request(`/questions/${id}/bookmark`, { method: 'PATCH' }),
  toggleMastered: (id) => request(`/questions/${id}/mastered`, { method: 'PATCH' }),
  toggleLearned: (id) => request(`/questions/${id}/learned`, { method: 'PATCH' }),
  getLearnProgress: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/learn/progress${q ? `?${q}` : ''}`);
  },
  getCodeProgress: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/code/progress${q ? `?${q}` : ''}`);
  },
  getCodeTopics: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/code/topics${q ? `?${q}` : ''}`);
  },
  getCodeQuestions: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/questions/code${q ? `?${q}` : ''}`);
  },
  getCodeQuestion: (id) => request(`/questions/code/${id}`),
  toggleCodeCompleted: (id) => request(`/questions/code/${id}/completed`, { method: 'PATCH' }),
  saveCode: (id, code) =>
    request(`/questions/code/${id}/save`, { method: 'PUT', body: JSON.stringify({ code }) }),
  getSavedCode: (id) => request(`/questions/code/${id}/saved-code`),
  getActivePlans: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return request(`/plans/active${q ? `?${q}` : ''}`);
  },
  startPlan: (body) => request('/plans/start', { method: 'POST', body: JSON.stringify(body) }),
  disablePlan: (id) => request(`/plans/${id}/disable`, { method: 'PATCH' }),
};

export const SUBJECT_META = {
  javascript: {
    label: 'JavaScript',
    short: 'JS',
    accent: '#CA8A04',
    blurb: 'Language fundamentals, async, DOM & patterns',
  },
  react: {
    label: 'React',
    short: 'React',
    accent: '#0891B2',
    blurb: 'Components, hooks, Redux & performance',
  },
  nodejs: {
    label: 'Node.js',
    short: 'Node',
    accent: '#16A34A',
    blurb: 'Runtime, Express, APIs & scaling',
  },
  dsa: {
    label: 'DSA',
    short: 'DSA',
    accent: '#DB2777',
    blurb: 'Structures, algorithms & complexity',
  },
};
