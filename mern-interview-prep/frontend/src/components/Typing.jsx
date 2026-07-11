import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, RotateCcw, Trophy, Zap } from 'lucide-react';
import {
  TYPING_CATEGORIES,
  TYPING_DURATIONS,
  TYPING_SNIPPET_COUNTS,
  TYPING_SNIPPET_TOTAL,
  TYPING_STORAGE_KEY,
  loadTypingSnippets,
} from '../utils/typingConstants';
import { useAuth } from '../context/AuthContext';
import { userStorageKey } from '../utils/userStorage';
import {
  calcAccuracy,
  calcWpm,
  countCorrectChars,
  countErrors,
  formatElapsed,
  getCharStatus,
  isSnippetComplete,
  loadTypingStats,
  pickSnippet,
  saveTypingStats,
  updateBestScore,
} from '../utils/typingEngine';

const STATUS_CLASS = {
  correct: 'text-teal-600',
  incorrect: 'bg-rose-500/20 text-rose-700 underline decoration-rose-500',
  current: 'bg-accent/25 text-ink border-b-2 border-accent',
  pending: 'text-muted/50',
};

function formatLineBreak(isLast) {
  return isLast ? null : '↵\n';
}

const TargetText = memo(function TargetText({ target, typed }) {
  const targetLines = target.split('\n');
  const typedLines = typed.split('\n');
  const currentLineIndex = typedLines.length - 1;

  return (
    <div
      className="overflow-anywhere whitespace-pre-wrap break-words font-mono text-sm leading-relaxed sm:text-base"
      aria-hidden
    >
      {targetLines.map((line, lineIdx) => {
        const typedLine = typedLines[lineIdx] ?? '';
        const isLast = lineIdx === targetLines.length - 1;

        if (lineIdx > currentLineIndex) {
          return (
            <span key={lineIdx} className={STATUS_CLASS.pending}>
              {line}
              {formatLineBreak(isLast)}
            </span>
          );
        }

        if (lineIdx < currentLineIndex) {
          const lineCorrect = typedLine === line;
          return (
            <span
              key={lineIdx}
              className={lineCorrect ? STATUS_CLASS.correct : STATUS_CLASS.incorrect}
            >
              {line}
              {formatLineBreak(isLast)}
            </span>
          );
        }

        return (
          <span key={lineIdx}>
            {line.split('').map((char, index) => {
              const status = getCharStatus(line, typedLine, index);
              const display = char === ' ' ? '\u00a0' : char;
              return (
                <span key={index} className={STATUS_CLASS[status]}>
                  {display}
                </span>
              );
            })}
            {formatLineBreak(isLast)}
          </span>
        );
      })}
    </div>
  );
});

