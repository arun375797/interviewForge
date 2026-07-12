/**
 * Generates direct answers with no meta framing.
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
  react: `React is a JavaScript library for building user interfaces with components. The UI is described as a function of state, and React updates the DOM when that state changes. It follows a declarative, one-way data flow model, which keeps complex UIs more predictable.`,

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

  'big o': `Big-O describes the upper bound of growth for time or space as n increases. Common ones are O(1), O(log n), O(n), O(n log n), and O(n²). Big-Ω is a lower bound, and Big-Θ is a tight bound when both sides match. Worst-case Big-O is the default unless the question asks for best, average, or amortized complexity.`,

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

Object.assign(CONCEPTS, {
  encapsulation: `Encapsulation means keeping data and the methods that work on that data together, while hiding the internal details from outside code. In JavaScript I can achieve it with classes, closures, private fields using #, or module scope. The main benefit is control: outside code uses a clean public API instead of directly changing internal state.`,
  abstraction: `Abstraction means exposing only the necessary behavior and hiding implementation details. For example, a class can expose a save() method without forcing the caller to know how validation, API calls, or database writes happen internally. It reduces complexity and makes code easier to change.`,
  inheritance: `Inheritance lets one class or object reuse behavior from another. In JavaScript, this works through the prototype chain, and class extends is syntax over that mechanism. I use inheritance carefully because composition is often simpler, but inheritance is useful when there is a real is-a relationship.`,
  polymorphism: `Polymorphism means different objects can respond to the same method name in their own way. For example, different payment classes can all have a pay() method, but each implements the logic differently. It helps write flexible code that depends on behavior instead of concrete types.`,
  class: `A class in JavaScript is a template for creating objects. It groups constructor logic and methods together. Under the hood, class methods live on the prototype, so classes are mostly cleaner syntax over JavaScript's prototype-based object model.`,
  constructor: `A constructor is the function that runs when a new object is created. In a class, constructor() initializes properties. In older JavaScript, constructor functions were called with new. The purpose is to set up the object's initial state.`,
  object: `An object is a collection of key-value pairs. Values can be primitives, arrays, other objects, or functions. Objects are reference types, so assigning an object to another variable copies the reference, not the whole object.`,
  'static dynamic typing': `A statically typed language checks variable types at compile time, while a dynamically typed language checks them at runtime. JavaScript is dynamically typed, so a variable can hold a string now and a number later. TypeScript adds static type checking on top of JavaScript.`,
  'type coercion': `Type coercion is JavaScript automatically converting one type to another. For example, '5' + 1 becomes '51' because + with a string performs string concatenation, while '5' - 1 becomes 4 because - forces numeric conversion. I avoid relying on implicit coercion and use explicit conversion when clarity matters.`,
  'truthy falsy': `Falsy values in JavaScript are false, 0, -0, 0n, '', null, undefined, and NaN. Everything else is truthy, including empty arrays and empty objects. This matters in conditions because if ([]) runs, but if ('') does not.`,
  'spread rest': `Spread expands values, while rest collects values. In arrays and objects, spread copies or combines values, like [...arr] or {...obj}. In function parameters, rest collects remaining arguments into an array, like function sum(...nums).`,
  'optional chaining': `Optional chaining, written as ?., safely accesses nested properties. If the value before ?. is null or undefined, the expression returns undefined instead of throwing. It is useful for optional API data like user?.profile?.name.`,
  'nullish coalescing': `Nullish coalescing, written as ??, gives a fallback only when the left side is null or undefined. It is safer than || when valid falsy values like 0 or '' should be kept. For example, count ?? 0 keeps count if it is 0.`,
  'map filter reduce': `map transforms each array item and returns a new array. filter keeps only items that match a condition. reduce combines the array into a single result such as a sum, object, or grouped structure. All three avoid manual loop bookkeeping and make intent clearer.`,
  'slice splice': `slice returns a shallow copy of part of an array without changing the original. splice changes the original array by adding, removing, or replacing elements. The key difference is immutability: slice is non-mutating, splice mutates.`,
  'set map': `Set stores unique values. Map stores key-value pairs and allows any type as a key. I use Set for uniqueness checks and Map when I need fast lookup with keys that are not limited to strings.`,
  json: `JSON is a text format for representing data, commonly used between frontend and backend. JSON.stringify converts a JavaScript value to a JSON string, and JSON.parse converts a JSON string back to a JavaScript value. JSON supports data, not functions or undefined values.`,
  destructuring: `Destructuring extracts values from arrays or objects into variables. For example, const { name } = user gets user.name, and const [first] = arr gets the first array item. It makes code shorter and clearer when reading structured data.`,
  immutability: `Immutability means not changing existing data directly. Instead, I create a new copy with the updated value. In React this is important because state changes must produce a new reference so React can detect the update and re-render correctly.`,
  iife: `An IIFE is an Immediately Invoked Function Expression. It runs as soon as it is defined. Before block scope and modules were common, IIFEs were used to create private scope and avoid polluting the global namespace.`,
  memoization: `Memoization caches the result of an expensive function for the same inputs. If the function is called again with the same arguments, it returns the cached result instead of recalculating. It is useful for recursive problems and expensive pure calculations.`,
  callback: `A callback is a function passed into another function to run later. It is common in asynchronous code and event handling. The downside is that nested callbacks can become hard to read, which is why promises and async/await are often preferred.`,
  'promise all': `Promise.all runs multiple promises in parallel and resolves when all of them succeed. If any promise rejects, the whole Promise.all rejects. Promise.allSettled waits for every promise and returns each result as fulfilled or rejected, which is useful when partial success is acceptable.`,
  'fetch axios': `fetch is the browser's built-in API for HTTP requests. Axios is a library with conveniences like automatic JSON handling, request/response interceptors, and easier error handling. I use fetch for simple cases and Axios when the project benefits from interceptors or shared configuration.`,
  dom: `The DOM is the browser's object representation of an HTML document. JavaScript can read and update DOM nodes to change content, styles, attributes, and event behavior. Direct DOM manipulation is normal in vanilla JavaScript, but in React I usually let React manage DOM updates.`,
  'event propagation': `Event propagation is how an event moves through the DOM. It has capturing, target, and bubbling phases. In bubbling, the event moves from the target element up to ancestors. stopPropagation stops it from continuing upward.`,
  'event delegation': `Event delegation attaches one event listener to a parent instead of many listeners on child elements. Because events bubble up, the parent can inspect event.target and handle child interactions. It is efficient for dynamic lists because newly added children work automatically.`,
  storage: `localStorage and sessionStorage store key-value strings in the browser. localStorage persists until cleared, while sessionStorage lasts for the browser tab session. They are useful for non-sensitive preferences, but not ideal for secrets because JavaScript can read them if XSS happens.`,
  xss: `XSS, or Cross-Site Scripting, happens when attacker-controlled script runs in a user's browser. Prevention includes escaping output, sanitizing HTML, avoiding unsafe innerHTML, using Content Security Policy, and never trusting user input.`,
  csrf: `CSRF tricks a logged-in browser into sending an unwanted request to another site. Common protection includes SameSite cookies, CSRF tokens, checking origin/referer headers, and avoiding state-changing GET requests.`,
  rest: `REST is an API style where resources are represented by URLs and actions are expressed with HTTP methods. GET reads, POST creates, PUT or PATCH updates, and DELETE removes. Good REST APIs use clear resource names, proper status codes, and predictable request/response shapes.`,
  'http methods': `GET retrieves data and should not change server state. POST creates or triggers an action. PUT usually replaces a resource, PATCH partially updates it, and DELETE removes it. OPTIONS is used by browsers for CORS preflight checks.`,
  'status codes': `HTTP status codes describe the result of a request. 200 means success, 201 means created, 400 means bad request, 401 means unauthenticated, 403 means forbidden, 404 means not found, and 500 means server error.`,
  'query params': `Query parameters are used for optional filters, sorting, searching, and pagination, like ?page=2&search=react. Path parameters identify a specific resource, like /users/123. I use path params for identity and query params for options.`,
  mongoose: `Mongoose is an ODM for MongoDB. It lets me define schemas, models, validation, middleware, and query helpers. It gives structure to MongoDB documents while still storing data in collections as BSON documents.`,
  mongodb: `MongoDB is a NoSQL document database. Data is stored as flexible JSON-like documents inside collections. It works well when data is naturally document-shaped and when I need flexible schemas, indexing, aggregation, and horizontal scaling.`,
  aggregation: `MongoDB aggregation processes documents through pipeline stages. Common stages are $match for filtering, $group for grouping, $project for shaping fields, $sort for ordering, and $lookup for joining collections. It is useful for reports and computed summaries.`,
  index: `An index is a data structure that speeds up reads by letting the database find documents without scanning the whole collection. The trade-off is extra storage and slower writes because indexes must be updated whenever data changes.`,
  authentication: `Authentication verifies who the user is, usually with credentials like email and password. Authorization checks what that authenticated user is allowed to do. Login proves identity; permissions decide access.`,
  authorization: `Authorization decides whether an authenticated user can access a resource or perform an action. For example, an admin can delete a record, while a normal user might only read it. It should be enforced on the backend, not only in the UI.`,
  cookie: `A cookie is a small value stored by the browser and sent automatically with matching requests. HttpOnly cookies are safer for tokens because JavaScript cannot read them. SameSite and Secure attributes help reduce CSRF and transport risks.`,
  session: `A session stores login state on the server and gives the browser a session ID, usually in a cookie. The server looks up the session on each request. This is different from JWT-based stateless authentication, where the token itself carries signed claims.`,
  hashing: `Hashing is one-way transformation. Passwords should be hashed with slow algorithms like bcrypt, scrypt, or Argon2, plus a salt. Unlike encryption, hashing is not meant to be reversed.`,
  encryption: `Encryption transforms data so it can be decrypted later with a key. It protects confidentiality for data in transit or at rest. Hashing is different because hashes are one-way and used for verification, especially passwords.`,
  'rate limiting': `Rate limiting restricts how many requests a client can make in a period of time. It protects APIs from brute force attacks, scraping, and accidental overload. Common strategies use IP, user ID, route, and time window.`,
  websocket: `WebSocket creates a persistent two-way connection between client and server. Unlike normal HTTP request-response, either side can send messages at any time. It is useful for chat, live notifications, dashboards, and multiplayer features.`,
  'react router': `React Router handles client-side navigation in React. It maps URLs to components without a full page reload. Dynamic params read values from the path, nested routes render inside an Outlet, and navigation can happen through Link or programmatic navigate.`,
  'props state': `Props are inputs passed from a parent component to a child. State is data owned by a component that can change over time. Props should be treated as read-only, while state is updated through its setter or state management logic.`,
  'props drilling': `Props drilling means passing data through multiple layers of components that don't use it directly, just to reach a deeper child. For small cases it is fine, but for widely shared data I use Context or a state management library.`,
  'controlled component': `A controlled component gets its value from React state and updates through onChange. This gives React full control over the form input, which makes validation, formatting, and conditional UI easier.`,
  'pure component': `A pure component renders the same output for the same props and state. In React, memoization tools like React.memo can skip re-rendering pure function components when props have not changed.`,
  'lazy loading': `Lazy loading delays loading code or resources until they are needed. In React, React.lazy with Suspense can split components into separate chunks, improving the initial load time.`,
  ssr: `Server-Side Rendering generates HTML on the server before sending it to the browser. It can improve SEO and first contentful paint, but it adds server complexity and needs hydration on the client.`,
  hydration: `Hydration is when React attaches event handlers and state to HTML that was already rendered on the server. The server markup and client render must match, otherwise hydration warnings or UI inconsistencies can happen.`,
  'memory leak': `A memory leak happens when memory that is no longer needed is still referenced, so the garbage collector cannot free it. In JavaScript and Node, common causes include forgotten timers, event listeners, global caches, and closures holding large objects.`,
  'garbage collection': `Garbage collection automatically frees memory for objects that are no longer reachable. JavaScript mainly uses reachability: if nothing can access an object from the roots, it can be collected. It reduces manual memory management but does not prevent leaks caused by lingering references.`,
  'static dynamic memory': `Static memory is allocated with a known size and lifetime, while dynamic memory is allocated during runtime as needed. Dynamic allocation is flexible but must be managed carefully in languages with manual memory control; in JavaScript the garbage collector handles most cleanup.`,
  'linear non linear': `Linear data structures store elements in sequence, such as arrays, linked lists, stacks, and queues. Non-linear structures store relationships in hierarchy or networks, such as trees and graphs. The choice depends on access patterns and relationships in the data.`,
  matrix: `A matrix is a two-dimensional array arranged in rows and columns. It is used for grids, images, graphs, and dynamic programming tables. Access by row and column is O(1), but traversal usually visits every cell, so it is O(rows * columns).`,
  string: `A string is a sequence of characters. Common operations include traversal, reversal, frequency counting, substring search, anagram checks, and palindrome checks. Many string problems become easier with two pointers, hash maps, or sliding windows.`,
  palindrome: `A palindrome reads the same forward and backward. I usually check it with two pointers: one from the start and one from the end, moving inward while characters match. That gives O(n) time and O(1) extra space.`,
  anagram: `Two strings are anagrams if they contain the same characters with the same frequencies. A frequency map solves it in O(n) time. For fixed lowercase English letters, an array of size 26 is enough.`,
  'load factor': `Load factor in a hash table is the ratio of stored elements to bucket capacity. When it gets too high, collisions increase and performance drops. Hash tables resize and rehash to keep operations close to O(1).`,
  'collision': `A hash collision happens when different keys map to the same bucket. Chaining stores multiple values in a bucket, often as a list. Open addressing searches for another empty slot using probing strategies like linear or quadratic probing.`,
  'bfs dfs': `BFS explores a graph level by level using a queue. It finds the shortest path in an unweighted graph. DFS explores as deep as possible using recursion or a stack, and is useful for cycle detection, connected components, and topological-style traversals.`,
  'dijkstra': `Dijkstra's algorithm finds the shortest path from a source to all reachable nodes in a graph with non-negative edge weights. It uses a priority queue to always expand the current cheapest node. With an adjacency list and heap, the complexity is usually O((V + E) log V).`,
  'avl tree': `An AVL tree is a self-balancing Binary Search Tree. After insertions or deletions, it uses rotations to keep the height difference between left and right subtrees at most one. That keeps search, insert, and delete at O(log n).`,
  'red black tree': `A Red-Black Tree is a self-balancing BST that uses color rules to keep height controlled. It is less strictly balanced than AVL, so inserts and deletes can be faster in practice, while still keeping O(log n) operations.`,
  'priority queue': `A priority queue removes elements by priority instead of insertion order. It is commonly implemented with a heap. It is used in Dijkstra's algorithm, task scheduling, and finding top-k elements.`,
});

const ALIASES = [
  { re: /\bnode\.?js\b|\bwhat\s+is\s+node\b/i, key: 'nodejs' },
  { re: /\breact\.?js\b|\bwhat\s+is\s+react\b|\breact\b/i, key: 'react' },
  { re: /\bjavascript\b|\bwhat\s+is\s+js\b|(?<![.\w])js(?![.\w])/i, key: 'javascript' },
  { re: /\bencapsulation\b/i, key: 'encapsulation' },
  { re: /\babstraction\b/i, key: 'abstraction' },
  { re: /\binheritance\b/i, key: 'inheritance' },
  { re: /\bpolymorphism\b/i, key: 'polymorphism' },
  { re: /\bclass(es)?\b|\bclass\s+object\b/i, key: 'class' },
  { re: /\bconstructor\b/i, key: 'constructor' },
  { re: /\bobject\b|\bobjects\b/i, key: 'object' },
  { re: /\bstatically\b|\bdynamically\s+typed|\bstatic\s+typing|\bdynamic\s+typing/i, key: 'static dynamic typing' },
  { re: /\btype\s*coercion\b|\bimplicit\s*coercion\b|\btype\s*casting\b/i, key: 'type coercion' },
  { re: /\btruthy\b|\bfalsy\b|\bfalse\s*values?\b/i, key: 'truthy falsy' },
  { re: /\bspread\b|\brest\s*operator\b|\.\.\./i, key: 'spread rest' },
  { re: /\boptional\s*chaining\b|\?\./i, key: 'optional chaining' },
  { re: /\bnullish\b|\?\?/i, key: 'nullish coalescing' },
  { re: /\bmap\b.*\bfilter\b|\bfilter\b.*\breduce\b|\breduce\b|\barray\s*methods?\b/i, key: 'map filter reduce' },
  { re: /\bslice\b|\bsplice\b/i, key: 'slice splice' },
  { re: /\bset\b.*\bmap\b|\bmap\b.*\bset\b|\bweakmap\b|\bweakset\b/i, key: 'set map' },
  { re: /\bjson\b|\bstringify\b|\bparse\b/i, key: 'json' },
  { re: /\bdestructur/i, key: 'destructuring' },
  { re: /\bimmutab|\bfreeze\b|\bseal\b/i, key: 'immutability' },
  { re: /\biife\b|immediately\s*invoked/i, key: 'iife' },
  { re: /\bmemoization\b|\bmemoisation\b/i, key: 'memoization' },
  { re: /\bcallback\b|\bcallback\s*hell\b/i, key: 'callback' },
  { re: /\bpromise\.all\b|\ballsettled\b|\bpromise\.race\b|\bpromise\.any\b/i, key: 'promise all' },
  { re: /\bfetch\b|\baxios\b|\binterceptor/i, key: 'fetch axios' },
  { re: /\bdom\b|\bdocument\b|\bwindow\b|\bbom\b/i, key: 'dom' },
  { re: /\bevent\s*propagation\b|\bbubbling\b|\bcapturing\b|\bstoppropagation\b/i, key: 'event propagation' },
  { re: /\bevent\s*delegation\b/i, key: 'event delegation' },
  { re: /\blocalstorage\b|\bsessionstorage\b|\bbrowser\s*storage\b/i, key: 'storage' },
  { re: /\bxss\b|cross.?site\s*scripting/i, key: 'xss' },
  { re: /\bcsrf\b/i, key: 'csrf' },
  { re: /\brest\s*api\b|\brest\b|\bapi\s*design\b/i, key: 'rest' },
  { re: /\bhttp\s*methods?\b|\bget\b.*\bpost\b|\bput\b.*\bpatch\b|\boptions\b/i, key: 'http methods' },
  { re: /\bstatus\s*codes?\b|\b401\b|\b403\b|\b404\b|\b500\b/i, key: 'status codes' },
  { re: /\bquery\s*params?\b|\bpath\s*params?\b|\bparams\b/i, key: 'query params' },
  { re: /\bmongoose\b|\bodm\b/i, key: 'mongoose' },
  { re: /\bmongodb\b|\bmongo\b|\bcollection\b|\bdocument\b/i, key: 'mongodb' },
  { re: /\baggregation\b|\bpipeline\b|\blookup\b|\bgroup\b/i, key: 'aggregation' },
  { re: /\bindex(es)?\b|\bindexing\b/i, key: 'index' },
  { re: /\bauthentication\b|\blogin\b|\btoken\b/i, key: 'authentication' },
  { re: /\bauthorization\b|\bpermission\b|\baccess\s*control\b/i, key: 'authorization' },
  { re: /\bcookie\b|\bhttponly\b|\bsamesite\b/i, key: 'cookie' },
  { re: /\bsession\b|\bsessions\b/i, key: 'session' },
  { re: /\bhashing\b|\bcrypt\b|\bbcrypt\b|\bsalt\b/i, key: 'hashing' },
  { re: /\bencryption\b|\bdecrypt\b|\bssl\b|\btls\b|\bhttps\b/i, key: 'encryption' },
  { re: /\brate\s*limit/i, key: 'rate limiting' },
  { re: /\bwebsocket\b|\bsocket\b|\breal.?time\b/i, key: 'websocket' },
  { re: /\breact\s*router\b|\boutlet\b|\bnavigate\b|\brouting\b/i, key: 'react router' },
  { re: /\bprops\b.*\bstate\b|\bstate\b.*\bprops\b|\bprops\b|\bstate\b/i, key: 'props state' },
  { re: /\bprops\s*drilling\b/i, key: 'props drilling' },
  { re: /\bcontrolled\s*component\b/i, key: 'controlled component' },
  { re: /\bpure\s*component\b|\breact\.memo\b/i, key: 'pure component' },
  { re: /\blazy\s*loading\b|\bcode\s*splitting\b/i, key: 'lazy loading' },
  { re: /\bssr\b|\bserver.?side\s*rendering\b/i, key: 'ssr' },
  { re: /\bhydration\b/i, key: 'hydration' },
  { re: /\bmemory\s*leak\b/i, key: 'memory leak' },
  { re: /\bgarbage\s*collection\b|\bgarbage\s*collector\b/i, key: 'garbage collection' },
  { re: /\bstatic\s*memory\b|\bdynamic\s*memory\b|\bmemory\s*allocation\b/i, key: 'static dynamic memory' },
  { re: /\blinear\b.*\bnon.?linear\b|\bnon.?linear\b.*\blinear\b/i, key: 'linear non linear' },
  { re: /\bmatrix\b|\b2d\s*array\b/i, key: 'matrix' },
  { re: /\bstring\b|\bchar(acter)?\b|\butf-?8\b|\bascii\b/i, key: 'string' },
  { re: /\bpalindrome\b/i, key: 'palindrome' },
  { re: /\banagram\b/i, key: 'anagram' },
  { re: /\bload\s*factor\b/i, key: 'load factor' },
  { re: /\bcollision\b|\bquadratic\s*probing\b|\blinear\s*probing\b/i, key: 'collision' },
  { re: /\bbfs\b|\bdfs\b|\bbreadth\b|\bdepth\s*first\b/i, key: 'bfs dfs' },
  { re: /\bdijkstra\b/i, key: 'dijkstra' },
  { re: /\bavl\b/i, key: 'avl tree' },
  { re: /\bred.?black\b/i, key: 'red black tree' },
  { re: /\bpriority\s*queue\b/i, key: 'priority queue' },
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
  const cleanedQuestion = question
    .replace(/\?$/, '')
    .replace(/\s*[-–—]\s*(need clarity|clarity needed|learn more|check deeper|practical)$/i, '')
    .trim();

  if (/difference|vs\.?|versus|v\/s/.test(q)) {
    return `${cleanedQuestion} is a comparison of two related ideas. The correct way to understand it is by separating meaning, behavior, and use-case: one side solves a specific problem or behaves in one way, while the other has different rules, trade-offs, or runtime behavior. In ${topic}, the practical difference matters because choosing the wrong option can affect correctness, readability, performance, or maintainability.`;
  }

  if (/what is|define|explain|brief/.test(q)) {
    return `${cleanedQuestion} refers to a core concept in ${topic}. It describes a specific behavior, structure, or pattern used to solve a problem in that area. The important points are what it does, how it behaves at runtime, where it is used, and what limitation or trade-off it has. A clear answer should connect the definition with a small real use-case instead of only naming the term.`;
  }

  if (/how (do|does|to)|working|work/.test(q)) {
    return `${cleanedQuestion} works as a sequence of steps. First there is an input or trigger, then the underlying mechanism processes it, and finally it produces an output, state change, or side effect. In ${topic}, the important part is understanding the order of operations and the conditions that change the result.`;
  }

  if (/time complexity|space complexity|big ?o|complexity/.test(q) || /complexity|asymptotic/.test(t)) {
    return `The complexity depends on how the input size grows and how many operations are performed. Constant operations are O(1), single scans are O(n), nested scans are often O(n²), divide-and-conquer patterns are often O(log n) or O(n log n), and recursion also depends on depth and branching. Space complexity counts extra memory such as arrays, maps, recursion stack, or auxiliary structures.`;
  }

  if (/implement|write|program|code|practical|leetcode|workout/.test(q)) {
    return `The solution starts by identifying the input, output, constraints, and edge cases. A simple brute-force version checks correctness first; then it can be improved using the pattern that fits the problem, such as two pointers, hashing, recursion, sorting, BFS/DFS, or dynamic programming. The final solution should handle empty input, duplicates, boundary indexes, and should state time and space complexity.`;
  }

  if (/advantage|disadvantage|pros|cons|why use|why do we/.test(q)) {
    return `${cleanedQuestion} is useful when it solves the problem more clearly, safely, or efficiently than the alternative. The advantage is usually better structure, performance, maintainability, or developer experience. The disadvantage is the extra complexity, runtime cost, memory use, or the chance of using it where a simpler approach is enough.`;
  }

  if (/type|types of|classification|kinds of/.test(q)) {
    return `The main types in ${topic} are classified by how they store data, how they behave, or what problem they solve. Each type has different operations, strengths, and limitations. The best way to choose between them is to compare access time, insertion/deletion cost, memory usage, ordering, and whether relationships between items matter.`;
  }

  const topicAnswer = {
    javascript:
      'In JavaScript this is connected to runtime behavior, data types, scope, objects, functions, asynchronous execution, or browser APIs. The key is to understand what the engine does, what value is produced, and which edge cases can create unexpected output.',
    mongodb:
      'In MongoDB this is connected to documents, collections, queries, indexes, aggregation, schema design, or operational concerns like replication and sharding. The key is to understand how data is stored and retrieved efficiently for the access patterns you need.',
    react:
      'In React this is connected to component rendering, props, state, hooks, routing, global state, or performance. The key is to understand how data flows through components and how React decides when to render and update the UI.',
    nodejs:
      'In Node.js this is connected to the runtime, event loop, non-blocking I/O, modules, Express middleware, HTTP handling, security, or database communication. The key is to understand request flow and how asynchronous work is handled without blocking the main thread.',
    dsa:
      'In DSA this is connected to choosing the right structure or algorithm for the required operations. The key is to compare time complexity, space complexity, edge cases, and whether the data is ordered, hierarchical, graph-like, or needs fast lookup.',
  }[subject];

  return `${cleanedQuestion} is part of ${topic}. ${topicAnswer}`;
}

function generateAnswer(question, subject, topic) {
  const hit = findConceptAnswer(question, subject);
  if (hit) {
    let core = hit.answer;
    if (/difference|vs\.?|versus/.test(question.toLowerCase())) {
      core += ` The practical choice depends on correctness, readability, and the specific use-case.`;
    }
    if (/implement|write a|code/.test(question.toLowerCase())) {
      core += ` The implementation should handle edge cases and include time and space complexity.`;
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
