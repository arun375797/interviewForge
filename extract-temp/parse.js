const fs = require('fs');
const path = require('path');

const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/i;

function clean(s) {
  return String(s || '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normKey(s) {
  return clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenOverlap(a, b) {
  const ta = new Set(normKey(a).split(' ').filter((w) => w.length > 2));
  const tb = new Set(normKey(b).split(' ').filter((w) => w.length > 2));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.min(ta.size, tb.size);
}

function isNoise(q) {
  if (!q || q.length < 2) return true;
  if (PAGE_MARKER.test(q)) return true;
  if (/^(summary|topic counts|topic index|topic sections|source:|how this was|cleanup rule|method:)/i.test(q)) return true;
  if (/^(total |raw lines|unique arranged|exact duplicate|cleaned )/i.test(q)) return true;
  if (/^\d+\s+items?$/i.test(q)) return true;
  return false;
}

function shouldSkipTopic(name) {
  return [
    /feedback/i,
    /notes?\s*&\s*study/i,
    /study\s*notes/i,
    /uncategorized/i,
    /needs?\s*manual\s*review/i,
    /miscellaneous\s*non/i,
    /project\s*bugs/i,
    /review\s*notes/i,
    /general\s*terms/i,
    /small\s*fragments/i,
    /scores?,?\s*notes/i,
  ].some((re) => re.test(name));
}

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const q of arr) {
    const k = normKey(q);
    if (k.length < 2 || seen.has(k)) continue;
    seen.add(k);
    out.push(q);
  }
  return out;
}

const JS_TOPICS = [
  '01. Basic JavaScript & Language Fundamentals',
  '02. Variables, Scope, Hoisting & TDZ',
  '03. Data Types, Type Conversion & Operators',
  '04. Control Flow, Loops & Conditions',
  '05. Arrays, Set, Map & Collection Problems',
  '06. Strings, Numbers, Math & Regex',
  '07. Objects, JSON, Destructuring, Copying & Immutability',
  '08. Functions, This, Closure, Currying & HOF',
  '09. Classes, OOP, Constructor, Prototype & Inheritance',
  '10. Promises, Async/Await, Fetch & Callbacks',
  '11. Event Loop, Timers, Runtime & Memory',
  '12. DOM, BOM, Browser APIs & Events',
  '13. Modules, ECMAScript & Modern JS Features',
  '14. Error Handling',
  '15. Code Output / Syntax & Small Snippets',
  '16. Practical Coding / Algorithm Questions',
  '17. Node.js, Express & Backend',
  '18. MongoDB & Database',
  '19. React, Redux, Frontend & CSS',
  '20. DSA / Computer Science Fundamentals',
  '21. Feedback, Notes & Study Improvements',
  '22. Project / Miscellaneous Non-JS Tasks',
].map((s) => {
  const m = s.match(/^(\d{2})\.\s+(.+)$/);
  return { num: m[1], name: m[2] };
});

const REACT_TOPICS = [
  '01. React Basics, Features, SPA & Setup',
  '02. JSX, Transpilation, Bundling, Vite, Babel & Modules',
  '03. DOM, Virtual DOM, Reconciliation, Diffing, Fiber & Rendering',
  '04. Components: Functional/Class, Props/State, Stateless/Stateful & Pure Components',
  '05. State, Props, Immutability, Batching & setState',
  '06. Hooks Rules & Core Hooks: useState, useEffect & useRef',
  '07. Advanced Hooks: useMemo, useCallback, useReducer, useContext, useLayoutEffect, useId & Custom Hooks',
  '08. useEffect Lifecycle, Cleanup, Timers & Side Effects',
  '09. Forms, Controlled/Uncontrolled Components, Refs, forwardRef & Inputs',
  '10. Component Communication: Props Drilling, Lifting State, Parent-Child & Sibling Communication',
  '11. Conditional/Dynamic/List Rendering, Keys, Fragments & createElement',
  '12. Events, Synthetic Events, Event Pooling & Event Handling',
  '13. Routing: React Router, Outlet, Params, Navigation & Protected Routes',
  '14. Context API & Global State Management',
  '15. Redux, Redux Toolkit, Thunk, Saga, Middleware, Store & Persistence',
  '16. Performance Optimization: Memoization, Lazy Loading, Suspense, Code Splitting & Profiler',
  '17. Error Boundaries, Portals, HOC, Render Props, Composition & Patterns',
  '18. CSR, SSR, SSG, Hydration, SEO & Rendering Strategies',
  '19. Authentication, Authorization, JWT, Tokens & Browser Storage Security',
  '20. API, Axios, Fetch, Interceptors & Project Networking',
  '21. React Practical Tasks, Todo Apps, Counters, Forms & Mini Projects',
  '22. Project Bugs, Validation, UI Improvements, Review Notes & Feedback',
  '23. React 19, Latest Features, Advanced APIs & Misc React Topics',
  '24. JavaScript / Backend / Non-React Overlap Found in Files',
].map((s) => {
  const m = s.match(/^(\d{2})\.\s+(.+)$/);
  return { num: m[1], name: m[2] };
});

