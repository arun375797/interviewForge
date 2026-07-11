export const MERN_TYPING_TEMPLATES = [
  // React
  {
    category: 'react',
    topic: 'Counters & State',
    patterns: [/counter|increment|decrement|increment by 2|on-off toggle/i],
    question: 'Build a React counter that increments and decrements.',
    explanation: 'useState holds the count. Event handlers call the setter with the next value.',
    answer: `import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
      <button type="button" onClick={() => setCount((value) => value - 1)}>
        Decrement
      </button>
    </div>
  );
}`,
  },
  {
    category: 'react',
    topic: 'Todo Apps',
    patterns: [/todo|mark.*complete|completed button|task as completed/i],
    question: 'Implement a todo list where users can add tasks and mark them complete.',
    explanation: 'Store todos in state. Toggle done with map and track completed count separately.',
    answer: `import { useState } from "react";

export default function TodoApp() {
  const [text, setText] = useState("");
  const [todos, setTodos] = useState([]);

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setText("");
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))
    );
  };

  const completedCount = todos.filter((todo) => todo.done).length;

  return (
    <section>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" onClick={addTodo}>Add</button>
      <p>Completed: {completedCount}</p>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <button type="button" onClick={() => toggleTodo(todo.id)}>
              {todo.done ? "Undo" : "Done"}
            </button>
            <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}`,
  },
  {
    category: 'react',
    topic: 'Forms',
    patterns: [/form validation|validation for form|proper form validation|signup input validation/i],
    question: 'Add form validation for a signup form in React.',
    explanation: 'Validate on submit, store field errors in state, and block submit until inputs are valid.',
    answer: `import { useState } from "react";

export default function SignupForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.email.includes("@")) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    console.log("Submitted", form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email ? <p>{errors.email}</p> : null}
      </label>
      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {errors.password ? <p>{errors.password}</p> : null}
      </label>
      <button type="submit">Sign up</button>
    </form>
  );
}`,
  },
  {
    category: 'react',
    topic: 'Hooks',
    patterns: [/useeffect|usecallback|usememo|custom hook|useref/i],
    question: 'Create a custom React hook for debounced search input.',
    explanation: 'useEffect watches the value and updates debounced state after a delay with cleanup.',
    answer: `import { useEffect, useState } from "react";

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!debouncedQuery) return;
    console.log("Search for:", debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}`,
  },
  {
    category: 'react',
    topic: 'Context API',
    patterns: [/context api|create context|provider/i],
    question: 'Share authenticated user data across React components using Context API.',
    explanation: 'Create a context, provide value at the top, and consume it in child components.',
    answer: `import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (nextUser) => setUser(nextUser);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}`,
  },
  {
    category: 'react',
    topic: 'Lists',
    patterns: [/render an array|map the array|pagination|filter/i],
    question: 'Render and filter a list of users in React.',
    explanation: 'Keep the source list in state, derive filtered results, and map them into JSX.',
    answer: `import { useMemo, useState } from "react";

const USERS = [
  { id: 1, name: "Asha", role: "admin" },
  { id: 2, name: "Ravi", role: "user" },
  { id: 3, name: "Maya", role: "user" },
];

export default function UserList() {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(
    () => USERS.filter((user) => user.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <section>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" />
      <ul>
        {filteredUsers.map((user) => (
          <li key={user.id}>{user.name} — {user.role}</li>
        ))}
      </ul>
    </section>
  );
}`,
  },
  {
    category: 'react',
    topic: 'Local Storage',
    patterns: [/local storage|persist the todos|save todos/i],
    question: 'Persist todo items in localStorage in a React app.',
    explanation: 'Read initial state from localStorage and write back whenever todos change.',
    answer: `import { useEffect, useState } from "react";

const STORAGE_KEY = "todos";

export default function PersistentTodos() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}`,
  },

  // Express
  {
    category: 'express',
    topic: 'Server Setup',
    patterns: [/create server|basic server|http server|express app/i],
    question: 'Create a basic Express server on port 3000.',
    explanation: 'Import express, create app, add routes, and listen on a port from env or default.',
    answer: `import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
  },
  {
    category: 'express',
    topic: 'Routing',
    patterns: [/router level|express router|route with a path parameter|api end point/i],
    question: 'Create an Express router with CRUD routes for users.',
    explanation: 'Use express.Router(), define HTTP verbs, and mount the router on /users.',
    answer: `import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([{ id: 1, name: "Asha" }]);
});

