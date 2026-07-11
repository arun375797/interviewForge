const mongoose = require('mongoose');

const SANDBOX_COLLECTIONS = {
  users: 'ide_users',
  products: 'ide_products',
  orders: 'ide_orders',
};

const SAMPLE_DATA = {
  users: [
    { _id: 1, name: 'Asha', email: 'asha@example.com', role: 'admin', age: 28, status: 'active' },
    { _id: 2, name: 'Ravi', email: 'ravi@example.com', role: 'user', age: 22, status: 'active' },
    { _id: 3, name: 'Meera', email: 'meera@example.com', role: 'user', age: 31, status: 'inactive' },
    { _id: 4, name: 'Kiran', email: 'kiran@example.com', role: 'editor', age: 26, status: 'active' },
    { _id: 5, name: 'Dev', email: 'dev@example.com', role: 'user', age: 19, status: 'active' },
  ],
  products: [
    { _id: 101, name: 'Keyboard', category: 'electronics', price: 79, stock: 24, tags: ['office', 'wireless'] },
    { _id: 102, name: 'Notebook', category: 'stationery', price: 12, stock: 120, tags: ['study'] },
    { _id: 103, name: 'Monitor', category: 'electronics', price: 249, stock: 8, tags: ['office', 'display'] },
    { _id: 104, name: 'Pen Pack', category: 'stationery', price: 6, stock: 200, tags: ['study', 'office'] },
    { _id: 105, name: 'Headphones', category: 'electronics', price: 129, stock: 15, tags: ['audio', 'wireless'] },
  ],
  orders: [
    { _id: 501, userId: 1, productIds: [101, 102], total: 91, status: 'delivered', createdAt: '2025-11-02' },
    { _id: 502, userId: 2, productIds: [105], total: 129, status: 'pending', createdAt: '2025-12-10' },
    { _id: 503, userId: 4, productIds: [103, 104], total: 255, status: 'shipped', createdAt: '2026-01-05' },
    { _id: 504, userId: 1, productIds: [102], total: 12, status: 'cancelled', createdAt: '2026-01-18' },
    { _id: 505, userId: 5, productIds: [101, 105], total: 208, status: 'delivered', createdAt: '2026-02-01' },
  ],
};

let seeded = false;

function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getDb() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected');
  }
  return mongoose.connection.db;
}

async function ensureSandboxSeeded() {
  if (seeded) return;
  const db = getDb();
  for (const [key, collectionName] of Object.entries(SANDBOX_COLLECTIONS)) {
    const col = db.collection(collectionName);
    const count = await col.estimatedDocumentCount();
    if (count === 0) {
      await col.insertMany(SAMPLE_DATA[key]);
    }
  }
  seeded = true;
}

async function resetSandbox() {
  const db = getDb();
  for (const collectionName of Object.values(SANDBOX_COLLECTIONS)) {
    await db.collection(collectionName).deleteMany({});
  }
  for (const [key, collectionName] of Object.entries(SANDBOX_COLLECTIONS)) {
    await db.collection(collectionName).insertMany(SAMPLE_DATA[key]);
  }
  seeded = true;
}

function buildDbProxy() {
  const db = getDb();
  const proxy = {};
  for (const [alias, collectionName] of Object.entries(SANDBOX_COLLECTIONS)) {
    proxy[alias] = db.collection(collectionName);
  }
  return proxy;
}

async function runMongoQuery(code) {
  await ensureSandboxSeeded();
  const logs = [];
  const safeConsole = {
    log: (...args) => logs.push(args.map(formatValue).join(' ')),
    error: (...args) => logs.push(args.map(formatValue).join(' ')),
    warn: (...args) => logs.push(args.map(formatValue).join(' ')),
  };
  const db = buildDbProxy();

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction('db', 'console', `"use strict";\n${code}`);
  const result = await Promise.race([
    fn(db, safeConsole),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB query timed out after 5 seconds')), 5000);
    }),
  ]);

  return {
    ok: true,
    logs,
    result: formatValue(result),
  };
}

function createMockRes() {
  const state = { statusCode: 200, body: null, headers: {} };
  const res = {
    status(code) {
      state.statusCode = code;
      return res;
    },
    json(payload) {
      state.body = payload;
      state.headers['content-type'] = 'application/json';
      return res;
    },
    send(payload) {
      state.body = payload;
      return res;
    },
    set(field, value) {
      state.headers[String(field).toLowerCase()] = value;
      return res;
    },
    getState() {
      return state;
    },
  };
  return res;
}

