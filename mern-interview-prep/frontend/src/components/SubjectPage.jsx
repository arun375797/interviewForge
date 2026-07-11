import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Filter, Plus, X } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import { useDebounce } from '../utils/useDebounce';
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
  const [globalSearch, setGlobalSearch] = useState(searchParams.get('qsearch') || '');
  const [topicSearch, setTopicSearch] = useState(searchParams.get('search') || '');
  const debouncedGlobalSearch = useDebounce(globalSearch, 300);
  const debouncedTopicSearch = useDebounce(topicSearch, 300);
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [topicQuery, setTopicQuery] = useState('');

  const meta = SUBJECT_META[subject] || { label: subject, accent: '#0f766e' };
  const isGlobalSearch = Boolean(debouncedGlobalSearch.trim());

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

    // Top search = whole language (ignore selected topic)
    // Side/main search = within current topic (when no global search)
    const activeSearch = isGlobalSearch
      ? debouncedGlobalSearch.trim()
      : debouncedTopicSearch.trim() || undefined;

    api
      .getQuestions({
        subject,
        topic: isGlobalSearch ? undefined : topic || undefined,
        search: activeSearch,
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
  }, [subject, topic, debouncedGlobalSearch, debouncedTopicSearch, difficulty, page, isGlobalSearch]);

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
    // Switching topic clears global language search so topic view is clear
    next.delete('qsearch');
    setGlobalSearch('');
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

  const onGlobalSearchChange = (value) => {
    setGlobalSearch(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('qsearch', value.trim());
    else next.delete('qsearch');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const clearGlobalSearch = () => {
    onGlobalSearchChange('');
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

  const resultLabel = isGlobalSearch
    ? `${total} results in all ${meta.label} topics`
    : `${total} questions${topic ? ` in “${topic}”` : ' across all topics'}`;

  return (
    <div className="animate-fade space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
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
          <p className="mt-1 text-sm text-muted">{resultLabel}</p>
        </div>
        <Link
          to={`/add?subject=${subject}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add question
        </Link>
      </div>

      {/* Language-wide search (ignores selected topic) */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Search entire {meta.label}
          </p>
          {isGlobalSearch ? (
            <button
              type="button"
              onClick={clearGlobalSearch}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder={`Search all ${meta.label} questions (all topics)…`}
            className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        {isGlobalSearch ? (
          <p className="mt-2 text-xs text-muted">
            Showing matches across every topic in {meta.label}. Topic filter is paused while this
            search is active.
          </p>
        ) : null}
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
                !topic && !isGlobalSearch ? 'bg-ink text-paper' : 'hover:bg-paper-2'
              }`}
            >
              All topics
            </button>
          </div>
          <div className="max-h-[min(40vh,300px)] overflow-y-auto p-2 lg:max-h-[52vh]">
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
                      topic === t.name && !isGlobalSearch ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                    }`}
                  >
                    <p className="text-sm font-medium leading-snug">{t.name}</p>
                    <p
                      className={`mt-1 text-xs ${
                        topic === t.name && !isGlobalSearch ? 'text-paper/70' : 'text-muted'
                      }`}
                    >
                      {t.count} Q · {t.mastered} mastered
                    </p>
                  </button>
                ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={topicSearch}
                onChange={(e) => {
                  setTopicSearch(e.target.value);
                  setPage(1);
                }}
                disabled={isGlobalSearch}
                placeholder={
                  isGlobalSearch
                    ? 'Paused — using language-wide search above'
                    : topic
                      ? `Search within “${topic}”…`
                      : 'Search in current topic view…'
                }
                className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-55"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent sm:w-auto"
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