const NODE_TOPICS = [
  '01. Node.js Basics, Runtime & Architecture',
  '02. Modules, NPM, Packages & Environment Variables',
  '03. Core Modules: FS, Path, OS, URL, Crypto, Util, Zlib & Timers',
  '04. HTTP, HTTPS, TCP/IP, URL & Networking',
  '05. REST APIs, API Design & Web Concepts',
  '06. Express.js Basics, App Methods & Routing',
  '07. Middleware, Validation & Request Handling',
  '08. Request/Response, Params, Headers, Status Codes & Content Negotiation',
  '09. CORS, Same-Origin Policy, Preflight & Browser Security',
  '10. Authentication, Authorization, JWT, Sessions & Cookies',
  '11. Event Loop, Async Flow, Timers, Libuv & Concurrency',
  '12. Worker Threads, Cluster, Child Process & Scaling',
  '13. Streams, Buffers, Pipe & File Processing',
  '14. Events, EventEmitter, Event-Driven Architecture & Reactor Pattern',
  '15. View Engines, EJS, SSR & Template Rendering',
  '16. Security, Encryption, Hashing, CSRF, XSS, SSL & TLS',
  '17. Performance, Deployment, Rate Limiting & Infrastructure',
  '18. WebSockets, Socket, Webhooks & Real-Time Communication',
  '19. Database, ODM, MongoDB & Query Topics',
  '20. Practical Node.js / Express Coding Tasks',
  '21. JavaScript Overlap / General JS Concepts Found in File',
  '22. React / Frontend / Browser Storage / Other Web Topics',
  '23. Feedback, Scores, Notes & Study Improvements',
  '24. Error Handling, Debugging & Exception Handling',
].map((s) => {
  const m = s.match(/^(\d{2})\.\s+(.+)$/);
  return { num: m[1], name: m[2] };
});

const DSA_TOPICS = [
  'DSA BASICS, ALGORITHMS & DATA STRUCTURE CLASSIFICATION',
  'COMPLEXITY ANALYSIS & ASYMPTOTIC NOTATIONS',
  'MEMORY MANAGEMENT & ALLOCATION',
  'ARRAYS, MATRIX & SUBARRAYS',
  'STRINGS & CHARACTER ENCODING',
  'RECURSION & BACKTRACKING',
  'SEARCHING & BINARY SEARCH',
  'LINKED LIST',
  'STACK',
  'QUEUE, DEQUE & CIRCULAR QUEUE',
  'HASHING & HASH TABLES',
  'SORTING ALGORITHMS',
  'TWO POINTER, SLIDING WINDOW & COMMON PATTERNS',
  'TREES & BINARY TREES',
  'BINARY SEARCH TREE (BST)',
  'HEAP & PRIORITY QUEUE',
  'TRIE',
  'GRAPHS & GRAPH ALGORITHMS',
  'LEETCODE / PRACTICE ROADMAP & RESOURCES',
  'OTHER PROGRAMMING / JAVASCRIPT OVERLAP',
  'FEEDBACK / STUDY NOTES',
].map((name) => ({ name }));

function isIndexLine(line) {
  return /\d+\s+items?/i.test(line) || /:\s*\d+\s*$/.test(line);
}

/**
 * Strict topic header detection:
 * - DSA: exact normalized match against known ALL-CAPS section titles
 * - Numbered: must be NN. + title that matches THAT topic number's name (prefix/high overlap)
 *   Never match by number alone; never treat normal questions as topics.
 */
