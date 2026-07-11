import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Timer,
  Play,
  Square,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import AnswerContent from './AnswerContent';
import { MOCK_RATINGS } from '../utils/learningConstants';
import RatingButtons from './RatingButtons';

const PRESET_MINUTES = [5, 10, 15, 20, 30];
const BATCH_SIZE = 80;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function questionId(q) {
  return String(q._id || q.id);
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Mock() {
  const [phase, setPhase] = useState('setup');
  const [subject, setSubject] = useState('javascript');
  const [minutes, setMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState('');
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [seen, setSeen] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionLog, setSessionLog] = useState([]);
  const [pendingRating, setPendingRating] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [notes, setNotes] = useState('');
  const endAtRef = useRef(0);
  const tickRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const endSession = useCallback(() => {
    clearTick();
    setPhase('ended');
    setSecondsLeft(0);
  }, []);

  useEffect(() => () => clearTick(), []);

  const fetchShuffledBatch = async (excludeIds) => {
    const exclude = excludeIds?.length ? excludeIds.join(',') : undefined;
    const { items } = await api.getRandomBatch({
      subject,
      count: BATCH_SIZE,
      exclude,
    });
    return shuffle(items || []);
  };

  const beginTimer = (mins) => {
    setSecondsLeft(mins * 60);
    endAtRef.current = Date.now() + mins * 60 * 1000;
    clearTick();
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) endSession();
    }, 250);
  };

  const start = async () => {
    const mins = customMinutes !== '' ? Number(customMinutes) : Number(minutes);
    if (!subject) {
      setError('Select a language / subject.');
      return;
    }
    if (!mins || mins < 1 || mins > 120) {
      setError('Enter a time between 1 and 120 minutes.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      seenIdsRef.current = new Set();
      setSessionLog([]);
      const items = await fetchShuffledBatch([]);
      if (!items.length) throw new Error('No questions found for this subject.');

      seenIdsRef.current.add(questionId(items[0]));
      setDeck(items);
      setIndex(0);
      setReveal(false);
      setPendingRating(false);
      setFollowUps([]);
      setShowFollowUps(false);
      setNotes('');
      setSeen(1);
      setPhase('running');
      beginTimer(mins);
    } catch (err) {
      setError(err.message || 'Could not start mock session');
    } finally {
      setLoading(false);
    }
  };

  const stopEarly = () => endSession();

  const loadFollowUps = async (q) => {
    try {
      const data = await api.getFollowUps(q._id);
      setFollowUps(data.followUps || []);
      setShowFollowUps(true);
    } catch {
      setFollowUps([]);
    }
  };

  const rateAndNext = async (rating) => {
    const q = deck[index];
    if (!q) return;

    setSessionLog((prev) => [
      ...prev,
      {
        questionId: q._id,
        question: q.question,
        topic: q.topic,
        rating,
        notes: notes.trim(),
      },
    ]);

    try {
      await api.submitReview(q._id, rating);
    } catch {
      /* non-blocking */
    }

    setPendingRating(false);
    setNotes('');
    setShowFollowUps(false);
    setFollowUps([]);
    await nextQuestion();
  };

  const nextQuestion = async () => {
    if (nextLoading) return;

    if (index < deck.length - 1) {
      const nextIdx = index + 1;
      seenIdsRef.current.add(questionId(deck[nextIdx]));
      setIndex(nextIdx);
      setReveal(false);
      setSeen((n) => n + 1);
      return;
    }

    setNextLoading(true);
    setError('');
    try {
      const exclude = [...seenIdsRef.current];
      const fresh = await fetchShuffledBatch(exclude);
      if (!fresh.length) {
        seenIdsRef.current = new Set();
        const reshuffled = await fetchShuffledBatch([]);
        if (!reshuffled.length) throw new Error('No more questions available.');
        seenIdsRef.current.add(questionId(reshuffled[0]));
        setDeck(reshuffled);
        setIndex(0);
        setReveal(false);
        setSeen((n) => n + 1);
        return;
      }

      seenIdsRef.current.add(questionId(fresh[0]));
      setDeck(fresh);
      setIndex(0);
      setReveal(false);
      setSeen((n) => n + 1);
    } catch (err) {
      setError(err.message || 'Could not load more questions');
    } finally {
      setNextLoading(false);
    }
  };

  const handleNextClick = () => {
    if (!reveal) {
      setReveal(true);
      return;
    }
    if (!pendingRating) {
      setPendingRating(true);
      loadFollowUps(deck[index]);
    }
  };

  const resetToSetup = () => {
    clearTick();
    setPhase('setup');
    setDeck([]);
    setIndex(0);
    setReveal(false);
    setSeen(0);
    setSecondsLeft(0);
    setSessionLog([]);
    setError('');
    seenIdsRef.current = new Set();
  };

  const question = deck[index];
  const urgent = phase === 'running' && secondsLeft <= 60;
  const accent = SUBJECT_META[subject]?.accent;

  const debrief = {
    confident: sessionLog.filter((s) => ['good', 'easy'].includes(s.rating)).length,
    shaky: sessionLog.filter((s) => s.rating === 'shaky').length,
    blank: sessionLog.filter((s) => ['blank', 'again'].includes(s.rating)).length,
    weak: sessionLog.filter((s) => ['blank', 'shaky', 'again', 'hard'].includes(s.rating)),
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-3xl animate-rise space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Mock interview
          </h1>
          <p className="mt-2 text-sm text-muted">
            Timed session with self-rating, follow-up prompts, and a debrief of weak questions.
          </p>
        </div>

        <div className="glass-panel space-y-6 rounded-2xl p-5 sm:rounded-3xl sm:p-8">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Language / subject
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(SUBJECT_META).map(([key, meta]) => {
                const active = subject === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSubject(key)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line bg-paper text-ink hover:border-ink/40'
                    }`}
                  >
                    <span
                      className="mb-1 block font-mono text-[10px] uppercase tracking-wider opacity-70"
                      style={active ? undefined : { color: meta.accent }}
                    >
                      {meta.short}
                    </span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_MINUTES.map((m) => {
                const active = customMinutes === '' && minutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinutes(m);
                      setCustomMinutes('');
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line bg-paper hover:border-ink/40'
                    }`}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min={1}
                max={120}
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent sm:w-40"
              />
              <span className="text-sm text-muted">minutes (1–120)</span>
            </div>
          </div>

          {error && <p className="text-sm text-rose-700">{error}</p>}

          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
          >
            <Play className="h-4 w-4" />
            {loading ? 'Loading questions…' : 'Start mock'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="mx-auto max-w-3xl animate-rise space-y-6">
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <Timer className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-center font-display text-3xl font-semibold tracking-tight">
            Session debrief
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            {seen} question{seen === 1 ? '' : 's'} in{' '}
            {SUBJECT_META[subject]?.label || subject}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: 'Confident', value: debrief.confident, color: 'text-emerald-700' },
              { label: 'Shaky', value: debrief.shaky, color: 'text-amber-700' },
              { label: 'Blank', value: debrief.blank, color: 'text-rose-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-line bg-paper p-4 text-center">
                <p className={`font-display text-2xl font-semibold tabular-nums ${color}`}>
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>

          {debrief.weak.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold">Review these weak spots</h2>
              <ul className="mt-3 space-y-2">
                {debrief.weak.map((entry) => (
                  <li
                    key={`${entry.questionId}-${entry.rating}`}
                    className="rounded-xl border border-line px-4 py-3 text-sm"
                  >
                    <p className="font-medium">{entry.question}</p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.topic} · rated {entry.rating}
                      {entry.notes ? ` · "${entry.notes}"` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link
              to="/weak-spots"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
            >
              Weak spots dashboard
            </Link>
            <button
              type="button"
              onClick={start}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper"
            >
              <RotateCcw className="h-4 w-4" />
              {loading ? 'Starting…' : 'Run again'}
            </button>
            <button
              type="button"
              onClick={resetToSetup}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-medium"
            >
              Change settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div className="glass-panel flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: accent }}>
            {SUBJECT_META[subject]?.label}
          </span>
          <span className="text-xs text-muted">Question {seen}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-semibold tabular-nums ${
              urgent ? 'bg-rose-100 text-rose-800' : 'bg-ink text-paper'
            }`}
            aria-live="polite"
          >
            <Timer className="h-4 w-4" />
            {formatTime(secondsLeft)}
          </div>
          <button
            type="button"
            onClick={stopEarly}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            <Square className="h-3.5 w-3.5" />
            End
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {question && (
        <div className="glass-panel rounded-2xl p-5 sm:rounded-3xl sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: accent }}>
            {question.topic} · {question.difficulty}
          </p>
          <h2 className="overflow-anywhere mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
            {question.question}
          </h2>

          {!pendingRating && (
            <div className="mt-8 grid gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {reveal ? 'Hide answer' : 'Reveal answer'}
              </button>
              <button
                type="button"
                onClick={handleNextClick}
                disabled={nextLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${nextLoading ? 'animate-spin' : ''}`} />
                {!reveal ? 'Reveal & continue' : 'Rate & next'}
              </button>
            </div>
          )}

          {reveal && !pendingRating && (
            <div className="animate-fade mt-6 rounded-2xl border border-line bg-paper/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Answer</p>
              <div className="mt-3">
                <AnswerContent>{question.answer}</AnswerContent>
              </div>
            </div>
          )}

          {pendingRating && (
            <div className="animate-fade mt-8 space-y-5">
              {showFollowUps && followUps.length > 0 && (
                <div className="rounded-2xl border border-line bg-paper/80 p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                    <MessageCircle className="h-4 w-4" />
                    Follow-up questions
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {followUps.map((f) => (
                      <li key={f} className="text-muted">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">What did you miss? (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="One line note for debrief…"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">How confident were you?</p>
                <RatingButtons ratings={MOCK_RATINGS} onRate={rateAndNext} disabled={nextLoading} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
