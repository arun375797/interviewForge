const TOKEN_KEY = 'interviewforge_token';
const USER_KEY = 'interviewforge_user';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.includes('/auth/login')) {
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
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
    const q = new URLSearchParams(params).toString();
    return request(`/questions/random${q ? `?${q}` : ''}`);
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