function matchTopic(line, topicList, nextLine) {
  const cleaned = clean(line).replace(/\s*[—–-]\s*\d+\s*items?$/i, '');
  if (!cleaned || PAGE_MARKER.test(cleaned)) return null;

  const isDsa = topicList.length && !topicList[0].num;

  if (isDsa) {
    const k = normKey(cleaned);
    for (const t of topicList) {
      if (normKey(t.name) === k) return { name: t.name, consumedNext: false };
    }
    return null;
  }

  // Try joining wrapped topic titles (React long headers)
  const candidates = [cleaned];
  if (nextLine) {
    const n = clean(nextLine);
    if (
      n &&
      !PAGE_MARKER.test(n) &&
      !/^\d+\./.test(n) &&
      !/^[-•*]/.test(n) &&
      !/^-+$/.test(n) &&
      n.length < 100 &&
      !/\?$/.test(n)
    ) {
      candidates.unshift(cleaned + ' ' + n);
    }
  }

  for (let ci = 0; ci < candidates.length; ci++) {
    const c = candidates[ci];
    const numMatch = c.match(/^(\d{2})\.\s+(.+)$/);
    if (!numMatch) continue;

    const byNum = topicList.find((t) => t.num === numMatch[1]);
    if (!byNum) continue;

    const namePart = clean(numMatch[2])
      .replace(/\s*[—–-]\s*\d+\s*items?$/i, '')
      .replace(/\s*:\s*\d+\s*$/, '');

    const nk = normKey(byNum.name);
    const pk = normKey(namePart);
    if (!pk) continue;

    const prefixOk =
      nk === pk ||
      (nk.startsWith(pk) && pk.length >= 10) ||
      (pk.startsWith(nk) && nk.length >= 10);

    const overlapOk = tokenOverlap(namePart, byNum.name) >= 0.75;

    if (prefixOk || overlapOk) {
      return { name: byNum.name, consumedNext: ci === 0 && candidates.length > 1 && c !== cleaned };
    }
  }

  return null;
}

function parseFile(filePath, topicList) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const buckets = new Map();
  for (const t of topicList) buckets.set(t.name, []);

  let current = null;
  let buffer = '';
  let started = false;

  const flush = () => {
    if (!buffer || !current) {
      buffer = '';
      return;
    }
    let q = clean(buffer);
    buffer = '';
    q = q.replace(/^\*\*/, '').replace(/\*\*$/, '');
    if (!isNoise(q) && q.length >= 2) buckets.get(current).push(q);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flush();
      continue;
    }
    if (PAGE_MARKER.test(line)) {
      flush();
      continue;
    }
    if (/^-+$/.test(line) || /^=+$/.test(line)) continue;

    const indexStyle = isIndexLine(line);
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const topicHit = matchTopic(line, topicList, indexStyle ? '' : nextLine);

    if (topicHit) {
      flush();
      if (topicHit.consumedNext) i++;
      // Skip summary/index occurrences
      if (indexStyle) continue;
      current = topicHit.name;
      started = true;
      continue;
    }

    if (!started || !current) continue;

    const numbered = line.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      flush();
      buffer = numbered[2];
      continue;
    }

    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) {
      flush();
      buffer = bullet[1];
      continue;
    }

    if (buffer) buffer += ' ' + line;
  }
  flush();

  return topicList
    .map((t, idx) => ({
      order: idx + 1,
      name: t.name,
      questions: dedupe(buckets.get(t.name) || []),
    }))
    .filter((t) => t.questions.length > 0 && !shouldSkipTopic(t.name));
}

const configs = [
  { key: 'javascript', label: 'JavaScript', file: 'js.txt', color: '#CA8A04', topics: JS_TOPICS, expected: 2472 },
  { key: 'react', label: 'React', file: 'react.txt', color: '#0891B2', topics: REACT_TOPICS, expected: 1861 },
  { key: 'nodejs', label: 'Node.js', file: 'node.txt', color: '#16A34A', topics: NODE_TOPICS, expected: 1304 },
  { key: 'dsa', label: 'DSA', file: 'dsa.txt', color: '#DB2777', topics: DSA_TOPICS, expected: 2711 },
];

const result = {};
let total = 0;

for (const cfg of configs) {
  const topics = parseFile(path.join(__dirname, cfg.file), cfg.topics);
  const count = topics.reduce((a, t) => a + t.questions.length, 0);
  total += count;
  result[cfg.key] = {
    label: cfg.label,
    color: cfg.color,
    topicCount: topics.length,
    questionCount: count,
    topics: topics.map((t) => ({
      order: t.order,
      name: t.name,
      count: t.questions.length,
      questions: t.questions,
    })),
  };
  console.log(`\n=== ${cfg.label}: ${topics.length} topics, ${count} q (pdf ~${cfg.expected}) ===`);
  topics.forEach((t) => console.log(`  ${String(t.order).padStart(2)}. ${t.name}: ${t.questions.length}`));
}

console.log('\nTOTAL QUESTIONS:', total);
const outPath = path.join(__dirname, 'parsed-questions.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('Wrote', outPath);
