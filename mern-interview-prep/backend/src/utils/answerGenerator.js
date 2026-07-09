/**
 * Generates direct spoken interview answers — no meta framing.
 * Speaks as the candidate answering, not describing how to answer.
 */

const CONCEPTS = {
  // JavaScript
  javascript: `JavaScript is a high-level programming language used mainly to make web pages interactive. The browser runs it through engines like V8, and with Node.js the same language also runs on the server. It's dynamically typed, event-driven, and supports both object-oriented and functional styles.`,

  'use strict': `'use strict' enables strict mode. In that mode, silent mistakes become real errors — for example you can't accidentally create a global variable, duplicate parameter names aren't allowed, and inside a normal function 'this' is undefined instead of pointing to the global object. I use it to catch bugs earlier and write safer code.`,

  hoisting: `Hoisting means the engine processes declarations before running the code. var is hoisted and starts as undefined. let and const are also hoisted, but they stay in the Temporal Dead Zone until their line runs, so using them early throws a ReferenceError. Function declarations are fully hoisted, so I can call them before their definition. Function expressions follow the variable rules.`,

  tdz: `The Temporal Dead Zone is the gap between entering a scope and the moment a let or const variable is initialized. During that gap, accessing the variable throws a ReferenceError. That's why let and const feel safer than var — they don't silently give undefined before initialization.`,

  closure: `A closure is when an inner function keeps access to variables from its outer function even after that outer function has finished. I use closures for private state, function factories, and callbacks that need to remember earlier values. For example, a counter function can hide its count variable and only expose increment methods.`,

  scope: `JavaScript uses lexical scoping — where you write the code decides what variables you can see. There is global scope, function scope, and block scope with let and const. When a variable isn't found locally, the engine walks outward through the scope chain until it finds it or hits the global scope.`,

  'var let const': `var is function-scoped and can be redeclared. let is block-scoped, can be reassigned, but not redeclared in the same scope. const is also block-scoped and can't be reassigned — though if it holds an object, the object's properties can still change. In modern code I default to const, use let when I need reassignment, and avoid var.`,

  'null undefined': `undefined means a value hasn't been assigned yet — like a declared variable with no value, or a missing object property. null is an intentional empty value I set myself. One quirk to remember: typeof null returns 'object', which is a long-standing language bug.`,

  '== ===': `== compares after type coercion, so '5' == 5 is true. === compares both value and type with no coercion, so '5' === 5 is false. I almost always use === because coercion with == can create surprising results, like 0 == false being true.`,

  promise: `A Promise represents a value that will be available later. It starts pending, then becomes fulfilled or rejected. I chain work with then, catch, and finally. async/await sits on top of promises and lets me write asynchronous code that reads like synchronous code, which is usually clearer for sequential async steps.`,

  'event loop': `JavaScript runs on a single thread with a call stack. Async work goes through browser APIs or libuv in Node, then callbacks land in queues. The event loop pushes those callbacks onto the stack when it's free. Microtasks like Promise callbacks run before macrotasks like setTimeout. That's why a resolved promise can run before a zero-delay timeout.`,

  this: `this depends on how the function is called. In a normal function, this comes from the call site. In an arrow function, this is lexical — it inherits from the surrounding scope. I can also set this with call, apply, or bind. In class methods, if I pass the method as a bare callback, this can get lost unless I bind it or use an arrow function.`,

  prototype: `Every object has an internal prototype link. When I access a property, if it isn't on the object itself, JavaScript looks up the prototype chain. Classes are mainly cleaner syntax over constructor functions and prototypes. Inheritance with extends sets up that chain for me.`,

  'shallow deep copy': `A shallow copy like spread or Object.assign only copies the top level. Nested objects still share the same reference, so changing one affects the other. A deep copy clones nested structures too — structuredClone is the modern built-in option. JSON.parse(JSON.stringify(...)) also deep-copies plain data, but it drops functions, dates, undefined, and more.`,

  debounce: `Debounce waits until the user stops triggering an event for a set time, then runs the function once — perfect for search boxes. Throttle runs the function at most once per interval, which fits scroll or resize handlers. Both reduce unnecessary work and keep the UI responsive.`,

  'call apply bind': `call runs a function immediately with a chosen this and arguments listed one by one. apply is the same idea but takes arguments as an array. bind doesn't run the function right away — it returns a new function permanently tied to that this value, which is useful for callbacks and event handlers.`,

  curry: `Currying turns a function that takes multiple arguments into a sequence of functions that each take one. Partial application is related — I fix some arguments now and pass the rest later. Both help me build reusable specialized helpers from a more general function.`,

  generator: `A generator is declared with function* and can pause with yield, then resume later. It returns an iterator, so I can pull values on demand. I use generators for lazy sequences, custom iterables, and some controlled async flows.`,

  module: `ES Modules use import and export, support static analysis, and have live bindings. CommonJS uses require and module.exports and loads synchronously. In Node I choose based on the project setup — package.json "type": "module" or .mjs for ESM, otherwise CommonJS is still common.`,

  // React
  react: `React is a JavaScript library for building user interfaces with components. I describe the UI as a function of state, and React updates the DOM when that state changes. It follows a declarative, one-way data flow model, which keeps complex UIs more predictable.`,

  jsx: `JSX lets me write UI markup that looks like HTML inside JavaScript. Tools like Babel or SWC compile it into React element calls. In JSX I use className instead of class, camelCase for events, and curly braces for JavaScript expressions. JSX isn't mandatory, but it's the standard way to write React.`,

  'virtual dom': `The Virtual DOM is a lightweight JavaScript representation of the UI tree. When state changes, React builds a new virtual tree, compares it with the previous one, and then updates only what actually changed in the real DOM. That diffing step is what keeps updates efficient.`,

  reconciliation: `Reconciliation is React's process of figuring out what changed between renders. It compares the previous and next trees and applies the minimum DOM updates. Keys are important in lists because they help React identify which items moved, were added, or were removed. Using array index as a key is risky when the list can reorder.`,

  fiber: `Fiber is React's internal reconciler architecture. It breaks rendering work into small units so React can pause, resume, and prioritize updates. That design supports concurrent features and helps keep the UI responsive during heavy renders.`,

  usestate: `useState gives a function component local state. Calling the setter schedules a re-render with the new value. When the next state depends on the previous one, I use the functional updater form like setCount(c => c + 1). React may batch multiple updates for performance.`,

  useeffect: `useEffect runs side effects after the browser paints — things like fetching data, subscriptions, or timers. The dependency array controls when it re-runs. I return a cleanup function to remove listeners or clear timers. Missing or wrong dependencies are a common source of bugs, so I treat that array carefully.`,

  usememo: `useMemo caches an expensive calculated value between renders until its dependencies change. useCallback does the same for function identities. I don't wrap everything in them by default — only when profiling shows a real cost, or when a stable reference is needed for child memoization.`,

  useref: `useRef stores a mutable value in .current that survives re-renders without causing a re-render itself. I use it for DOM nodes, keeping previous values, and holding timers or IDs that shouldn't trigger UI updates.`,

  redux: `Redux keeps application state in a single store. State is read-only, and updates happen by dispatching actions through pure reducers. Redux Toolkit is what I use in practice — configureStore, createSlice, and createAsyncThunk cut down the old boilerplate and make the pattern much cleaner.`,

  context: `Context lets me share values across the tree without prop drilling — themes, auth user, locale, and similar. The downside is that when the context value changes, consumers re-render. For high-frequency updates I split contexts or use a dedicated state library.`,

  'controlled uncontrolled': `In a controlled input, React state owns the value and onChange updates that state. In an uncontrolled input, the DOM holds the value and I read it through a ref when needed. Controlled inputs are better when I need validation, conditional UI, or full control over the field.`,

  keys: `Keys tell React which list item is which across renders. Stable unique IDs are best. If I use the index and the list reorders, React can reuse the wrong component state and create subtle UI bugs.`,

  suspense: `Suspense shows a fallback while a child is waiting — for example a lazy-loaded component. With React.lazy and Suspense I can split code so users only download the parts of the app they need.`,

  'error boundary': `An error boundary catches render errors in its child tree and shows a fallback UI instead of crashing the whole page. It doesn't catch errors inside event handlers, async code, or the boundary component itself. In modern apps I often use a library or framework helper for this.`,

  // Node
  nodejs: `Node.js is a JavaScript runtime built on the V8 engine. It uses an event-driven, non-blocking I/O model through libuv, which makes it strong for network apps and APIs that handle many concurrent connections without creating a thread per request.`,

  express: `Express is a minimal web framework for Node. I create an app, define routes, plug in middleware, and send responses. It's flexible and unopinionated, so most Node APIs are built around it or something very similar.`,

  middleware: `Middleware is a function with access to req, res, and next. Requests flow through middleware in order — logging, auth, body parsing, validation, and so on. Error middleware takes four arguments: err, req, res, next. That pattern keeps cross-cutting concerns out of every route handler.`,

  'package json': `package.json holds project metadata, scripts, and dependency lists. package-lock.json locks exact installed versions so installs stay reproducible across machines. dependencies are needed at runtime; devDependencies are for build and test tools.`,

  'env variables': `Environment variables keep config and secrets out of source code. In Node I read them from process.env, often loaded from a .env file with dotenv in development. I never commit real secrets, and production values come from the host environment.`,

  stream: `Streams process data chunk by chunk instead of loading everything into memory. There are readable, writable, duplex, and transform streams. Piping a file read stream into a response is how I efficiently handle large uploads and downloads.`,

  buffer: `Buffer is Node's container for binary data. Stream chunks are often Buffers. For small binary work Buffers are fine; for large files I prefer streams so memory usage stays under control.`,

  cluster: `The cluster module lets me fork worker processes that share a server port, so I can use multiple CPU cores. worker_threads are different — they run JavaScript in parallel threads inside one process, which helps CPU-heavy work without the overhead of full processes.`,

  jwt: `A JWT is a signed token with header, payload, and signature. After login I send it as a Bearer token, and the server verifies the signature and expiry on protected routes. I treat storage carefully because if XSS can read localStorage, tokens can be stolen.`,

  cors: `CORS is a browser rule that controls which frontends can call my API from another origin. The server opts in with Access-Control-Allow-Origin and related headers. For non-simple requests the browser first sends an OPTIONS preflight to check permissions.`,

  'event emitter': `EventEmitter is the observer pattern in Node: listeners subscribe with on, and emitters fire events with emit. Many Node APIs inherit from it. I remove listeners when I'm done, otherwise long-running apps can leak memory.`,

  // DSA
  'data structure': `A data structure is a way to organize data so operations are efficient. Arrays, linked lists, stacks, and queues are linear. Trees and graphs are non-linear. I choose based on what I need most — fast access, fast insert/delete, ordering, relationships, and so on.`,

  algorithm: `An algorithm is a clear step-by-step method to solve a problem. Beyond correctness, I care about time and space complexity — usually expressed with Big-O — so I know how the solution scales as input size grows.`,

  'big o': `Big-O describes the upper bound of growth for time or space as n increases. Common ones are O(1), O(log n), O(n), O(n log n), and O(n²). Big-Ω is a lower bound, and Big-Θ is a tight bound when both sides match. In interviews I usually quote worst-case Big-O unless asked otherwise.`,

  array: `An array stores elements in contiguous memory, so index access is O(1). Inserting or deleting in the middle is O(n) because elements shift. Dynamic arrays resize occasionally with amortized cost. Arrays are great for random access, weaker when I need frequent inserts in the middle.`,

  'linked list': `A linked list stores nodes connected by pointers. Singly linked lists have next only; doubly linked lists have prev and next. Insert or delete at a known node is O(1), but search is O(n) because there's no direct indexing like arrays.`,

  stack: `A stack is LIFO — last in, first out. I push and pop from the top. It's used for undo features, the call stack, DFS, and checking balanced parentheses. I can implement it with an array or a linked list.`,

  queue: `A queue is FIFO — first in, first out. Enqueue at the rear, dequeue from the front. It's used in BFS, scheduling, and buffering. A deque allows inserts and removals at both ends, and a circular queue reuses buffer space efficiently.`,

  'hash table': `A hash table maps keys to values through a hash function into buckets. Average insert, lookup, and delete are O(1). Collisions are handled with chaining or open addressing. If many keys collide, performance can degrade, so a good hash and load factor matter.`,

  recursion: `Recursion solves a problem by a function calling itself with a smaller input until it hits a base case. It uses call-stack space, so deep recursion can overflow. Backtracking explores choices, then undoes them — classic for permutations, combinations, and path-finding.`,

  'binary search': `Binary search works on sorted data by repeatedly cutting the search space in half, which is O(log n). The important details are calculating mid safely and updating the low/high bounds correctly so I don't loop forever or skip the target.`,

  sorting: `Sorting rearranges data into order. QuickSort is usually O(n log n) but can hit O(n²) in the worst case. MergeSort is stable and guaranteed O(n log n). HeapSort is also O(n log n). Stability matters when equal keys should keep their original relative order.`,

  tree: `A tree is a hierarchy of nodes with parent-child links. A binary tree has at most two children. Common traversals are inorder, preorder, postorder, and level-order BFS. Balanced trees keep height near log n so operations stay fast.`,

  bst: `In a Binary Search Tree, left values are smaller and right values are larger. Average search, insert, and delete are O(log n), but a skewed tree becomes O(n). Inorder traversal gives sorted order. AVL and Red-Black trees keep the structure balanced.`,

  heap: `A heap is a complete binary tree that satisfies heap order. In a min-heap every parent is smaller than or equal to its children. Heaps power priority queues and HeapSort. Peek is O(1); insert and remove-root are O(log n).`,

  graph: `A graph is nodes connected by edges — directed or undirected, weighted or unweighted. I usually store it as an adjacency list. BFS finds shortest paths in unweighted graphs, DFS explores connectivity and cycles, and Dijkstra handles non-negative weighted shortest paths.`,

  trie: `A Trie stores strings character by character. It's excellent for prefix search and autocomplete because common prefixes share paths. Lookup time depends on key length, and the trade-off is higher memory usage.`,

  'two pointer': `The two-pointer technique uses two indices moving through a structure. On sorted arrays it's great for pair sums and in-place rearrangements. Sliding window is a related pattern for subarray or substring problems where I expand and shrink a range while tracking a condition.`,
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

  if (subject === 'nodejs' && /\bwhat\s+is\s+node|\bnode\.?js\b/.test(q)) {
    return { key: 'nodejs', answer: CONCEPTS.nodejs };
  }
  if (subject === 'react' && /\bwhat\s+is\s+react|\breact\b/.test(q)) {
    return { key: 'react', answer: CONCEPTS.react };
  }
  if (
    subject === 'javascript' &&
    (/\bwhat\s+is\s+js\b|\bwhat\s+is\s+javascript\b|(?<![.\w])js(?![.\w])/.test(q) ||
      /^javascript\??$/.test(q.trim()))
  ) {
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
  if (/advanced|internal|fiber|libuv|prototype chain|skew|avl|dijkstra|saga|concurrent/.test(s)) {
    return 'hard';
  }
  if (/what is|difference|vs|explain|basic|brief|types of/.test(s)) return 'easy';
  return 'medium';
}

function topicFallback(subject, topic, question) {
  const t = topic.toLowerCase();
  const q = question.toLowerCase();
  const label = {
    javascript: 'JavaScript',
    react: 'React',
    nodejs: 'Node.js',
    dsa: 'DSA',
  }[subject] || subject;

  if (/difference|vs\.?|versus|v\/s/.test(q)) {
    return `${question.replace(/\?$/, '')} comes down to behavior and use-case. Under ${topic}, I define each side clearly, then contrast syntax or semantics, performance, and when I pick one over the other. I also call out one common pitfall so the distinction stays practical.`;
  }

  if (/what is|define|explain|brief/.test(q)) {
    return `${question.replace(/\?$/, '')} is a core idea in ${topic}. In short, I define it in one clear line, explain how it works in ${label}, and connect it to a real situation where I'd actually use it. That keeps the answer concrete instead of just a textbook definition.`;
  }

  if (/how (do|does|to)|working|work/.test(q)) {
    return `For ${question.replace(/\?$/, '')}, I walk through the flow step by step: what triggers it, what happens internally, and what comes out. In ${topic}, the important part is the mechanism — once that is clear, the details are easier to remember and apply.`;
  }

  if (/time complexity|space complexity|big ?o|complexity/.test(q) || /complexity|asymptotic/.test(t)) {
    return `I describe the complexity with Big-O, and I separate best, average, and worst case when they differ. Then I explain why that bound exists — loops, recursion depth, tree height, or hashing — and mention space if it matters. I also say which inputs cause the worst case.`;
  }

  if (/implement|write|program|code|practical|leetcode|workout/.test(q)) {
    return `For this problem in ${topic}, I first clarify constraints and edge cases. Then I outline a brute-force approach, improve it to a better one, state the time and space complexity, and finally implement it cleanly while handling empty input, duplicates, and boundary conditions.`;
  }

  if (/advantage|disadvantage|pros|cons|why use|why do we/.test(q)) {
    return `I start with what ${question.replace(/\?$/, '')} solves well, then the limitations — performance, complexity, or runtime constraints — and finish with when I'd choose an alternative. That balance shows I understand trade-offs, not just the happy path. Context here is ${topic}.`;
  }

  if (/type|types of|classification|kinds of/.test(q)) {
    return `I group the main types under ${topic}, give each one a one-line meaning, and add a quick example of when I'd pick it. A clear taxonomy is usually what matters most for this kind of question.`;
  }

  const subjectHint = {
    javascript: 'In JavaScript I connect it to scope, types, the async model, or the runtime.',
    react: 'In React I connect it to rendering, state, component design, or one-way data flow.',
    nodejs: 'In Node.js I connect it to the event loop, non-blocking I/O, modules, or middleware.',
    dsa: 'In DSA I connect it to the operations I need, the complexity, and which structure or algorithm fits.',
  }[subject] || 'I keep the explanation clear and tied to a real use-case.';

  return `${question.replace(/\?$/, '')} sits under ${topic}. I give a concise definition, explain the important mechanics, and show where I'd use it. ${subjectHint}`;
}

function generateAnswer(question, subject, topic) {
  const hit = findConceptAnswer(question, subject);
  if (hit) {
    let core = hit.answer;
    if (/difference|vs\.?|versus/.test(question.toLowerCase())) {
      core += ` When the question is comparative, I also state when I choose one option over the other.`;
    }
    if (/implement|write a|code/.test(question.toLowerCase())) {
      core += ` If I need to code it, I explain the approach first, then implement with edge cases and state the complexity.`;
    }
    return core;
  }
  return topicFallback(subject, topic, question);
}

function generateKeyPoints(question, subject, topic) {
  const hit = findConceptAnswer(question, subject);
  const points = [];
  if (hit) points.push(`Core idea: ${hit.key}`);
  points.push(`Topic: ${topic}`);
  if (/complexity|big o|time|space/.test(question.toLowerCase())) {
    points.push('State time and space complexity');
  }
  if (/difference|vs/.test(question.toLowerCase())) {
    points.push('Define both sides, then contrast with an example');
  }
  points.push('Tie it to a real use-case or trade-off');
  return points.slice(0, 5);
}

module.exports = {
  generateAnswer,
  generateKeyPoints,
  difficultyFromQuestion,
  CONCEPTS,
};