export default function Typing() {
  const { user } = useAuth();
  const statsStorageKey = userStorageKey(TYPING_STORAGE_KEY, user?.id, user?.isAdmin);
  const inputRef = useRef(null);
  const typedRef = useRef('');
  const startedAtRef = useRef(null);
  const timerRef = useRef(null);

  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState(60);
  const [snippets, setSnippets] = useState([]);
  const [snippetsLoading, setSnippetsLoading] = useState(true);
  const [snippet, setSnippet] = useState(null);
  const [typed, setTyped] = useState('');
  typedRef.current = typed;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState(() => loadTypingStats(statsStorageKey));

  useEffect(() => {
    setStats(loadTypingStats(statsStorageKey));
  }, [statsStorageKey]);

  useEffect(() => {
    let alive = true;
    setSnippetsLoading(true);
    loadTypingSnippets(category)
      .then((loaded) => {
        if (!alive || !loaded.length) return;
        setSnippets(loaded);
        setSnippet(pickSnippet(loaded, category));
        setTyped('');
        setElapsedMs(0);
        setRunning(false);
        setFinished(false);
        startedAtRef.current = null;
      })
      .finally(() => alive && setSnippetsLoading(false));
    return () => {
      alive = false;
    };
  }, [category]);

  const correctChars = useMemo(
    () => (snippet ? countCorrectChars(snippet.text, typed) : 0),
    [snippet, typed]
  );
  const errors = useMemo(
    () => (snippet ? countErrors(snippet.text, typed) : 0),
    [snippet, typed]
  );
  const wpm = useMemo(() => calcWpm(correctChars, elapsedMs || 1), [correctChars, elapsedMs]);
  const accuracy = useMemo(
    () => calcAccuracy(correctChars, typed.length),
    [correctChars, typed.length]
  );
  const bestWpm = stats[category]?.bestWpm || 0;
  const isCodeCategory = snippet?.category !== 'english';

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishSession = useCallback(
    (finalElapsed, typedValue = typedRef.current) => {
      if (!snippet) return;
      stopTimer();
      setRunning(false);
      setFinished(true);
      const finalCorrect = countCorrectChars(snippet.text, typedValue);
      const elapsed = finalElapsed || elapsedMs || 1;
      const finalWpm = calcWpm(finalCorrect, elapsed);
      setStats((prev) => {
        const next = updateBestScore(prev, category, finalWpm);
        saveTypingStats(statsStorageKey, next);
        return next;
      });
    },
    [category, elapsedMs, snippet, statsStorageKey, stopTimer]
  );

  const resetSession = useCallback(
    (nextSnippet) => {
      if (!snippets.length) return;
      stopTimer();
      startedAtRef.current = null;
      setSnippet(
        nextSnippet ||
          pickSnippet(snippets, category, snippet?.question || snippet?.text)
      );
      setTyped('');
      setElapsedMs(0);
      setRunning(false);
      setFinished(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [category, snippet, snippets, stopTimer]
  );

  const startIfNeeded = useCallback(() => {
    if (startedAtRef.current) return;
    startedAtRef.current = Date.now();
    setRunning(true);
    stopTimer();
    timerRef.current = setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsedMs(ms);
      if (typeof duration === 'number' && ms >= duration * 1000) {
        finishSession(ms);
      }
    }, 1000);
  }, [duration, finishSession, stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if (!snippets.length) return;
    resetSession(pickSnippet(snippets, category));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const onInput = (event) => {
    if (finished || !snippet) return;
    const value = event.target.value;
    startIfNeeded();
    setTyped(value);
    if (duration === 'snippet' && isSnippetComplete(snippet.text, value)) {
      const ms = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      setElapsedMs(ms);
      finishSession(ms, value);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      resetSession();
    }
  };

  const timeLeft =
    typeof duration === 'number' ? Math.max(0, duration * 1000 - elapsedMs) : null;

  if (snippetsLoading || !snippet) {
    return (
      <div className="mx-auto max-w-5xl animate-rise space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-rise space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Code tools</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Typing speed
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Learn while you type. Read the practical interview question, understand the answer, then
          type the full solution to build speed and recall.{' '}
          <span className="text-ink">
            {TYPING_SNIPPET_TOTAL} question-and-answer drills from your thinkMern question bank.
          </span>
        </p>
        <p className="mt-3 max-w-2xl rounded-xl border border-line bg-paper px-3 py-2 font-mono text-xs text-muted">
          Rebuild drills from question bank:{' '}
          <span className="text-ink">cd frontend</span> then{' '}
          <span className="text-ink">npm run generate:typing</span>
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">Category</p>
        <div className="flex flex-wrap gap-2">
          {TYPING_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                category === key ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:bg-paper-2'
              }`}
            >
              {label}
              {key !== 'all' && TYPING_SNIPPET_COUNTS[key] ? (
                <span className="ml-1 text-xs opacity-70">({TYPING_SNIPPET_COUNTS[key]})</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">Duration</p>
        <div className="flex flex-wrap gap-2">
          {TYPING_DURATIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDuration(key)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                duration === key ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:bg-paper-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'WPM', value: running || finished ? wpm : '—', icon: Zap },
          { label: 'Accuracy', value: running || finished ? `${accuracy}%` : '—', icon: Keyboard },
          {
            label: typeof duration === 'number' ? 'Time left' : 'Elapsed',
            value:
              running || finished
                ? typeof duration === 'number'
                  ? formatElapsed(timeLeft)
                  : formatElapsed(elapsedMs)
                : '—',
            icon: Keyboard,
          },
          { label: 'Best WPM', value: bestWpm || '—', icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
              {snippet.category} · {snippet.topic || snippet.label}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">
              {snippet.question || snippet.label}
            </h2>
            {snippet.explanation ? (
              <p className="mt-3 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-muted">
                <span className="font-medium text-ink">Learn: </span>
                {snippet.explanation}
              </p>
            ) : null}
            {snippet.source ? (
              <p className="mt-2 text-xs text-muted">Source: {snippet.source}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => resetSession()}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2"
          >
            <RotateCcw className="h-4 w-4" />
            Next question
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-[#12100c] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:ring-2 focus-within:ring-accent/60">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1714] px-4 py-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted/70">
              Full answer
            </span>
            <span className="font-mono text-[0.65rem] text-muted/50">
              {snippet.text.split('\n').length} lines
            </span>
          </div>

          <div
            className={`max-h-[20rem] overflow-y-auto border-b border-white/10 p-4 sm:max-h-[28rem] sm:p-5 ${
              isCodeCategory ? 'font-mono' : 'font-sans'
            } text-[#f7f3eb]`}
            onClick={() => inputRef.current?.focus()}
            role="presentation"
          >
            <TargetText target={snippet.text} typed={typed} />
          </div>

          <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1714] px-4 py-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-accent">
              Your input
            </span>
            <span className="font-mono text-[0.65rem] text-muted/50">
              Tab → next question
            </span>
          </div>

          <textarea
            ref={inputRef}
            value={typed}
            onChange={onInput}
            onKeyDown={onKeyDown}
            disabled={finished}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className={`min-h-[16rem] w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-sm leading-relaxed text-[#f7f3eb] outline-none placeholder:text-muted/40 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[20rem] sm:px-5 sm:py-5 sm:text-base sm:leading-7 lg:min-h-[24rem] ${
              isCodeCategory ? '' : 'font-sans'
            }`}
            placeholder={
              finished
                ? 'Session complete — try the next question'
                : 'Type the full answer here…'
            }
          />
        </div>

        {(running || finished) && (
          <p className="mt-3 text-xs text-muted">
            {errors} error{errors === 1 ? '' : 's'} · {typed.length} characters typed
          </p>
        )}
      </div>

      {finished && (
        <div
          className="glass-panel rounded-2xl border border-teal-200 bg-teal-50/80 p-5 sm:rounded-3xl"
          role="status"
        >
          <p className="font-display text-xl font-semibold text-teal-900">Session complete</p>
          <p className="mt-2 text-sm text-teal-900/90">
            You typed at <strong>{wpm} WPM</strong> with <strong>{accuracy}% accuracy</strong>
            {bestWpm === wpm && wpm > 0 ? ' — new personal best for this category!' : '.'}
          </p>
          <button
            type="button"
            onClick={() => resetSession()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
          >
            <RotateCcw className="h-4 w-4" />
            Try another question
          </button>
        </div>
      )}
    </div>
  );
}
