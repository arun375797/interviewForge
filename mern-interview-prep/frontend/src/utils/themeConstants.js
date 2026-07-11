export const THEME_STORAGE_KEY = 'thinkmern-theme';

export const THEMES = [
  {
    id: 'paper',
    label: 'Paper',
    description: 'Warm cream — the original look',
    preview: ['#f3efe6', '#0f766e', '#c2410c'],
  },
  {
    id: 'night',
    label: 'Night',
    description: 'Pure black — easy on the eyes at night',
    preview: ['#000000', '#58a6ff', '#3fb950'],
  },
  {
    id: 'jellyfish',
    label: 'Jellyfish',
    description: 'Colorful coder vibes — purple, pink & cyan',
    preview: ['#1a1035', '#ff6bcb', '#00e5ff'],
  },
];

export const DEFAULT_THEME = 'paper';

export function isValidTheme(id) {
  return THEMES.some((t) => t.id === id);
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
}
