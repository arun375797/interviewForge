import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Code2, TerminalSquare } from 'lucide-react';
import { api, SUBJECT_META } from '../api';

const CODE_LANGUAGES = [
  {
    key: 'javascript',
    label: 'JavaScript',
    description: 'Array, string, function, DOM-style and language practice questions.',
  },
  {
    key: 'dsa',
    label: 'DSA',
    description: 'Practical algorithm and data-structure problems with runnable JavaScript.',
  },
];

export default function Code() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.all(
      CODE_LANGUAGES.map(async (lang) => {
        const [progress, topics] = await Promise.all([
          api.getCodeProgress({ subject: lang.key }),
          api.getCodeTopics({ subject: lang.key }),
        ]);
        return { ...lang, progress, topics };
      })
    )
      .then((data) => {
        if (alive) setCards(data);
      })
      .catch((err) => {
        console.error(err);
        if (alive) setError(err.message || 'Could not load code practice');
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const continuePractice = (card) => {
    const pending = card.topics.find((t) => (t.completed || 0) < t.count);
    if (pending) {
      navigate(`/code/${card.key}?topic=${encodeURIComponent(pending.name)}&filter=pending`);
    } else {
      navigate(`/code/${card.key}`);
    }
  };

  return (
    <div className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Coding track
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Code Practice
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Pick JavaScript or DSA, solve practical questions topic by topic, run code in the
            browser, save your code, and resume unfinished problems later.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Code practice could not load from the API. Make sure the backend is restarted, then refresh
          this page.
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-3xl" />
            ))
          : (cards.length ? cards : CODE_LANGUAGES.map((lang) => ({ ...lang, progress: null, topics: [] }))).map((card) => {
              const meta = SUBJECT_META[card.key] || {};
              const percent = card.progress?.percent || 0;
              return (
                <div key={card.key} className="glass-panel rounded-2xl p-5 sm:rounded-3xl sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em]"
                        style={{ color: meta.accent }}
                      >
                        <TerminalSquare className="h-3.5 w-3.5" />
                        {meta.short || card.label}
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold">{card.label}</h2>
                      <p className="mt-2 text-sm text-muted">{card.description}</p>
                    </div>
                    <span className="rounded-2xl bg-paper-2 p-3 text-ink">
                      <Code2 className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted">Solved</p>
                      <p className="mt-1 font-display text-2xl font-semibold">
                        {card.progress?.completed ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Remaining</p>
                      <p className="mt-1 font-display text-2xl font-semibold">
                        {card.progress?.remaining ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Topics</p>
                      <p className="mt-1 font-display text-2xl font-semibold">
                        {card.topics?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-paper-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, background: meta.accent }}
                    />
                  </div>

                  <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => continuePractice(card)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
                    >
                      Continue coding
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/code/${card.key}`}
                      className="inline-flex items-center justify-center rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium hover:bg-paper-2"
                    >
                      View all topics
                    </Link>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