router.get("/:id", (req, res) => {
  res.json({ id: Number(req.params.id), name: "Asha" });
});

router.post("/", (req, res) => {
  res.status(201).json({ id: 2, ...req.body });
});

router.delete("/:id", (req, res) => {
  res.status(204).send();
});

export default router;`,
  },
  {
    category: 'express',
    topic: 'Middleware',
    patterns: [/middleware|block all post|block all delete|application level middleware|error handling middleware/i],
    question: 'Write Express middleware to block all POST requests.',
    explanation: 'Middleware runs before routes. Call next() to continue or send a response to stop the chain.',
    answer: `function blockPostRequests(req, res, next) {
  if (req.method === "POST") {
    return res.status(405).json({ error: "POST requests are blocked" });
  }
  next();
}

app.use(blockPostRequests);`,
  },
  {
    category: 'express',
    topic: 'Error Handling',
    patterns: [/error handling middleware|proper error messages/i],
    question: 'Add centralized error handling middleware in Express.',
    explanation: 'Error middleware has four arguments. Send a safe JSON response and log the real error server-side.',
    answer: `app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});`,
  },
  {
    category: 'express',
    topic: 'Static Files',
    patterns: [/express\.static|static file|public folder/i],
    question: 'Serve static files from a public folder in Express.',
    explanation: 'express.static mounts a directory so CSS, images, and built frontend files are served directly.',
    answer: `import path from "node:path";
import express from "express";

const app = express();

app.use(express.static(path.join(process.cwd(), "public")));`,
  },
  {
    category: 'express',
    topic: 'CORS',
    patterns: [/cors|preflight|options/i],
    question: 'Enable CORS for a React frontend in an Express API.',
    explanation: 'Allow the frontend origin and handle OPTIONS preflight requests for non-simple calls.',
    answer: `import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);`,
  },

  // Node.js
  {
    category: 'nodejs',
    topic: 'HTTP Server',
    patterns: [/create a server using http|http server|write head|http get/i],
    question: 'Create a basic HTTP server in Node.js without Express.',
    explanation: 'Use the built-in http module, set headers, and send JSON from the request handler.',
    answer: `import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from Node.js" }));
});

server.listen(3000, () => {
  console.log("HTTP server listening on port 3000");
});`,
  },
  {
    category: 'nodejs',
    topic: 'File System',
    patterns: [/write.*file|read.*file|fs module|delete a file/i],
    question: 'Write the current date and time to a file using the Node.js fs module.',
    explanation: 'Use fs/promises writeFile with UTF-8 encoding for async file writes.',
    answer: `import { writeFile } from "node:fs/promises";

const content = new Date().toISOString();

await writeFile("current-time.txt", content, "utf8");
console.log("File written successfully");`,
  },
  {
    category: 'nodejs',
    topic: 'Streams',
    patterns: [/readstream|create stream|pipe/i],
    question: 'Read a large file using streams and pipe it to the response.',
    explanation: 'Streams process data chunk by chunk and keep memory usage low for large files.',
    answer: `import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

app.get("/download", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  await pipeline(createReadStream("large-file.txt"), res);
});`,
  },
  {
    category: 'nodejs',
    topic: 'Environment Variables',
    patterns: [/environment variable|\.env|process\.env/i],
    question: 'Read configuration from environment variables in Node.js.',
    explanation: 'Never hardcode secrets. Read from process.env and validate required values at startup.',
    answer: `const PORT = Number(process.env.PORT) || 3000;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error("MONGO_URL is required");
}

