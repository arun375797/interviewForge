const vm = require('vm');

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

const BLOCKED_CODE_PATTERNS = [
  /\bconstructor\b/i,
  /\b__proto__\b/i,
  /\bprototype\b/i,
  /\bprocess\b/i,
  /\brequire\b/i,
  /\bimport\s*\(/i,
  /\bimport\s+/i,
  /\beval\b/i,
  /\bFunction\b/i,
  /\bglobalThis\b/i,
  /\bglobal\b/i,
  /\bchild_process\b/i,
  /\bfs\b/i,
  /\bmodule\b/i,
  /\bexports\b/i,
  /\bBuffer\b/i,
  /\bfetch\b/i,
  /\bXMLHttpRequest\b/i,
  /\bWebAssembly\b/i,
  /\bProxy\b/i,
  /\bReflect\b/i,
  /\bthis\b/i,
];

let memoryStore = null;

function cloneSampleData() {
  return JSON.parse(JSON.stringify(SAMPLE_DATA));
}

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

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function validateUserCode(code) {
  for (const pattern of BLOCKED_CODE_PATTERNS) {
    if (pattern.test(code)) {
      throw new Error('Code contains blocked keywords or patterns');
    }
  }
}

function getByPath(doc, path) {
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), doc);
}

function matchesValue(fieldValue, condition) {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.$in) return condition.$in.includes(fieldValue);
    if (condition.$ne !== undefined) return fieldValue !== condition.$ne;
    if (condition.$gt !== undefined) return fieldValue > condition.$gt;
    if (condition.$gte !== undefined) return fieldValue >= condition.$gte;
    if (condition.$lt !== undefined) return fieldValue < condition.$lt;
    if (condition.$lte !== undefined) return fieldValue <= condition.$lte;
    if (condition.$exists !== undefined) {
      return condition.$exists ? fieldValue !== undefined : fieldValue === undefined;
    }
    if (condition.$regex) {
      const flags = condition.$options || '';
      return new RegExp(condition.$regex, flags).test(String(fieldValue ?? ''));
    }
  }
  if (Array.isArray(fieldValue) && Array.isArray(condition)) {
    return condition.every((item) => fieldValue.includes(item));
  }
  return fieldValue === condition;
}

function matchesFilter(doc, filter = {}) {
  if (!filter || typeof filter !== 'object') return true;
  if (filter.$or) {
    return filter.$or.some((clause) => matchesFilter(doc, clause));
  }
  if (filter.$and) {
    return filter.$and.every((clause) => matchesFilter(doc, clause));
  }

  return Object.entries(filter).every(([key, value]) => {
    if (key.startsWith('$')) return true;
    return matchesValue(getByPath(doc, key), value);
  });
}

function runAggregate(docs, pipeline = []) {
  let rows = docs.map((doc) => ({ ...doc }));

  for (const stage of pipeline) {
    if (stage.$match) {
      rows = rows.filter((doc) => matchesFilter(doc, stage.$match));
      continue;
    }

    if (stage.$unwind) {
      const field = String(stage.$unwind).replace(/^\$/, '');
      const next = [];
      for (const doc of rows) {
        const value = getByPath(doc, field);
        if (Array.isArray(value)) {
          for (const item of value) {
            next.push({ ...doc, [field]: item });
          }
        } else if (value !== undefined) {
          next.push(doc);
        }
      }
      rows = next;
      continue;
    }

    if (stage.$group) {
      const grouped = new Map();
      for (const doc of rows) {
        const idExpr = stage.$group._id;
        let groupKey;
        if (idExpr === null) groupKey = 'ALL';
        else if (typeof idExpr === 'string' && idExpr.startsWith('$')) {
          groupKey = String(getByPath(doc, idExpr.slice(1)));
        } else {
          groupKey = JSON.stringify(idExpr);
        }

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, { _id: idExpr === null ? null : getByPath(doc, typeof idExpr === 'string' && idExpr.startsWith('$') ? idExpr.slice(1) : '_id') });
        }
        const bucket = grouped.get(groupKey);

        for (const [field, expr] of Object.entries(stage.$group)) {
          if (field === '_id') continue;
          if (expr && expr.$sum === 1) {
            bucket[field] = (bucket[field] || 0) + 1;
          } else if (expr && expr.$sum !== undefined) {
            const sumField =
              typeof expr.$sum === 'string' && expr.$sum.startsWith('$')
                ? getByPath(doc, expr.$sum.slice(1))
                : expr.$sum;
            bucket[field] = (bucket[field] || 0) + (Number(sumField) || 0);
          } else if (expr && expr.$push !== undefined) {
            if (!bucket[field]) bucket[field] = [];
            const pushField =
              typeof expr.$push === 'string' && expr.$push.startsWith('$')
                ? getByPath(doc, expr.$push.slice(1))
                : expr.$push;
            bucket[field].push(pushField);
          } else if (expr && expr.$avg !== undefined) {
            if (!bucket[`__${field}`]) bucket[`__${field}`] = { sum: 0, count: 0 };
            const avgField =
              typeof expr.$avg === 'string' && expr.$avg.startsWith('$')
                ? getByPath(doc, expr.$avg.slice(1))
                : expr.$avg;
            bucket[`__${field}`].sum += Number(avgField) || 0;
            bucket[`__${field}`].count += 1;
          }
        }
      }

      rows = Array.from(grouped.values()).map((bucket) => {
        for (const [key, value] of Object.entries(bucket)) {
          if (key.startsWith('__') && value && typeof value === 'object' && 'sum' in value) {
            const field = key.slice(2);
            bucket[field] = value.count ? value.sum / value.count : 0;
            delete bucket[key];
          }
        }
        return bucket;
      });
      continue;
    }

    if (stage.$project) {
      rows = rows.map((doc) => {
        const projected = {};
        for (const [field, expr] of Object.entries(stage.$project)) {
          if (expr === 1 || expr === true) {
            projected[field] = getByPath(doc, field);
          } else if (expr === 0 || expr === false) {
            continue;
          } else if (typeof expr === 'string' && expr.startsWith('$')) {
            projected[field] = getByPath(doc, expr.slice(1));
          } else {
            projected[field] = expr;
          }
        }
        return projected;
      });
      continue;
    }

    if (stage.$sort) {
      const sortSpec = stage.$sort;
      rows.sort((a, b) => {
        for (const [field, direction] of Object.entries(sortSpec)) {
          const av = getByPath(a, field);
          const bv = getByPath(b, field);
          if (av === bv) continue;
          const cmp = av > bv ? 1 : -1;
          return direction < 0 ? -cmp : cmp;
        }
        return 0;
      });
      continue;
    }

    if (stage.$limit) {
      rows = rows.slice(0, stage.$limit);
    }
  }

  return rows;
}

