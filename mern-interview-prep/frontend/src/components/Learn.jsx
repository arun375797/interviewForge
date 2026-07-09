import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, GraduationCap } from 'lucide-react';
import { api, SUBJECT_META } from '../api';

const LANGUAGE_OPTIONS = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'dsa', label: 'DSA' },
];

export default function Learn() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLang = searchParams.get('lang') || 'javascript';

  const [progress, setProgress] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const meta = SUBJECT_META[selectedLang] || {
    label: selectedLang,
    accent: '#0f766e',
    short: selectedLang,
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getLearnProgress({ subject: selectedLang })
      .then((prog) => {
        if (alive) setProgress(prog);
      })
      .catch(console.error)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [selectedLang]);

  useEffect(() => {
    let alive = true;
    setTopicsLoading(true);
    api
      .getTopics(selectedLang)
      .then((data) => {
        if (alive) setTopics(data);
      })
      .catch(console.error)
      .finally(() => alive && setTopicsLoading(false));
    return () => {
      alive = false;
    };
  }, [selectedLang]);

  const onLanguageChange = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('lang', key);
    setSearchParams(next, { replace: true });
  };

  const openTopic = (topicName) => {
    navigate(`/learn/${selectedLang}?topic=${encodeURIComponent(topicName)}`);
  };

  const continueLearning = () => {
    const pending = topics.find((t) => (t.learned || 0) < t.count);
    if (pending) {
      navigate(`/learn/${selectedLang}?topic=${encodeURIComponent(pending.name)}&filter=pending`);
    } else {
      navigate(`/learn/${selectedLang}`);
    }
  };

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => (a.topicOrder || 0) - (b.topicOrder || 0)),
    [topics]
  );

  return (
    <div className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Study track</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Learn
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Choose a language, go topic by topic, tick questions as you cover them, and resume later.
            Progress is saved in the database.
          </p>
        </div>

        <label className="block w-full sm:w-64">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Language
          </span>
          <select
            value={selectedLang}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium outline-none focus:border-accent"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em]"
              style={{ color: meta.accent }}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {meta.short}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{meta.label}</h2>
          </div>
          <button
            type="button"
            onClick={continueLearning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper sm:w-auto"
          >
            Continue learning
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Covered', value: progress?.learned ?? '—' },
            { label: 'Remaining', value: progress?.remaining ?? '—' },
            { label: 'Overall', value: progress ? `${progress.percent}%` : '—' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-sm text-muted">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
                {loading ? '…' : item.value}
              </p>
            </div>
          ))}
        </div>

        {progress?.total ? (
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress.percent}%`, background: meta.accent }}
            />
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Topics</h3>
            <p className="mt-1 text-sm text-muted">
              Select a topic to start ticking questions for {meta.label}.
            </p>
          </div>
          <Link
            to={`/learn/${selectedLang}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Open full checklist
          </Link>
        </div>

        <div className="space-y-2">
          {topicsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))
            : sortedTopics.map((t) => {
                const pct = t.count ? Math.round(((t.learned || 0) / t.count) * 100) : 0;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => openTopic(t.name)}
                    className="glass-panel flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition hover:-translate-y-px hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{t.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {t.learned || 0} / {t.count} covered · {pct}%
                      </p>
                      <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-paper-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: meta.accent }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
