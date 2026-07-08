/**
 * Answer generator.
 * Produces structured answers for every question using
 * topic context + concept knowledge + question heuristics.
 */
const CONCEPTS = {
  // JavaScript
  javascript: `JavaScript is a high-level, interpreted (JIT-compiled) programming language mainly used to make web pages interactive. It runs in browsers via engines like V8 and on servers via Node.js.`,
  'use strict': `Strict mode is enabled with 'use strict'. It catches silent errors, prevents accidental globals, disallows duplicate parameter names, and makes 'this' undefined in plain functions instead of pointing to the global object.`,
  hoisting: `Hoisting means declarations are processed before execution. var is hoisted and initialized as undefined. let/const are hoisted but stay in the Temporal Dead Zone until initialized. Function declarations are fully hoisted; function expressions follow variable rules.`,
  tdz: `The Temporal Dead Zone is the period from entering scope until a let/const variable is initialized. Accessing it before initialization throws a ReferenceError.`,
  closure: `A closure is when an inner function remembers variables from its outer lexical scope even after the outer function has returned. Common use-cases: data privacy, function factories, and maintaining state in callbacks.`,
  scope: `JavaScript uses lexical scoping. Scope types: global, function, and block (let/const). The scope chain is how the engine looks up variables from inner to outer environments.`,
  'var let const': `var is function-scoped and can be redeclared. let is block-scoped and can be reassigned but not redeclared in the same scope. const is block-scoped and cannot be reassigned (object contents can still mutate).`,
  'null undefined': `undefined means a variable was declared but not assigned (or a missing property). null is an intentional empty value assigned by the developer. typeof null is the classic quirk returning 'object'.`,
  '== ===': `== does type coercion before comparison. === checks value and type with no coercion. Prefer === to avoid surprising coercions like 0 == false.`,
  promise: `A Promise represents a future value: pending, fulfilled, or rejected. Thenables chain with then/catch/finally. async/await is syntactic sugar over promises and makes asynchronous flow read like synchronous code.`,
  'event loop': `JavaScript is single-threaded. The call stack runs sync code. Async callbacks go through Web APIs / libuv, then queues. Microtasks (promises, queueMicrotask) run before macrotasks (setTimeout, I/O). That ordering matters for understanding async behavior.`,
  this: `this depends on how a function is called. Regular functions: call-site binding. Arrow functions: lexical this from enclosing scope. call/apply/bind can set this explicitly. In classes, methods need care when passed as callbacks.`,
  prototype: `Every object has an internal [[Prototype]]. Property lookup walks the prototype chain. Classes are syntactic sugar over constructor functions + prototypes. Object.create and class extends both set up inheritance.`,
  'shallow deep copy': `Shallow copy duplicates only the top level (spread, Object.assign). Nested objects stay shared by reference. Deep copy clones nested structures (structuredClone, or careful recursion/JSON with limitations).`,
  debounce: `Debouncing delays invoking a function until a quiet period after the last call—useful for search inputs. Throttling ensures a function runs at most once per interval—useful for scroll/resize handlers.`,
  'call apply bind': `call invokes immediately with a this value and comma args. apply is similar but takes an array of args. bind returns a new function permanently bound to a this value (and optional preset args).`,
  curry: `Currying transforms a function of n args into a chain of unary functions. Partial application fixes some args upfront. Both help create reusable specialized functions.`,
  generator: `Generator functions (function*) can pause with yield and resume later. They return an iterator. Useful for lazy sequences, custom iterables, and some async control-flow patterns.`,
  module: `ES Modules use import/export with static analysis and live bindings. CommonJS uses require/module.exports and loads synchronously. In Node, file extensions and "type": "module" matter.`,

  // React
  react: `React is a JavaScript library for building UIs with components. It uses a declarative model and a Virtual DOM so we describe what the UI should look like for a given state, and React updates the DOM efficiently.`,
  jsx: `JSX is syntactic sugar that compiles (via Babel/SWC) to React.createElement / jsx runtime calls. It looks like HTML in JS but uses className, camelCase events, and expressions in curly braces. JSX is optional but standard.`,
  'virtual dom': `The Virtual DOM is a lightweight JS tree mirroring UI structure. On state/prop changes React creates a new tree, diffs it (reconciliation), and commits minimal DOM updates. Fiber enables incremental rendering and prioritization.`,
  reconciliation: `Reconciliation is React's process of comparing previous and next Virtual DOM trees and deciding what to update. Keys help React identify list items across renders. Using index as key is risky when lists reorder.`,
  fiber: `React Fiber is the reimplementation of React's core reconciler. It splits work into units, supports interruption, prioritization, and concurrent features—so rendering can stay responsive.`,
  usestate: `useState adds local state to function components. Calling the setter schedules a re-render. Prefer functional updates when next state depends on previous. State updates may batch.`,
  useeffect: `useEffect runs side effects after paint. The dependency array controls when it re-runs. Return a cleanup function for subscriptions/timers. Missing deps or wrong deps are a common source of bugs.`,
  usememo: `useMemo memoizes an expensive computed value between renders when dependencies are unchanged. useCallback memoizes a function reference. Don't use them by default—only when profiling shows benefit or referential equality matters.`,
  useref: `useRef holds a mutable .current value that persists across renders without causing re-renders. Common uses: DOM access, storing previous values, and keeping stable IDs/timers.`,
  redux: `Redux is predictable state management: single store, state is read-only, updates via pure reducers and dispatched actions. Redux Toolkit is the modern standard—configureStore, createSlice, createAsyncThunk reduce boilerplate.`,
  context: `Context provides a way to pass data through the tree without prop drilling. Good for theme/auth/locale. For high-frequency updates, Context can cause wide re-renders—consider splitting contexts or using a store library.`,
  'controlled uncontrolled': `Controlled inputs get value from React state and onChange handlers. Uncontrolled inputs use refs and the DOM as source of truth. Controlled is preferred for validation and dynamic UI.`,
  keys: `Keys help React identify which items changed, were added, or removed. Stable unique IDs are best. Index keys break state when list order changes.`,
  suspense: `Suspense lets components “wait” for something (lazy code, data in modern patterns) and show a fallback. React.lazy + Suspense enables code splitting of components.`,
  'error boundary': `Error Boundaries are class components (or libraries) that catch render errors in children and show a fallback UI. They do not catch events, async code, or errors in the boundary itself.`,

  // Node
  nodejs: `Node.js is a JavaScript runtime built on Chrome's V8 engine. It uses an event-driven, non-blocking I/O model (libuv), which makes it efficient for scalable network applications.`,
  express: `Express is a minimal Node web framework. You create an app, define routes, plug middleware, and send responses. It's unopinionated and sits at the center of most Node API stacks.`,
  middleware: `Middleware functions have access to req, res, and next. They run in order for logging, auth, parsing, validation, and errors. Error middleware uses four parameters (err, req, res, next).`,
  'package json': `package.json declares metadata, scripts, and dependencies. package-lock.json locks exact versions for reproducible installs. dependencies vs devDependencies separates runtime from build/test tools.`,
  'env variables': `Environment variables configure apps per environment without hardcoding secrets. In Node we often use process.env, commonly loaded from a .env file via dotenv (never commit secrets).`,
  stream: `Streams process data piece-by-piece: readable, writable, duplex, transform. Piping avoids loading entire files into memory—critical for large uploads/downloads.`,
  buffer: `Buffer is Node's way to handle binary data. Streams often emit Buffer chunks. Prefer streams for large payloads; Buffers are fine for smaller binary operations.`,
  cluster: `The cluster module forks workers sharing a server port to use multiple CPU cores. worker_threads run JS in parallel threads for CPU-bound work without spawning full processes.`,
  jwt: `JWT is a signed token (header.payload.signature) often used for stateless auth. Send via Authorization Bearer header. Validate signature and expiry on the server. Store carefully—XSS can steal tokens from localStorage.`,
  cors: `CORS is a browser security feature controlling cross-origin HTTP access. Servers opt-in via Access-Control-* headers. Preflight OPTIONS checks happen for non-simple requests.`,
  'event emitter': `EventEmitter implements the observer pattern: on/emit/once/off. Many Node APIs inherit from it. Avoid memory leaks by removing listeners; be careful with max listeners.`,

  // DSA
  'data structure': `A data structure organizes data for efficient access and modification. Linear structures include arrays, lists, stacks, queues. Non-linear include trees and graphs. Choice depends on operations and complexity needs.`,
  algorithm: `An algorithm is a step-by-step procedure to solve a problem. We judge algorithms by correctness, time complexity, and space complexity—usually with Big-O for worst-case growth.`,
  'big o': `Big-O describes upper-bound growth of time/space as input size grows. Common: O(1), O(log n), O(n), O(n log n), O(n²). Big-Ω is lower bound; Big-Θ is tight bound when both match.`,
  array: `Arrays store elements in contiguous memory with O(1) index access. Insert/delete in the middle is O(n). Dynamic arrays amortize resizing. Great for random access; weaker for frequent mid-list edits.`,
  'linked list': `Linked lists store nodes with pointers. Singly: next only. Doubly: prev and next. Insert/delete at known node is O(1), but search is O(n). No random access like arrays.`,
  stack: `Stack is LIFO: push/pop on top. Used for undo, call stacks, DFS, and balanced parentheses. Can implement with array or linked list.`,
  queue: `Queue is FIFO: enqueue rear, dequeue front. Used in BFS, scheduling, buffering. Deque allows both ends. Circular queues efficiently reuse buffer space.`,
  'hash table': `Hash tables map keys to values via a hash function into buckets. Average O(1) insert/lookup/delete. Collisions handled by chaining or open addressing. Worst case degrades if many collisions.`,
  recursion: `Recursion solves problems by functions calling themselves with smaller inputs, needing a base case. Uses call-stack space. Backtracking explores choices and reverts—classic for permutations/combinations.`,
  'binary search': `Binary search finds a target in a sorted array by repeatedly halving the search space—O(log n). Be careful with mid calculation and boundary conditions (low/high updates).`,
  sorting: `Sorting algorithms rearrange data. QuickSort average O(n log n) but worst O(n²). MergeSort guaranteed O(n log n) and stable. HeapSort O(n log n). Stability matters when equal keys must keep order.`,
  tree: `Trees are hierarchical nodes with parent-child links. Binary trees have ≤2 children. Traversals: inorder, preorder, postorder, level-order (BFS). Balanced trees keep height ~log n.`,
  bst: `BST orders keys: left < node < right. Average search/insert/delete O(log n), worst O(n) if skewed. Inorder traversal yields sorted keys. AVL/Red-Black keep balance.`,
  heap: `A heap is a complete binary tree satisfying heap order. Min-heap: parent ≤ children. Used for priority queues and HeapSort. Insert/delete-root are O(log n); peek is O(1).`,
  graph: `Graphs are nodes + edges, directed or undirected, weighted or not. Representations: adjacency list/matrix. BFS for shortest unweighted paths; DFS for connectivity/cycles. Dijkstra for weighted non-negative shortest paths.`,
  trie: `A Trie (prefix tree) stores strings character-by-character. Excellent for autocomplete and prefix search. Space can be high; time relates to key length.`,
  'two pointer': `Two-pointer technique uses two indices moving through a structure—common on sorted arrays for pairs/sums, palindromes, and in-place rearrangements. Sliding window is a related pattern for subarrays/substrings.`,
};

