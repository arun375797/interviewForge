import english from '../data/typing/english.json';
import javascript from '../data/typing/javascript.json';
import react from '../data/typing/react.json';
import nodejs from '../data/typing/nodejs.json';
import express from '../data/typing/express.json';
import dsa from '../data/typing/dsa.json';
import mongodb from '../data/typing/mongodb.json';
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

export const TYPING_SNIPPETS = [
  ...english,
  ...javascript,
  ...react,
  ...nodejs,
  ...express,
  ...dsa,
  ...mongodb,
];

export const TYPING_SNIPPET_COUNTS = manifest;

export const TYPING_STORAGE_KEY = 'thinkmern_typing_stats_v1';
