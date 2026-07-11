export function formatIdeOutput(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function runJavaScriptInWorker(code) {
  return new Promise((resolve) => {
    const workerSource = `
      function format(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value, null, 2); } catch { return String(value); }
      }

      self.onmessage = async (event) => {
        const logs = [];
        const safeConsole = {
          log: (...args) => logs.push(args.map(format).join(' ')),
          error: (...args) => logs.push(args.map(format).join(' ')),
          warn: (...args) => logs.push(args.map(format).join(' ')),
          info: (...args) => logs.push(args.map(format).join(' ')),
          table: (...args) => logs.push(args.map(format).join(' ')),
        };
        try {
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
          const fn = new AsyncFunction('console', event.data.code);
          const result = await fn(safeConsole);
          self.postMessage({ ok: true, result: format(result), logs });
        } catch (err) {
          self.postMessage({
            ok: false,
            error: err && err.stack ? err.stack : String(err),
            logs,
          });
        }
      };
    `;

    const blob = new Blob([workerSource], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        error: 'Execution stopped after 5 seconds. Check for an infinite loop.',
        logs: [],
      });
    }, 5000);

    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: event.message || 'Runtime error', logs: [] });
    };

    worker.postMessage({ code });
  });
}

export const IDE_MODES = {
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    description: 'Run plain JavaScript in an isolated browser worker.',
    starter: `// Write any JavaScript here.
// Use console.log() for output, or top-level return for a value.

const nums = [4, 9, 2, 17, 6];
const largest = nums.reduce((max, n) => (n > max ? n : max), nums[0]);

console.log('Largest:', largest);
return { nums, largest };`,
  },
  mongodb: {
    id: 'mongodb',
    label: 'MongoDB',
    language: 'javascript',
    description: 'Query sandbox collections: users, products, orders.',
    starter: `// Sandbox collections: db.users, db.products, db.orders
// Always return the query result.

return await db.users
  .find({ status: 'active' })
  .project({ name: 1, email: 1, role: 1, _id: 0 })
  .toArray();`,
  },
  express: {
    id: 'express',
    label: 'Node / Express',
    language: 'javascript',
    description: 'Define routes with the express() helper, then test them.',
    starter: `// Build routes with the express() factory (no real require needed).
const app = express();

app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Asha', role: 'admin' },
    { id: 2, name: 'Ravi', role: 'user' },
  ]);
});

app.get('/users/:id', (req, res) => {
  res.json({ id: Number(req.params.id), name: 'Sample user', role: 'user' });
});

app.post('/users', (req, res) => {
  res.status(201).json({ message: 'User created', payload: req.body });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ide-sandbox' });
});`,
  },
};

const STORAGE_KEY = 'thinkmern_ide_workspace_v2';

function looksLikeJavascriptSnippet(code) {
  return /const nums = \[4, 9, 2, 17, 6\]/.test(code) || /Write any JavaScript here/.test(code);
}

function looksLikeMongoSnippet(code) {
  return /db\.(users|products|orders)/.test(code);
}

function looksLikeExpressSnippet(code) {
  return /express\(\)/.test(code) && /app\.(get|post|put|patch|delete)\(/.test(code);
}

function normalizeModeCode(modeId, savedCode) {
  const starter = IDE_MODES[modeId].starter;
  if (!savedCode || typeof savedCode !== 'string') return starter;

  if (modeId === 'mongodb' && looksLikeJavascriptSnippet(savedCode) && !looksLikeMongoSnippet(savedCode)) {
    return starter;
  }
  if (modeId === 'express' && looksLikeJavascriptSnippet(savedCode) && !looksLikeExpressSnippet(savedCode)) {
    return starter;
  }
  if (modeId === 'javascript' && looksLikeMongoSnippet(savedCode) && !looksLikeJavascriptSnippet(savedCode)) {
    return starter;
  }

  return savedCode;
}

export function loadIdeWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return {
      ...saved,
      code: {
        javascript: normalizeModeCode('javascript', saved?.code?.javascript),
        mongodb: normalizeModeCode('mongodb', saved?.code?.mongodb),
        express: normalizeModeCode('express', saved?.code?.express),
      },
    };
  } catch {
    return null;
  }
}

export function saveIdeWorkspace(workspace) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