const ALIASES = [
  { re: /\bnode\.?js\b|\bwhat\s+is\s+node\b/i, key: 'nodejs' },
  { re: /\breact\.?js\b|\bwhat\s+is\s+react\b|\breact\b/i, key: 'react' },
  { re: /\bjavascript\b|\bwhat\s+is\s+js\b|(?<![.\w])js(?![.\w])/i, key: 'javascript' },
  { re: /\buse\s*strict\b|\bstrict\s*mode\b/i, key: 'use strict' },
  { re: /\btdz\b|temporal\s*dead\s*zone/i, key: 'tdz' },
  { re: /\bhoist(ing)?\b/i, key: 'hoisting' },
  { re: /\bclosure/i, key: 'closure' },
  { re: /\b(var|let|const)\b.*\b(var|let|const)\b|\bdifference.*\b(var|let|const)/i, key: 'var let const' },
  { re: /\bnull\b.*\bundefined\b|\bundefined\b.*\bnull\b/i, key: 'null undefined' },
  { re: /\b==\b.*\b===\b|\b===\b|\bloose\s*equal|\bstrict\s*equal/i, key: '== ===' },
  { re: /\bpromise|\basync\s*\/?\s*await|\basync\s*await/i, key: 'promise' },
  { re: /\bevent\s*loop\b/i, key: 'event loop' },
  { re: /\bthis\s*keyword|\bthis\s*binding|\bwhat is this\b|\bthis\s*in\s*(js|javascript|arrow)/i, key: 'this' },
  { re: /\bprototype|\bprototypal/i, key: 'prototype' },
  { re: /\bshallow\b|\bdeep\s*copy|\bstructuredclone\b/i, key: 'shallow deep copy' },
  { re: /\bdebounc|\bthrottl/i, key: 'debounce' },
  { re: /\bcall\b.*\bapply\b|\bapply\b.*\bbind\b|\bcall\s*,\s*apply/i, key: 'call apply bind' },
  { re: /\bcurry|\bpartial\s*application/i, key: 'curry' },
  { re: /\bgenerator/i, key: 'generator' },
  { re: /\bes\s*modules?|\bcommonjs\b|\bimport\s*\/\s*export/i, key: 'module' },
  { re: /\bjsx\b/i, key: 'jsx' },
  { re: /\bvirtual\s*dom\b/i, key: 'virtual dom' },
  { re: /\breconciliation|\bdiffing\b/i, key: 'reconciliation' },
  { re: /\bfiber\b/i, key: 'fiber' },
  { re: /\busestate\b/i, key: 'usestate' },
  { re: /\buseeffect\b/i, key: 'useeffect' },
  { re: /\busememo\b|\busecallback\b/i, key: 'usememo' },
  { re: /\buseref\b/i, key: 'useref' },
  { re: /\bredux\b|\brt[kK]\b|\bcreateSlice\b/i, key: 'redux' },
  { re: /\bcontext\s*api\b|\busecontext\b/i, key: 'context' },
  { re: /\bcontrolled\b|\buncontrolled\b/i, key: 'controlled uncontrolled' },
  { re: /\bkeys?\b.*\blist|\blist.*\bkeys?\b|\bwhy\s*keys?\b/i, key: 'keys' },
  { re: /\bsuspense\b|\breact\.lazy\b/i, key: 'suspense' },
  { re: /\berror\s*boundar/i, key: 'error boundary' },
  { re: /\bexpress\b/i, key: 'express' },
  { re: /\bmiddleware\b/i, key: 'middleware' },
  { re: /\bpackage\.?json\b|\bpackage-?lock\b/i, key: 'package json' },
  { re: /\b\.env\b|\benvironment\s*variable/i, key: 'env variables' },
  { re: /\bstream/i, key: 'stream' },
  { re: /\bbuffer\b/i, key: 'buffer' },
  { re: /\bcluster\b|\bworker_threads\b|\bworker\s*threads?\b/i, key: 'cluster' },
  { re: /\bjwt\b|\bjson\s*web\s*token/i, key: 'jwt' },
  { re: /\bcors\b/i, key: 'cors' },
  { re: /\bevent\s*emitter\b|\beventemitter\b/i, key: 'event emitter' },
  { re: /\bdata\s*structure/i, key: 'data structure' },
  { re: /\balgorithm\b/i, key: 'algorithm' },
  { re: /\bbig\s*-?\s*o\b|\basymptotic|\btime\s*complexity|\bspace\s*complexity/i, key: 'big o' },
  { re: /\barray\b|\bmatrix\b|\bsubarray\b/i, key: 'array' },
  { re: /\blinked\s*list\b/i, key: 'linked list' },
  { re: /\bstack\b/i, key: 'stack' },
  { re: /\bqueue\b|\bdeque\b/i, key: 'queue' },
  { re: /\bhash\s*(table|map)\b|\bhashtable\b/i, key: 'hash table' },
  { re: /\brecursion|\bbacktrack/i, key: 'recursion' },
  { re: /\bbinary\s*search\b/i, key: 'binary search' },
  { re: /\bsort(ing)?\b|\bquicksort\b|\bmergesort\b|\bheapsort\b/i, key: 'sorting' },
  { re: /\bbinary\s*tree\b|\btree\s*traversal|\bavl\b/i, key: 'tree' },
  { re: /\bbst\b|\bbinary\s*search\s*tree\b/i, key: 'bst' },
  { re: /\bheap\b|\bpriority\s*queue\b/i, key: 'heap' },
  { re: /\bgraph\b|\bbfs\b|\bdfs\b|\bdijkstra\b/i, key: 'graph' },
  { re: /\btrie\b|\bprefix\s*tree\b/i, key: 'trie' },
  { re: /\btwo\s*pointer|\bsliding\s*window\b/i, key: 'two pointer' },
  { re: /\bscope\b|\blexical\s*scope|\bscope\s*chain/i, key: 'scope' },
];