function createMockReq({ method = 'GET', path = '/', body = {}, query = {}, params = {} } = {}) {
  return {
    method: method.toUpperCase(),
    path,
    url: path,
    body,
    query,
    params,
    headers: { 'content-type': 'application/json' },
  };
}

function matchPath(pattern, actual) {
  const patternParts = pattern.split('/').filter(Boolean);
  const actualParts = actual.split('/').filter(Boolean);
  if (patternParts.length !== actualParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    const value = actualParts[i];
    if (part.startsWith(':')) {
      params[part.slice(1)] = value;
    } else if (part !== value) {
      return null;
    }
  }
  return params;
}

async function runExpressCode(code, testRequest = {}) {
  const logs = [];
  const routes = [];
  const safeConsole = {
    log: (...args) => logs.push(args.map(formatValue).join(' ')),
    error: (...args) => logs.push(args.map(formatValue).join(' ')),
    warn: (...args) => logs.push(args.map(formatValue).join(' ')),
  };

  const expressApi = () => {
    const app = {
      get(path, handler) {
        routes.push({ method: 'GET', path, handler });
        return app;
      },
      post(path, handler) {
        routes.push({ method: 'POST', path, handler });
        return app;
      },
      put(path, handler) {
        routes.push({ method: 'PUT', path, handler });
        return app;
      },
      patch(path, handler) {
        routes.push({ method: 'PATCH', path, handler });
        return app;
      },
      delete(path, handler) {
        routes.push({ method: 'DELETE', path, handler });
        return app;
      },
      use(pathOrHandler, maybeHandler) {
        if (typeof pathOrHandler === 'function') {
          routes.push({ method: 'USE', path: '*', handler: pathOrHandler });
        } else {
          routes.push({ method: 'USE', path: pathOrHandler, handler: maybeHandler });
        }
        return app;
      },
    };
    return app;
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction('express', 'console', `"use strict";\n${code}`);
  await Promise.race([
    fn(expressApi, safeConsole),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Express code timed out after 5 seconds')), 5000);
    }),
  ]);

  const method = (testRequest.method || 'GET').toUpperCase();
  const path = testRequest.path || '/';
  const req = createMockReq({
    method,
    path,
    body: testRequest.body || {},
    query: testRequest.query || {},
    params: testRequest.params || {},
  });
  const res = createMockRes();

  let matched = null;
  for (const route of routes) {
    if (route.method !== method && route.method !== 'USE') continue;
    if (route.path === '*') {
      matched = route;
      break;
    }
    const params = matchPath(route.path, path);
    if (params) {
      req.params = { ...req.params, ...params };
      matched = route;
      break;
    }
  }

  if (!matched) {
    return {
      ok: false,
      logs,
      error: `No ${method} route registered for ${path}`,
      routes: routes.map((r) => `${r.method} ${r.path}`),
    };
  }

  await Promise.race([
    matched.handler(req, res),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Route handler timed out after 3 seconds')), 3000);
    }),
  ]);

  const state = res.getState();
  return {
    ok: true,
    logs,
    response: {
      status: state.statusCode,
      headers: state.headers,
      body: state.body,
    },
    routes: routes.map((r) => `${r.method} ${r.path}`),
  };
}

function getSandboxInfo() {
  return {
    collections: Object.keys(SANDBOX_COLLECTIONS),
    sampleSchemas: {
      users: '{ _id, name, email, role, age, status }',
      products: '{ _id, name, category, price, stock, tags[] }',
      orders: '{ _id, userId, productIds[], total, status, createdAt }',
    },
    hints: {
      mongodb: [
        'return await db.users.find({ status: "active" }).toArray()',
        'return await db.orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray()',
        'return await db.products.countDocuments({ category: "electronics" })',
      ],
      express: [
        'const app = express();',
        'app.get("/users", (req, res) => res.json([{ id: 1, name: "Asha" }]));',
        'app.post("/users", (req, res) => res.status(201).json({ created: req.body }));',
      ],
    },
  };
}

module.exports = {
  ensureSandboxSeeded,
  resetSandbox,
  runMongoQuery,
  runExpressCode,
  getSandboxInfo,
  formatValue,
};
