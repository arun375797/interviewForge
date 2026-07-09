import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers, Bookmark, CheckCircle2 } from 'lucide-react';
import { SUBJECT_META } from '../api';

export default function Home({ subjects, stats, loading }) {
  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-ink px-5 py-10 text-paper sm:rounded-3xl sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(15,118,110,0.45), transparent 45%), linear-gradient(225deg, rgba(194,65,12,0.35), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12), transparent 35%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="relative animate-rise max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-paper/70">
            Learn. Build. Crack Interviews.
          </p>
          <div className="inline-flex rounded-2xl bg-white/95 p-3 shadow-xl shadow-ink/20 ring-1 ring-white/50">
            <img
              src="/thinkmern-logo.svg"
              alt="thinkMern"
              className="h-auto w-full max-w-[18rem] object-contain sm:max-w-sm md:max-w-md"
            />
          </div>
          <p className="mt-4 max-w-xl text-base text-paper/80 sm:text-lg">
            Every question from your JS, React, Node.js, and DSA banks — arranged by topic,
            with interview-style answers you can edit anytime.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/learn"
              className="rounded-xl bg-paper px-5 py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-white"
            >
              Start learning
            </Link>
            <Link
              to="/practice"
              className="rounded-xl border border-paper/30 px-5 py-2.5 text-center text-sm font-medium text-paper transition hover:bg-white/10"
            >
              Practice mode
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total questions', value: stats?.total ?? '—', icon: Layers },
          { label: 'Bookmarked', value: stats?.bookmarked ?? '—', icon: Bookmark },
          { label: 'Marked mastered', value: stats?.mastered ?? '—', icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel animate-rise rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{loading ? '…' : value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Subjects</h2>
            <p className="mt-1 text-sm text-muted">Pick a track and drill topic by topic.</p>
          </div>
        </div>

        <div className="stagger grid gap-4 sm:grid-cols-2">
          {(loading ? [1, 2, 3, 4] : subjects).map((s, i) => {
            if (loading) {
              return <div key={i} className="skeleton h-40 rounded-2xl" />;
            }
            const meta = SUBJECT_META[s.key] || {};
            return (
              <Link
                key={s.key}
                to={`/subject/${s.key}`}
                className="group glass-panel relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-35"
                  style={{ background: meta.accent || s.color }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="font-mono text-xs uppercase tracking-[0.18em]"
                      style={{ color: meta.accent || s.color }}
                    >
                      {meta.short || s.label}
                    </p>
                    <h3 className="overflow-anywhere mt-2 font-display text-2xl font-semibold">{s.label}</h3>
                    <p className="overflow-anywhere mt-2 max-w-sm text-sm text-muted">{s.description || meta.blurb}</p>
                  </div>
                  <span className="rounded-full border border-line bg-paper p-2 text-ink transition group-hover:bg-ink group-hover:text-paper">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="relative mt-6 flex flex-wrap gap-4 text-sm">
                  <span className="tabular-nums text-ink">
                    <strong>{s.questionCount}</strong>{' '}
                    <span className="text-muted">questions</span>
                  </span>
                  <span className="tabular-nums text-ink">
                    <strong>{s.topicCount}</strong> <span className="text-muted">topics</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