function createInMemoryCollection(initialDocs) {
  let docs = initialDocs.map((doc) => ({ ...doc }));

  return {
    find(filter = {}) {
      const matched = docs.filter((doc) => matchesFilter(doc, filter));
      return {
        async toArray() {
          return matched.map((doc) => ({ ...doc }));
        },
      };
    },
    async findOne(filter = {}) {
      const doc = docs.find((item) => matchesFilter(item, filter));
      return doc ? { ...doc } : null;
    },
    async countDocuments(filter = {}) {
      return docs.filter((doc) => matchesFilter(doc, filter)).length;
    },
    aggregate(pipeline = []) {
      const rows = runAggregate(docs, pipeline);
      return {
        async toArray() {
          return rows.map((doc) => ({ ...doc }));
        },
      };
    },
  };
}

function buildInMemoryDb(store) {
  const db = {};
  for (const key of Object.keys(SAMPLE_DATA)) {
    db[key] = createInMemoryCollection(store[key]);
  }
  return db;
}

function ensureMemoryStore() {
  if (!memoryStore) {
    memoryStore = cloneSampleData();
  }
  return memoryStore;
}

async function ensureSandboxSeeded() {
  ensureMemoryStore();
}

async function resetSandbox() {
  memoryStore = cloneSampleData();
}

function runInSandbox(code, sandbox, timeoutMs, label) {
  validateUserCode(code);
  const context = vm.createContext(sandbox);
  const wrapped = `(async () => { "use strict"; ${code} })()`;
  const script = new vm.Script(wrapped, { filename: `ide-${label}.js` });
  const resultPromise = Promise.resolve(script.runInContext(context, { timeout: timeoutMs }));
  return {
    context,
    result: withTimeout(
      resultPromise,
      timeoutMs,
      `${label} timed out after ${timeoutMs / 1000} seconds`
    ),
  };
}

async function runMongoQuery(code) {
  const store = ensureMemoryStore();
  const logs = [];
  const safeConsole = {
    log: (...args) => logs.push(args.map(formatValue).join(' ')),
    error: (...args) => logs.push(args.map(formatValue).join(' ')),
    warn: (...args) => logs.push(args.map(formatValue).join(' ')),
  };
  const db = buildInMemoryDb(store);

  const { result } = runInSandbox(code, { db, console: safeConsole }, 5000, 'MongoDB query');
  const value = await result;

  return {
    ok: true,
    logs,
    result: formatValue(value),
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

  const { context, result: registrationResult } = runInSandbox(
    code,
    { express: expressApi, console: safeConsole },
    5000,
    'Express code'
  );
  await registrationResult;

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

  context.req = req;
  context.res = res;
  context.handler = matched.handler;
  const handlerScript = new vm.Script('Promise.resolve(handler(req, res))', {
    filename: 'ide-express-handler.js',
  });
  await withTimeout(
    Promise.resolve(handlerScript.runInContext(context, { timeout: 3000 })),
    3000,
    'Route handler timed out after 3 seconds'
  );

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
    collections: Object.keys(SAMPLE_DATA),
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
