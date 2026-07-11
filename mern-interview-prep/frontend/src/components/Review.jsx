import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import { useConfirm } from '../context/ConfirmDialogContext';
import AnswerContent from './AnswerContent';
import RatingButtons from './RatingButtons';

const LANGUAGE_OPTIONS = [
  { key: '', label: 'All languages' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'dsa', label: 'DSA' },
];

export default function Review() {
  const confirm = useConfirm();
  const [summary, setSummary] = useState(null);
  const [counts, setCounts] = useState({ all: 0, bySubject: {} });
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [sum, due] = await Promise.all([
        api.getReviewSummary(),
        api.getDueReviews({
          subject: subject || undefined,
          limit: 100,
          mode: showAll ? 'all' : 'due',
        }),
      ]);
      setSummary(sum);
      setCounts(due.counts || { all: 0, bySubject: {} });
      setQueue(due.items || []);
      setIndex(0);
      setReveal(false);
      setDone(!(due.items || []).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, showAll]);

  const question = queue[index];

  const rate = async (rating) => {
    if (!question || submitting) return;
    setSubmitting(true);
    try {
      await api.submitReview(question._id, rating);
      if (index < queue.length - 1) {
        setIndex((i) => i + 1);
        setReveal(false);
      } else {
        setDone(true);
        load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearQueue = async () => {
    const label = subject
      ? SUBJECT_META[subject]?.label || subject
      : 'all languages';
    const confirmed = await confirm({
      title: 'Clear daily review',
      message: `Remove all questions from daily review for ${label}?`,
      confirmLabel: 'Clear review',
    });
    if (!confirmed) return;
    try {
      await api.clearDailyReview({ subject: subject || undefined });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeLabel =
    LANGUAGE_OPTIONS.find((lang) => lang.key === subject)?.label || 'All languages';

  if (loading && !queue.length) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Daily review
          </h1>
          <p className="mt-2 text-sm text-muted">
            Only questions you manually add with <strong className="text-ink">Add to daily review</strong>{' '}
            appear here. Marking covered no longer adds them automatically.
          </p>
        </div>
        {(summary?.inQueue ?? 0) > 0 && (
          <button
            type="button"
            onClick={clearQueue}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear queue
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Due today', value: summary?.dueToday ?? 0 },
          { label: 'Overdue', value: summary?.overdue ?? 0 },
          { label: 'Upcoming', value: summary?.upcoming ?? 0 },
          { label: 'In queue', value: summary?.inQueue ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="glass-panel rounded-2xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block w-full sm:w-56">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Language
            </span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {LANGUAGE_OPTIONS.map((lang) => {
                const count = lang.key ? counts.bySubject?.[lang.key] ?? 0 : counts.all ?? 0;
                return (
                  <option key={lang.key || 'all'} value={lang.key}>
                    {lang.label} ({count})
                  </option>
                );
              })}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                !showAll ? 'border-ink bg-ink text-paper' : 'border-line'
              }`}
            >
              Due now
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                showAll ? 'border-ink bg-ink text-paper' : 'border-line'
              }`}
            >
              All in queue
            </button>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.filter((lang) => lang.key).map((lang) => {
            const count = counts.bySubject?.[lang.key] ?? 0;
            const active = subject === lang.key;
            const meta = SUBJECT_META[lang.key];
            return (
              <button
                key={lang.key}
                type="button"
                onClick={() => setSubject(active ? '' : lang.key)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper hover:border-ink/40'
                }`}
              >
                <span
                  className="font-mono text-[10px] uppercase tracking-wider opacity-80"
                  style={active ? undefined : { color: meta?.accent }}
                >
                  {meta?.short}
                </span>
                <span className="ml-1.5">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {done ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Brain className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            {showAll ? `No questions in ${activeLabel.toLowerCase()} queue` : 'All caught up for now!'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Open any question answer and click <strong>Add to daily review</strong> to build your
            queue.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/learn"
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper"
            >
              Browse questions
            </Link>
            <Link
              to="/flashcards"
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium"
            >
              Flashcards
            </Link>
          </div>
        </div>
      ) : question ? (
        <div className="glass-panel rounded-2xl p-5 sm:rounded-3xl sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p
              className="font-mono text-xs uppercase tracking-[0.18em]"
              style={{ color: SUBJECT_META[question.subject]?.accent }}
            >
              {SUBJECT_META[question.subject]?.label} · {question.topic}
            </p>
            <span className="text-xs text-muted">
              {index + 1} / {queue.length}
            </span>
          </div>

          <h2 className="overflow-anywhere font-display text-2xl font-semibold leading-snug">
            {question.question}
          </h2>

          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="mt-6 rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
          >
            {reveal ? 'Hide answer' : 'Reveal answer'}
          </button>

          {reveal && (
            <div className="animate-fade mt-6 rounded-2xl border border-line bg-paper/80 p-5">
              <AnswerContent>{question.answer}</AnswerContent>
              {question.keyPoints?.length ? (
                <ul className="mt-4 space-y-1 text-sm text-muted">
                  {question.keyPoints.map((p) => (
                    <li key={p} className="flex gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {reveal && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-ink">How well did you remember?</p>
              <RatingButtons onRate={rate} disabled={submitting} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