function findConceptAnswer(question, subject) {
  const q = question.toLowerCase();

  // Subject-first shortcuts for "what is X" style prompts
  if (subject === 'nodejs' && /\bwhat\s+is\s+node|\bnode\.?js\b/.test(q)) {
    return { key: 'nodejs', answer: CONCEPTS.nodejs };
  }
  if (subject === 'react' && /\bwhat\s+is\s+react|\breact\b/.test(q)) {
    return { key: 'react', answer: CONCEPTS.react };
  }
  if (subject === 'javascript' && (/\bwhat\s+is\s+js\b|\bwhat\s+is\s+javascript\b|(?<![.\w])js(?![.\w])/.test(q) || /^javascript\??$/.test(q.trim()))) {
    return { key: 'javascript', answer: CONCEPTS.javascript };
  }
  if (subject === 'dsa' && /\bwhat\s+is\s+(an?\s+)?(algorithm|data\s*structure)/.test(q)) {
    if (/data\s*structure/.test(q)) return { key: 'data structure', answer: CONCEPTS['data structure'] };
    return { key: 'algorithm', answer: CONCEPTS.algorithm };
  }

  for (const alias of ALIASES) {
    if (alias.re.test(q) && CONCEPTS[alias.key]) {
      return { key: alias.key, answer: CONCEPTS[alias.key] };
    }
  }
  const entries = Object.entries(CONCEPTS).sort((a, b) => b[0].length - a[0].length);
  for (const [key, answer] of entries) {
    const parts = key.split(' ');
    if (parts.length === 1) {
      const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(q) || q.includes(key)) return { key, answer };
    } else if (parts.every((p) => q.includes(p))) {
      return { key, answer };
    }
  }
  return null;
}