console.log(\`Starting server on port \${PORT}\`);`,
  },
  {
    category: 'nodejs',
    topic: 'Event Emitter',
    patterns: [/event emitter|child process|worker thread/i],
    question: 'Implement a simple event emitter pattern in Node.js.',
    explanation: 'Listeners subscribe with on and the emitter triggers them with emit.',
    answer: `import { EventEmitter } from "node:events";

const bus = new EventEmitter();

bus.on("ready", () => {
  console.log("Service is ready");
});

bus.emit("ready");`,
  },

  // MongoDB
  {
    category: 'mongodb',
    topic: 'Queries',
    patterns: [/find|query|distinct|aggregate|insert|update/i],
    question: 'Write a MongoDB query to find active users sorted by newest first.',
    explanation: 'Use find with a filter, sort descending on createdAt, and limit the result size.',
    answer: `const users = await db.collection("users")
  .find({ active: true })
  .sort({ createdAt: -1 })
  .limit(20)
  .toArray();`,
  },
  {
    category: 'mongodb',
    topic: 'Aggregation',
    patterns: [/aggregation|group|lookup|\$match|\$group/i],
    question: 'Use an aggregation pipeline to count users by role.',
    explanation: '$match filters documents and $group creates summary counts by role.',
    answer: `const pipeline = [
  { $match: { active: true } },
  { $group: { _id: "$role", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
];

const stats = await db.collection("users").aggregate(pipeline).toArray();`,
  },
  {
    category: 'mongodb',
    topic: 'Updates',
    patterns: [/updatemany|increase the salary|update based on condition/i],
    question: 'Update salaries for HR department employees by 10% in MongoDB.',
    explanation: 'updateMany applies a filter and uses $mul or calculated $set values for bulk updates.',
    answer: `await db.collection("employees").updateMany(
  { department: "HR" },
  [{ $set: { salary: { $multiply: ["$salary", 1.1] } } }]
);`,
  },
  {
    category: 'mongodb',
    topic: 'Mongoose',
    patterns: [/mongoose|schema|populate|odm/i],
    question: 'Define a Mongoose schema for users with validation.',
    explanation: 'Schemas define shape, validation, and timestamps. Models wrap collection operations.',
    answer: `import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);`,
  },
  {
    category: 'mongodb',
    topic: 'Indexing',
    patterns: [/index|compound index|ttl|covered query/i],
    question: 'Create a compound index for email and createdAt in MongoDB.',
    explanation: 'Compound indexes speed up queries that filter or sort on multiple fields together.',
    answer: `await db.collection("users").createIndex(
  { email: 1, createdAt: -1 },
  { name: "email_createdAt_idx" }
);`,
  },

  // English interview answers
  {
    category: 'english',
    topic: 'Interview Communication',
    patterns: [/explain|what is|difference|advantages|why|how/i],
    question: 'Explain how you would answer a technical question in an interview.',
    explanation: 'Use a clear structure: definition, example, trade-off, and when you would use it.',
    answer: `I would start by clarifying the requirement, then explain the concept in simple terms, give one practical example from my project experience, mention the trade-offs, and finish with when I would choose this approach in production.`,
  },
  {
    category: 'english',
    topic: 'System Design',
    patterns: [/scale|cache|load|traffic|design|architecture/i],
    question: 'How would you explain scaling a MERN application in an interview?',
    explanation: 'Mention bottlenecks, caching, horizontal scaling, database indexing, and observability.',
    answer: `I would profile the slow endpoints first, add caching for read-heavy routes, scale the Node layer horizontally behind a load balancer, index the MongoDB queries used in production, and add logging and metrics so we can see failures before users report them.`,
  },
  {
    category: 'english',
    topic: 'Behavioral',
    patterns: [/owned|team|stakeholder|migration|project/i],
    question: 'Describe a strong behavioral interview answer structure.',
    explanation: 'Use situation, action, result, and a lesson learned.',
    answer: `I describe the situation briefly, explain the exact actions I took, quantify the result where possible, and close with what I learned and how I would apply it on the next project.`,
  },
];

export const TOPIC_FILTERS = {
  javascript: {
    subject: 'javascript',
    topics: [/Practical Coding|Array Methods Practical|Closure \(Practical\)|DOM manipulation/i],
  },
  react: {
    subject: 'react',
    topics: [/React Practical Tasks|API Integration|Forms|Hooks|Context/i],
  },
  nodejs: {
    subject: 'nodejs',
    topics: [/Practical Node\.js|Core Modules|HTTP|Streams|EventEmitter/i],
  },
  express: {
    subject: 'nodejs',
    topics: [/Express\.js Basics|Practical Node\.js \/ Express|Middleware|Routing/i],
  },
  mongodb: {
    subject: 'javascript',
    topics: [/MongoDB|Database/i],
    altSubject: 'nodejs',
    altTopics: [/Database, ODM, MongoDB/i],
  },
  english: {
    subject: 'javascript',
    topics: [/Practical|Interview|Communication/i],
    altSubject: 'react',
    altTopics: [/Practical|Basics/i],
  },
};
