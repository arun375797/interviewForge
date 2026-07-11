import { useCallback, useEffect, useMemo, useState } from 'react';
import { Target, Trash2 } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import { useConfirm } from '../context/ConfirmDialogContext';
import QuestionDetail from './QuestionDetail';

const LANGUAGE_OPTIONS = [
  { key: '', label: 'All languages' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'dsa', label: 'DSA' },
];

function QuestionRow({ q, onOpen, onRemove, removing }) {
  const meta = SUBJECT_META[q.subject];
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-paper px-4 py-3">
      <button type="button" onClick={() => onOpen(q)} className="min-w-0 flex-1 text-left">
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: meta?.accent }}>
          {meta?.label || q.subject} · {q.topic}
        </p>
        <p className="overflow-anywhere mt-1 text-sm font-medium text-ink">{q.question}</p>
      </button>
      <button
        type="button"
        onClick={() => onRemove(q)}
        disabled={removing === q._id}
        title="Remove from weak spots"
        className="shrink-0 rounded-lg border border-line p-2 text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function WeakSpots() {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ all: 0, bySubject: {} });
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [removing, setRemoving] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .getWeakSpots({ subject: subject || undefined })
      .then((data) => {
        setQuestions(data.questions || []);
        setCounts(data.counts || { all: 0, bySubject: {} });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    load();
  }, [load]);

  const removeOne = async (q) => {
    setRemoving(q._id);
    setError('');
    try {
      await api.toggleWeakSpot(q._id);
      setQuestions((prev) => prev.filter((item) => item._id !== q._id));
      setCounts((prev) => {
        const bySubject = { ...prev.bySubject };
        if (bySubject[q.subject]) bySubject[q.subject] = Math.max(0, bySubject[q.subject] - 1);
        return {
          all: Math.max(0, (prev.all || 0) - 1),
          bySubject,
        };
      });
      if (selected?._id === q._id) setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving('');
    }
  };

  const clearAll = async () => {
    if (!questions.length) return;
    const label = subject
      ? SUBJECT_META[subject]?.label || subject
      : 'all languages';
    const confirmed = await confirm({
      title: 'Clear weak spots',
      message: `Remove all weak spots for ${label}?`,
      confirmLabel: 'Clear weak spots',
    });
    if (!confirmed) return;
    setError('');
    try {
      await api.clearWeakSpots({ subject: subject || undefined });
      setQuestions([]);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeLabel = LANGUAGE_OPTIONS.find((lang) => lang.key === subject)?.label || 'All languages';
  const visibleCount = subject ? counts.bySubject?.[subject] ?? questions.length : counts.all ?? questions.length;

  const grouped = useMemo(() => {
    return questions.reduce((acc, q) => {
      if (!acc[q.subject]) acc[q.subject] = [];
      acc[q.subject].push(q);
      return acc;
    }, {});
  }, [questions]);

  if (loading && !questions.length) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Weak spots
          </h1>
          <p className="mt-2 text-sm text-muted">
            Questions you manually mark as weak from any answer view. Add them with{' '}
            <strong className="text-ink">Add to weak</strong> when reviewing an answer.
          </p>
        </div>
        {questions.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear {subject ? activeLabel : 'all'}
          </button>
        )}
      </div>

      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-end">
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

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-accent" />
          <p className="font-display text-2xl font-semibold tabular-nums">{visibleCount}</p>
          <p className="text-sm text-muted">
            weak in {activeLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {!questions.length ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Target className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 font-display text-xl font-semibold">
            {subject ? `No weak spots in ${activeLabel}` : 'No weak spots yet'}
          </p>
          <p className="mt-2 text-sm text-muted">
            {subject
              ? 'Switch language or mark questions as weak from any answer view.'
              : 'Open any question, read the answer, and click Add to weak to save it here.'}
          </p>
        </div>
      ) : subject ? (
        <section>
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: SUBJECT_META[subject]?.accent }}
          >
            {activeLabel}
          </h2>
          <div className="mt-4 space-y-2">
            {questions.map((q) => (
              <QuestionRow
                key={q._id}
                q={q}
                onOpen={setSelected}
                onRemove={removeOne}
                removing={removing}
              />
            ))}
          </div>
        </section>
      ) : (
        Object.entries(grouped).map(([subj, items]) => (
          <section key={subj}>
            <h2
              className="font-display text-xl font-semibold"
              style={{ color: SUBJECT_META[subj]?.accent }}
            >
              {SUBJECT_META[subj]?.label || subj}
            </h2>
            <div className="mt-4 space-y-2">
              {items.map((q) => (
                <QuestionRow
                  key={q._id}
                  q={q}
                  onOpen={setSelected}
                  onRemove={removeOne}
                  removing={removing}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {selected && (
        <QuestionDetail
          question={selected}
          onClose={() => setSelected(null)}
          onUpdated={(q) => {
            setSelected(q);
            if (!q.weakSpot) {
              setQuestions((prev) => prev.filter((item) => item._id !== q._id));
              load();
            } else {
              setQuestions((prev) => prev.map((item) => (item._id === q._id ? q : item)));
            }
          }}
          onDeleted={() => {
            setQuestions((prev) => prev.filter((item) => item._id !== selected._id));
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
