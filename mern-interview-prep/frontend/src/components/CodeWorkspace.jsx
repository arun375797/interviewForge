import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Save,
  UploadCloud,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';

function formatOutput(value) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function runInWorker(code) {
  return new Promise((resolve) => {
    const workerSource = `
      function format(value) {
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value, null, 2); } catch { return String(value); }
      }

      self.onmessage = async (event) => {
        const logs = [];
        const safeConsole = {
          log: (...args) => logs.push(args.map(format).join(' ')),
          error: (...args) => logs.push(args.map(format).join(' ')),
          warn: (...args) => logs.push(args.map(format).join(' ')),
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
        error: 'Execution stopped after 3 seconds. Check for an infinite loop.',
        logs: [],
      });
    }, 3000);

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

export default function CodeWorkspace() {
  const { subject, id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrieving, setRetrieving] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('25');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setTimerRunning(false);
    setTimeLeft(0);
    setTimerExpired(false);
    setShowTimeUpPopup(false);
    api
      .getCodeQuestion(id)
      .then((data) => {
        if (!alive) return;
        setQuestion(data);
        setCode(data.codePrompt?.starterCode || '');
        setRunResult(null);
        setShowAnswer(false);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setTimeLeft((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(intervalId);
          setTimerRunning(false);
          setTimerExpired(true);
          setShowTimeUpPopup(true);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  const meta = SUBJECT_META[subject] || SUBJECT_META[question?.subject] || {
    label: subject,
    accent: '#0f766e',
  };

  const expectedOutput = useMemo(
    () => formatOutput(question?.codePrompt?.expectedOutput),
    [question?.codePrompt?.expectedOutput]
  );

  const sampleInput = useMemo(
    () => formatOutput(question?.codePrompt?.sampleInput),
    [question?.codePrompt?.sampleInput]
  );

  const runCode = async () => {
    setRunning(true);
    setRunResult(null);
    setNotice('');
    const result = await runInWorker(code);
    setRunResult(result);
    setRunning(false);
  };

  const startCountdown = () => {
    const minutes = Number(timerMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setTimerRunning(false);
      setTimeLeft(0);
      setTimerExpired(false);
      setShowTimeUpPopup(false);
      return;
    }

    setTimeLeft(Math.ceil(minutes * 60));
    setTimerExpired(false);
    setShowTimeUpPopup(false);
    setTimerRunning(true);
  };

  const resetCountdown = () => {
    setTimerRunning(false);
    setTimeLeft(0);
    setTimerExpired(false);
    setShowTimeUpPopup(false);
  };

  const resetStarter = () => {
    setCode(question?.codePrompt?.starterCode || '');
    setRunResult(null);
    setNotice('Starter code restored.');
  };

  const saveCode = async () => {
    setSaving(true);
    setNotice('');
    try {
      const saved = await api.saveCode(id, code);
      setQuestion((prev) => (prev ? { ...prev, hasSavedCode: saved.hasSavedCode } : prev));
      setNotice('Code saved. It will stay hidden next time until you click Get saved code.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSavedCode = async () => {
    setRetrieving(true);
    setNotice('');
    try {
      const saved = await api.getSavedCode(id);
      if (saved.code) {
        setCode(saved.code);
        setNotice('Saved code loaded into the editor.');
      } else {
        setNotice('No saved code found for this question yet.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRetrieving(false);
    }
  };

  const toggleCompleted = async () => {
    try {
      const updated = await api.toggleCodeCompleted(id);
      setQuestion(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-[520px] rounded-3xl" />
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="font-display text-2xl font-semibold">Could not open code question</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <button
          type="button"
          onClick={() => navigate(`/code/${subject}`)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Code
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade space-y-6">
      {showTimeUpPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="time-up-title"
            className="w-full max-w-sm rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900 shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 id="time-up-title" className="mt-4 font-display text-2xl font-semibold">
              Time up
            </h2>
            <p className="mt-2 text-sm text-rose-800">
              Countdown ended. Stop coding and review your solution.
            </p>
            <button
              type="button"
              onClick={() => setShowTimeUpPopup(false)}
              className="mt-5 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link to="/code" className="hover:text-ink">
              Code
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/code/${subject}`} className="hover:text-ink" style={{ color: meta.accent }}>
              {meta.label}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="max-w-[240px] truncate">{question.codePrompt?.topic}</span>
          </div>
          <h1 className="overflow-anywhere font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {question.codePrompt?.title || question.question}
          </h1>
          <p className="overflow-anywhere mt-2 max-w-3xl text-sm text-muted">{question.codePrompt?.task}</p>
        </div>

        <button
          type="button"
          onClick={toggleCompleted}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium sm:w-auto ${
            question.codeCompleted
              ? 'border-accent bg-teal-50 text-accent'
              : 'border-line bg-paper text-ink hover:bg-paper-2'
          }`}
        >
          {question.codeCompleted ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          {question.codeCompleted ? 'Finished' : 'Mark finished'}
        </button>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <section className="glass-panel overflow-hidden rounded-3xl">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                JavaScript editor
              </p>
              <p className="mt-1 text-xs text-muted">
                Use top-level <span className="font-mono">return</span> or{' '}
                <span className="font-mono">console.log</span> to see output.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {question.hasSavedCode ? (
                <button
                  type="button"
                  onClick={getSavedCode}
                  disabled={retrieving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  {retrieving ? 'Loading...' : 'Get saved code'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetStarter}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={saveCode}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save code'}
              </button>
              <button
                type="button"
                onClick={runCode}
                disabled={running}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {running ? 'Running...' : 'Run code'}
              </button>
            </div>
          </div>

          <div
            className={`border-b px-4 py-3 ${
              timerExpired
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-line bg-paper text-ink'
            }`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    timerExpired ? 'bg-rose-100 text-rose-700' : 'bg-paper-2 text-ink'
                  }`}
                >
                  {timerExpired ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <span className="font-mono text-sm font-semibold">{formatCountdown(timeLeft)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Coding timer</p>
                  <p className={`mt-1 text-xs ${timerExpired ? 'text-rose-800' : 'text-muted'}`}>
                    {timerExpired
                      ? 'Time is up! Stop coding and review your solution.'
                      : timerRunning
                        ? `${formatCountdown(timeLeft)} remaining.`
                        : 'Enter minutes, press Start, and code before the countdown ends.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Minutes
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={timerMinutes}
                    onChange={(e) => {
                      setTimerMinutes(e.target.value);
                      if (timerExpired) setTimerExpired(false);
                      if (showTimeUpPopup) setShowTimeUpPopup(false);
                    }}
                    disabled={timerRunning}
                    aria-label="Timer minutes"
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none focus:border-accent disabled:opacity-60 sm:w-24"
                  />
                </label>
                <button
                  type="button"
                  onClick={startCountdown}
                  disabled={
                    timerRunning ||
                    !Number.isFinite(Number(timerMinutes)) ||
                    Number(timerMinutes) <= 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {timerRunning ? 'Counting...' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={resetCountdown}
                  disabled={!timerRunning && timeLeft === 0 && !timerExpired}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset timer
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="min-h-[360px] w-full resize-y border-0 bg-[#12100c] p-4 font-mono text-sm leading-6 text-[#f7f3eb] outline-none sm:min-h-[460px] lg:min-h-[520px]"
          />
        </section>

        <aside className="min-w-0 space-y-4">
          <div className="glass-panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Question</p>
            <p className="overflow-anywhere mt-2 text-sm font-medium leading-relaxed">{question.question}</p>
            <p className="overflow-anywhere mt-3 text-xs text-muted">{question.codePrompt?.topic}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sample data</p>
            <pre className="mt-3 max-h-52 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
              {sampleInput}
            </pre>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Hidden answer output
              </p>
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-paper-2"
              >
                {showAnswer ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showAnswer ? 'Hide' : 'Show answer'}
              </button>
            </div>
            {showAnswer ? (
              <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                {expectedOutput}
              </pre>
            ) : (
              <p className="mt-3 rounded-xl bg-paper-2 p-3 text-sm text-muted">
                Output is hidden. Solve and run your code first, then reveal it to compare.
              </p>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Run output</p>
            {runResult ? (
              <div className="mt-3 space-y-3">
                {runResult.logs?.length ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Console</p>
                    <pre className="max-h-40 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                      {runResult.logs.join('\n')}
                    </pre>
                  </div>
                ) : null}
                <div>
                  <p className={`mb-1 text-xs font-medium ${runResult.ok ? 'text-accent' : 'text-rose-700'}`}>
                    {runResult.ok ? 'Returned value' : 'Error'}
                  </p>
                  <pre className="max-h-52 overflow-auto rounded-xl bg-paper-2 p-3 text-xs leading-5">
                    {runResult.ok ? runResult.result : runResult.error}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-paper-2 p-3 text-sm text-muted">
                Run your code to see console logs and the returned value here.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
