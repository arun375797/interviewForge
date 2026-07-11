import manifest from '../data/typing/manifest.json';

export const TYPING_CATEGORIES = [
  { key: 'all', label: 'Mixed' },
  { key: 'english', label: 'English' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'express', label: 'Express' },
  { key: 'dsa', label: 'DSA' },
  { key: 'mongodb', label: 'MongoDB' },
];

export const TYPING_DURATIONS = [
  { key: 15, label: '15 sec' },
  { key: 30, label: '30 sec' },
  { key: 45, label: '45 sec' },
  { key: 60, label: '1 min' },
  { key: 90, label: '1.5 min' },
  { key: 120, label: '2 min' },
  { key: 180, label: '3 min' },
  { key: 300, label: '5 min' },
  { key: 600, label: '10 min' },
  { key: 'snippet', label: 'Full answer' },
];

const CATEGORY_LOADERS = {
  english: () => import('../data/typing/english.json'),
  javascript: () => import('../data/typing/javascript.json'),
  react: () => import('../data/typing/react.json'),
  nodejs: () => import('../data/typing/nodejs.json'),
  express: () => import('../data/typing/express.json'),
  dsa: () => import('../data/typing/dsa.json'),
  mongodb: () => import('../data/typing/mongodb.json'),
};

const snippetCache = new Map();

export const TYPING_SNIPPET_COUNTS = manifest;

export const TYPING_SNIPPET_TOTAL = Object.values(manifest).reduce((sum, count) => sum + count, 0);

export const TYPING_STORAGE_KEY = 'thinkmern_typing_stats_v1';

export async function loadTypingSnippets(category = 'all') {
  if (snippetCache.has(category)) return snippetCache.get(category);

  let snippets;
  if (category === 'all') {
    const categories = Object.keys(CATEGORY_LOADERS);
    const modules = await Promise.all(categories.map((key) => CATEGORY_LOADERS[key]()));
    snippets = modules.flatMap((mod) => mod.default || mod);
  } else {
    const loader = CATEGORY_LOADERS[category];
    if (!loader) return [];
    const mod = await loader();
    snippets = mod.default || mod;
  }

  snippetCache.set(category, snippets);
  return snippets;
}
