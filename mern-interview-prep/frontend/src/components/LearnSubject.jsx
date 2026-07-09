import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Circle,
  Eye,
  Filter,
  Search,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionDetail from './QuestionDetail';

const LANGUAGE_OPTIONS = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'dsa', label: 'DSA' },
];

export default function LearnSubject() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const selectedId = searchParams.get('q') || '';
  const filterMode = searchParams.get('filter') || 'all';

  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [topicQuery, setTopicQuery] = useState('');
  const [togglingId, setTogglingId] = useState('');

  const meta = SUBJECT_META[subject] || { label: subject, accent: '#0f766e' };

  const refreshTopics = () =>
    api.getTopics(subject).then((data) => setTopics(data)).catch(console.error);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPage(1);
    api
      .getTopics(subject)
      .then((data) => alive && setTopics(data))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [subject]);

  useEffect(() => {
    let alive = true;
    setListLoading(true);
    const params = {
      subject,
      topic: topic || undefined,
      search: search || undefined,
      page,
      limit: 50,
    };
    if (filterMode === 'pending') params.learned = 'false';
    if (filterMode === 'done') params.learned = 'true';

    api
      .getQuestions(params)
      .then((data) => {
        if (!alive) return;
        setQuestions(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(console.error)
      .finally(() => alive && setListLoading(false));
    return () => {
      alive = false;
    };
  }, [subject, topic, search, page, filterMode]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let alive = true;
    api
      .getQuestion(selectedId)
      .then((q) => alive && setSelected(q))
      .catch(() => alive && setSelected(null));
    return () => {
      alive = false;
    };
  }, [selectedId]);

  const filteredTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) => t.name.toLowerCase().includes(q));
  }, [topics, topicQuery]);

  const activeTopic = topics.find((t) => t.name === topic);
  const topicPct = activeTopic?.count
    ? Math.round(((activeTopic.learned || 0) / activeTopic.count) * 100)
    : 0;

  const onLanguageChange = (key) => {
    navigate(`/learn/${key}`, { replace: true });
  };

  const setTopic = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set('topic', name);
    else next.delete('topic');
    next.delete('q');
    setSearchParams(next);
    setPage(1);
  };

  const setFilter = (mode) => {
    const next = new URLSearchParams(searchParams);
    if (mode === 'all') next.delete('filter');
    else next.set('filter', mode);
    next.delete('q');
    setSearchParams(next);
    setPage(1);
  };

  const openQuestion = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('q', id);
    setSearchParams(next);
  };

  const closeQuestion = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  const toggleLearned = async (q, e) => {
    e?.stopPropagation?.();
    if (togglingId) return;
    setTogglingId(q._id);
    try {
      const updated = await api.toggleLearned(q._id);
      setQuestions((prev) =>
        prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
      );
      if (selected?._id === updated._id) setSelected(updated);
      refreshTopics();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId('');
    }
  };

  const onUpdated = (updated) => {
    setSelected(updated);
    setQuestions((prev) => prev.map((q) => (q._id === updated._id ? { ...q, ...updated } : q)));
    refreshTopics();
  };

  const onDeleted = (id) => {
    setQuestions((prev) => prev.filter((q) => q._id !== id));
    closeQuestion();
    refreshTopics();
  };

  return (
    <div className="animate-fade space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link to={`/learn?lang=${subject}`} className="hover:text-ink">
              Learn
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span style={{ color: meta.accent }}>{meta.label}</span>
            {topic ? (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="max-w-[240px] truncate">{topic}</span>
              </>
            ) : null}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Learn · {meta.label}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tick questions as you cover them. Your progress is saved automatically.
          </p>
        </div>

        <label className="block w-full sm:w-56">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Language
          </span>
          <select
            value={subject}
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className="glass-panel h-fit max-h-[min(55vh,420px)] overflow-hidden rounded-2xl lg:sticky lg:top-24 lg:max-h-[70vh]">
          <div className="border-b border-line p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Topics</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={topicQuery}
                onChange={(e) => setTopicQuery(e.target.value)}
                placeholder="Filter topics…"
                className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => setTopic('')}
              className={`mt-3 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                !topic ? 'bg-ink text-paper' : 'hover:bg-paper-2'
              }`}
            >
              All topics
            </button>
          </div>
          <div className="max-h-[min(40vh,300px)] overflow-y-auto p-2 lg:max-h-[52vh]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton mb-2 h-12 rounded-lg" />
                ))
              : filteredTopics.map((t) => {
                  const pct = t.count ? Math.round(((t.learned || 0) / t.count) * 100) : 0;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setTopic(t.name)}
                      className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition ${
                        topic === t.name ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                      }`}
                    >
                      <p className="text-sm font-medium leading-snug">{t.name}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className={`text-xs ${topic === t.name ? 'text-paper/70' : 'text-muted'}`}>
                          {t.learned || 0}/{t.count} · {pct}%
                        </p>
                        <div
                          className={`h-1.5 w-16 overflow-hidden rounded-full ${
                            topic === t.name ? 'bg-white/20' : 'bg-paper-2'
                          }`}
                        >
                          <div
                            className={`h-full rounded-full ${topic === t.name ? 'bg-paper' : 'bg-accent'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {topic && activeTopic ? (
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Topic progress
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {activeTopic.learned || 0} of {activeTopic.count} covered ({topicPct}%)
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${topicPct}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search questions…"
                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Filter className="h-4 w-4 text-muted" />
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'done', label: 'Done' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm sm:flex-none ${
                    filterMode === f.id ? 'bg-ink text-paper' : 'border border-line bg-paper'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted">{total} questions in this view</p>

          <div className="space-y-2">
            {listLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))
              : questions.length === 0
                ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                      <p className="font-display text-xl font-semibold">No questions here</p>
                      <p className="mt-2 text-sm text-muted">
                        Try another topic or switch the filter to All / Pending.
                      </p>
                    </div>
                  )
                : questions.map((q, idx) => (
                    <div
                      key={q._id}
                      className={`glass-panel flex items-start gap-3 rounded-xl px-3 py-3.5 transition hover:shadow-md sm:px-4 ${
                        selectedId === q._id ? 'ring-2 ring-accent' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleLearned(q, e)}
                        disabled={togglingId === q._id}
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                          q.learned
                            ? 'border-accent bg-accent text-white'
                            : 'border-line bg-paper text-muted hover:border-accent hover:text-accent'
                        }`}
                        title={q.learned ? 'Mark as not covered' : 'Mark as covered'}
                        aria-label={q.learned ? 'Uncheck covered' : 'Mark covered'}
                      >
                        {q.learned ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuestion(q._id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                            {String(q.order || idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium leading-snug sm:text-[15px] ${
                                q.learned ? 'text-muted line-through decoration-line' : 'text-ink'
                              }`}
                            >
                              {q.question}
                            </p>
                            <p className="overflow-anywhere mt-1.5 text-xs text-muted">{q.topic}</p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuestion(q._id)}
                        className="mt-0.5 rounded-lg border border-line p-2 text-muted hover:bg-paper-2 hover:text-ink"
                        title="View answer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
          </div>

          {pages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-muted">
                Page {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <QuestionDetail
          question={selected}
          onClose={closeQuestion}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
