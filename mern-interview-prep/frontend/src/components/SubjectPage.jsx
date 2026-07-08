import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Filter, Plus } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionList from './QuestionList';
import QuestionDetail from './QuestionDetail';

export default function SubjectPage() {
  const { subject } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const selectedId = searchParams.get('q') || '';

  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [topicQuery, setTopicQuery] = useState('');

  const meta = SUBJECT_META[subject] || { label: subject, accent: '#0f766e' };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getTopics(subject)
      .then((data) => {
        if (alive) setTopics(data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [subject]);

  useEffect(() => {
    let alive = true;
    setListLoading(true);
    api
      .getQuestions({
        subject,
        topic: topic || undefined,
        search: search || undefined,
        difficulty: difficulty || undefined,
        page,
        limit: 40,
      })
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
  }, [subject, topic, search, difficulty, page]);

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

  const setTopic = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set('topic', name);
    else next.delete('topic');
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

  const onUpdated = (updated) => {
    setSelected(updated);
    setQuestions((prev) => prev.map((q) => (q._id === updated._id ? { ...q, ...updated } : q)));
  };

  const onDeleted = (id) => {
    setQuestions((prev) => prev.filter((q) => q._id !== id));
    setTotal((t) => Math.max(0, t - 1));
    closeQuestion();
  };

  return (
    <div className="animate-fade space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <Link to="/" className="hover:text-ink">
              Subjects
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span style={{ color: meta.accent }}>{meta.label}</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {total} questions{topic ? ` in “${topic}”` : ' across all topics'}
          </p>
        </div>
        <Link
          to={`/add?subject=${subject}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add question
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="glass-panel h-fit max-h-[70vh] overflow-hidden rounded-2xl lg:sticky lg:top-24">
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
          <div className="max-h-[52vh] overflow-y-auto p-2">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton mb-2 h-10 rounded-lg" />
                ))
              : filteredTopics.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTopic(t.name)}
                    className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition ${
                      topic === t.name ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                    }`}
                  >
                    <p className="text-sm font-medium leading-snug">{t.name}</p>
                    <p className={`mt-1 text-xs ${topic === t.name ? 'text-paper/70' : 'text-muted'}`}>
                      {t.count} Q · {t.mastered} mastered
                    </p>
                  </button>
                ))}
          </div>
        </aside>

        <div className="space-y-4">
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
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">All levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <QuestionList
            questions={questions}
            loading={listLoading}
            onSelect={openQuestion}
            selectedId={selectedId}
          />

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
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
