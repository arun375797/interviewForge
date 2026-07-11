import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  BookMarked,
  Database,
  FileCode2,
  Play,
  RotateCcw,
  Server,
  TerminalSquare,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SaveToNotebookModal from './SaveToNotebookModal';
import { getIdeMonacoTheme, registerIdeMonacoThemes } from '../utils/ideMonacoTheme';
import {
  IDE_MODES,
  loadIdeWorkspace,
  runJavaScriptInWorker,
  saveIdeWorkspace,
} from '../utils/ideRunner';

const MODE_ICONS = {
  javascript: FileCode2,
  mongodb: Database,
  express: Server,
};

export default function Ide() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const isAdmin = Boolean(user?.isAdmin);
  const [activeMode, setActiveMode] = useState('javascript');
  const [codes, setCodes] = useState(() => {
    const saved = loadIdeWorkspace(userId, isAdmin);
    return {
      javascript: saved?.code?.javascript ?? IDE_MODES.javascript.starter,
      mongodb: saved?.code?.mongodb ?? IDE_MODES.mongodb.starter,
      express: saved?.code?.express ?? IDE_MODES.express.starter,
    };
  });
  const [testMethod, setTestMethod] = useState(() => loadIdeWorkspace(userId, isAdmin)?.testMethod || 'GET');
  const [testPath, setTestPath] = useState(() => loadIdeWorkspace(userId, isAdmin)?.testPath || '/users');
  const [testBody, setTestBody] = useState(
    () => loadIdeWorkspace(userId, isAdmin)?.testBody || '{\n  "name": "New user",\n  "role": "user"\n}'
  );
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState(null);
  const [sandboxInfo, setSandboxInfo] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const mode = IDE_MODES[activeMode];
  const code = codes[activeMode];

  useEffect(() => {
    const saved = loadIdeWorkspace(userId, isAdmin);
    setCodes({
      javascript: saved?.code?.javascript ?? IDE_MODES.javascript.starter,
      mongodb: saved?.code?.mongodb ?? IDE_MODES.mongodb.starter,
      express: saved?.code?.express ?? IDE_MODES.express.starter,
    });
    setTestMethod(saved?.testMethod || 'GET');
    setTestPath(saved?.testPath || '/users');
    setTestBody(saved?.testBody || '{\n  "name": "New user",\n  "role": "user"\n}');
    setResult(null);
    setError('');
  }, [userId, isAdmin]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveIdeWorkspace(
        {
          code: codes,
          testMethod,
          testPath,
          testBody,
        },
        userId,
        isAdmin
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [codes, testMethod, testPath, testBody, userId, isAdmin]);

  useEffect(() => {
    let alive = true;
    api
      .getIdeInfo()
      .then((data) => alive && setSandboxInfo(data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  const hints = useMemo(() => {
    if (!sandboxInfo?.hints) return [];
    if (activeMode === 'mongodb') return sandboxInfo.hints.mongodb || [];
    if (activeMode === 'express') return sandboxInfo.hints.express || [];
    return [];
  }, [sandboxInfo, activeMode]);

  const setCode = (value) => {
    setCodes((prev) => {
      if (prev[activeMode] === value) return prev;
      return { ...prev, [activeMode]: value };
    });
  };

  const resetMode = () => {
    setCode(IDE_MODES[activeMode].starter);
    setResult(null);
    setNotice(`${mode.label} editor reset.`);
  };

  const clearOutput = () => {
    setResult(null);
    setNotice('Output cleared.');
  };

  const resetSandbox = async () => {
    setResetting(true);
    setNotice('');
    try {
      const data = await api.resetIdeSandbox();
      setNotice(data.message || 'Sandbox reset.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  const runCode = async () => {
    setRunning(true);
    setResult(null);
    setError('');
    setNotice('');

    try {
      if (activeMode === 'javascript') {
        const output = await runJavaScriptInWorker(code);
        setResult(output);
      } else if (activeMode === 'mongodb') {
        const output = await api.runIdeCode({ mode: 'mongodb', code });
        setResult(output);
      } else {
        let body = {};
        if (['POST', 'PUT', 'PATCH'].includes(testMethod)) {
          try {
            body = JSON.parse(testBody || '{}');
          } catch {
            throw new Error('Test request body must be valid JSON.');
          }
        }
        const output = await api.runIdeCode({
          mode: 'express',
          code,
          testRequest: {
            method: testMethod,
            path: testPath,
            body,
          },
        });
        setResult(output);
      }
    } catch (err) {
      setResult({ ok: false, error: err.message, logs: [] });
    } finally {
      setRunning(false);
    }
  };

  const switchMode = (modeId) => {
    if (modeId === activeMode) return;
    setActiveMode(modeId);
    setResult(null);
    setError('');
    setNotice('');
  };

  return (
    <div className="animate-fade space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Workspace</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">IDE</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Run JavaScript, MongoDB queries, or Node/Express routes — no starter questions required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(IDE_MODES).map((item) => {
            const Icon = MODE_ICONS[item.id];
            const active = activeMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchMode(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper text-ink hover:bg-paper-2'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-stretch">
        <section className="glass-panel flex flex-col overflow-hidden rounded-3xl">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{mode.label}</p>
              <p className="mt-1 text-xs text-muted">{mode.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2"
              >
                <BookMarked className="h-4 w-4" />
                Save to notebook
              </button>
              <button
                type="button"
                onClick={resetMode}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset editor
              </button>
              {activeMode === 'mongodb' ? (
                <button
                  type="button"
                  onClick={resetSandbox}
                  disabled={resetting}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {resetting ? 'Resetting...' : 'Reset sandbox data'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={runCode}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {running ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>

          {activeMode === 'express' ? (
            <div className="grid gap-3 border-b border-line bg-paper px-4 py-3 sm:grid-cols-[110px_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Method
                </span>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Test path
                </span>
                <input
                  value={testPath}
                  onChange={(e) => setTestPath(e.target.value)}
                  placeholder="/users"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
          ) : null}

          <div className="ide-editor-shell min-h-0 flex-1">
            <Editor
              key={`${activeMode}-${theme}`}
              path={`ide-${activeMode}`}
              height="100%"
              language={mode.language}
              theme={getIdeMonacoTheme(theme)}
              beforeMount={registerIdeMonacoThemes}
              value={code}
              onChange={(value) => setCode(value ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4 xl:min-h-0 xl:self-stretch">
          {activeMode === 'mongodb' && sandboxInfo ? (
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Sandbox data</p>
              <p className="mt-2 text-sm text-muted">
                Collections: <span className="font-mono text-ink">{sandboxInfo.collections.join(', ')}</span>
              </p>
              <div className="mt-3 space-y-2">
                {Object.entries(sandboxInfo.sampleSchemas).map(([name, schema]) => (
                  <div key={name} className="rounded-xl bg-paper-2 px-3 py-2 text-xs">
                    <span className="font-mono font-semibold text-ink">db.{name}</span>
                    <span className="mt-1 block font-mono text-muted">{schema}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeMode === 'express' ? (
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Request body</p>
              <p className="mt-2 text-xs text-muted">Used for POST, PUT, and PATCH test requests.</p>
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                spellCheck={false}
                className="ide-express-body mt-3 min-h-[140px] w-full rounded-xl border border-line p-3 font-mono text-xs leading-5 outline-none focus:border-accent"
              />
            </div>
          ) : null}

          {hints.length ? (
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Examples</p>
              <div className="mt-3 space-y-2">
                {hints.map((hint) => (
                  <pre key={hint} className="overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                    {hint}
                  </pre>
                ))}
              </div>
            </div>
          ) : null}

          <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-2xl p-4 xl:overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-muted" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Output</p>
              </div>
              <button
                type="button"
                onClick={clearOutput}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-paper-2"
              >
                Clear
              </button>
            </div>

            {result ? (
              <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
                {result.logs?.length ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Console</p>
                    <pre className="max-h-40 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {result.logs.join('\n')}
                    </pre>
                  </div>
                ) : null}

                {result.routes?.length ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Registered routes</p>
                    <pre className="max-h-32 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {result.routes.join('\n')}
                    </pre>
                  </div>
                ) : null}

                {result.response ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-accent">HTTP response</p>
                    <pre className="max-h-52 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {`Status: ${result.response.status}\n\n${JSON.stringify(result.response.body, null, 2)}`}
                    </pre>
                  </div>
                ) : null}

                {result.ok && result.result !== undefined ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-accent">Returned value</p>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {result.result}
                    </pre>
                  </div>
                ) : null}

                {!result.ok ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-rose-700">Error</p>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {result.error}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-paper-2 p-3 text-sm text-muted">
                {activeMode === 'javascript'
                  ? 'Run JavaScript to see console logs and returned values.'
                  : activeMode === 'mongodb'
                    ? 'Run a MongoDB query against the sandbox collections.'
                    : 'Register routes, choose a method/path, then run to simulate a request.'}
              </p>
            )}
          </div>
        </aside>
      </div>

      <SaveToNotebookModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        code={code}
        modeLabel={mode.label}
        language={mode.language}
      />
    </div>
  );
}
