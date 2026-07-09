import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, GraduationCap } from 'lucide-react';
import { api, SUBJECT_META } from '../api';

export default function Learn() {
  const [progress, setProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getLearnProgress(), api.getSubjects()])
      .then(([prog, subs]) => {
        if (!alive) return;
        setProgress(prog);
        setSubjects(subs);
      })
      .catch(console.error)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const subjectProgress = (key) =>
    progress?.bySubject?.find((s) => s._id === key) || { total: 0, learned: 0 };

  return (
    <div className="animate-rise space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Study track</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Learn
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Go topic by topic, tick questions as you cover them, and resume later from where you left
          off. Progress is saved in the database.
        </p>
      </div>

      <div className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
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
        <div className="h-2 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      ) : null}

      <div className="stagger grid gap-4 sm:grid-cols-2">
        {(loading ? [1, 2, 3, 4] : subjects).map((s, i) => {
          if (loading) return <div key={i} className="skeleton h-40 rounded-2xl" />;
          const meta = SUBJECT_META[s.key] || {};
          const sp = subjectProgress(s.key);
          const pct = sp.total ? Math.round((sp.learned / sp.total) * 100) : 0;
          return (
            <Link
              key={s.key}
              to={`/learn/${s.key}`}
              className="group glass-panel relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 blur-2xl"
                style={{ background: meta.accent || s.color }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em]"
                    style={{ color: meta.accent || s.color }}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    {meta.short || s.label}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{s.label}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {sp.learned} / {sp.total} covered · {pct}%
                  </p>
                </div>
                <span className="rounded-full border border-line bg-paper p-2 transition group-hover:bg-ink group-hover:text-paper">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: meta.accent || '#0f766e' }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