function difficultyFromQuestion(q, topic) {
  const s = `${q} ${topic}`.toLowerCase();
  if (/advanced|internal|fiber|libuv|prototype chain|skew|avl|dijkstra|saga|concurrent/.test(s)) return 'hard';
  if (/what is|difference|vs|explain|basic|brief|types of/.test(s)) return 'easy';
  return 'medium';
}

function topicFallback(subject, topic, question) {
  const t = topic.toLowerCase();
  const q = question.toLowerCase();

  if (/difference|vs\.?|versus|v\/s/.test(q)) {
    return `When comparing concepts, define each clearly, then contrast them on behavior, performance, and use-cases. For "${question}", highlight how they differ in syntax/semantics, when each is preferred, and one pitfall to avoid. Relating this to ${topic} keeps the answer grounded.`;
  }
  if (/what is|define|explain|brief/.test(q)) {
    return `"${question}" sits under ${topic} in ${subject}. Start with a one-line definition, then explain how it works, why it matters in real apps, and finish with a tiny example or complexity note if relevant.`;
  }
  if (/how (do|does|to)|working|work/.test(q)) {
    return `Walk through the flow step by step for "${question}". Start from input/trigger, describe the internal steps, then the output/side effects. In ${topic}, the key is understanding the mechanism—not memorizing buzzwords.`;
  }
  if (/time complexity|space complexity|big ?o|complexity/.test(q) || /complexity|asymptotic/.test(t)) {
    return `State the Big-O carefully (best/average/worst if they differ), explain why that bound exists (loops, recursion depth, tree height), and mention space if relevant. Also note which inputs cause the worst case.`;
  }
  if (/implement|write|program|code|practical|leetcode|workout/.test(q)) {
    return `For a coding prompt like this, clarify constraints first, then outline brute force, improve to an optimal approach, discuss complexity, and finally code cleanly with edge cases (empty input, duplicates, negatives, overflow). Topic focus: ${topic}.`;
  }
  if (/advantage|disadvantage|pros|cons|why use|why do we/.test(q)) {
    return `Give balanced pros/cons. Strengths first (what problem it solves well), then limitations (performance, complexity, browser/runtime constraints), and when to choose an alternative. Context: ${topic}.`;
  }
  if (/type|types of|classification|kinds of/.test(q)) {
    return `List the main categories with a one-line meaning each, then give a quick example of when to pick each type. Keeping the taxonomy clear is usually what matters for "${question}".`;
  }

  const subjectHint = {
    javascript: 'Relate it to core JS behavior: scope, types, async model, or the runtime.',
    react: 'Relate it to rendering, state, component design, or React\'s data flow.',
    nodejs: 'Relate it to the event loop, non-blocking I/O, modules, or Express middleware pipelines.',
    dsa: 'Relate it to operations, complexity, and which structure/algorithm fits the problem.',
  }[subject] || 'Keep the answer clear, correct, and example-driven.';

  return `For "${question}" (topic: ${topic}): give a concise definition, explain the important mechanics, and connect it to a real use-case. ${subjectHint}`;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

function interviewWrap(core, question) {
  const openers = [
    `Sure — in an interview I'd explain it like this.`,
    `Good question. Here's how I'd answer in a technical interview.`,
    `I'd keep this structured and practical.`,
  ];
  const opener = openers[Math.abs(hash(question)) % openers.length];
  const closer = `If the interviewer goes deeper, I'd add a small example and mention trade-offs or when I'd use this in a real project.`;
  return `${opener}\n\n${core}\n\n${closer}`;
}

function generateAnswer(question, subject, topic) {
  const hit = findConceptAnswer(question, subject);
  let core;
  if (hit) {
    core = hit.answer;
    if (/difference|vs\.?|versus/.test(question.toLowerCase())) {
      core += `\n\nFor comparison-style follow-ups, I'd explicitly contrast related ideas and say when I'd choose one over the other.`;
    }
    if (/implement|write a|code/.test(question.toLowerCase())) {
      core += `\n\nIf they ask me to code it, I'd narrate the approach first, then implement with edge cases and state the complexity.`;
    }
  } else {
    core = topicFallback(subject, topic, question);
  }
  return interviewWrap(core, question);
}

function generateKeyPoints(question, subject, topic) {
  const hit = findConceptAnswer(question, subject);
  const points = [];
  if (hit) points.push(`Core idea: ${hit.key}`);
  points.push(`Topic area: ${topic}`);
  if (/complexity|big o|time|space/.test(question.toLowerCase())) {
    points.push('Always state time and space complexity');
  }
  if (/difference|vs/.test(question.toLowerCase())) {
    points.push('Define both sides, then contrast with an example');
  }
  points.push('End with a real-world use-case or trade-off');
  return points.slice(0, 5);
}

module.exports = {
  generateAnswer,
  generateKeyPoints,
  difficultyFromQuestion,
  CONCEPTS,
};
