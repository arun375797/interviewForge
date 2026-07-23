import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Search,
} from 'lucide-react';
import { api, resolveSubjectMeta } from '../api';
import { useDebounce } from '../utils/useDebounce';
import QuestionDetail from './QuestionDetail';

const difficultyStyle = {
  easy: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-900',
  hard: 'bg-rose-100 text-rose-800',
};

function topicCacheKey(name, difficulty) {
  return `${name}::${difficulty || 'all'}`;
}

export default function SubjectPage() {
  const { subject } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const selectedId = searchParams.get('q') || '';

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('qsearch') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [topicQuery, setTopicQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [questionsByKey, setQuestionsByKey] = useState({});
  const questionsByKeyRef = useRef({});
  const [loadingTopics, setLoadingTopics] = useState(() => new Set());
  const [searchGroups, setSearchGroups] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [liveSubject, setLiveSubject] = useState(null);
  const sectionRefs = useRef({});
  const didAutoExpand = useRef('');

  const meta = resolveSubjectMeta(subject, liveSubject);
  const isSearching = Boolean(debouncedSearch.trim());

  useEffect(() => {
    let alive = true;
    api
      .getSubjects()
      .then((data) => {
        if (!alive) return;
        setLiveSubject((data || []).find((item) => item.key === subject) || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [subject]);

  useEffect(() => {
    questionsByKeyRef.current = questionsByKey;
  }, [questionsByKey]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setQuestionsByKey({});
    questionsByKeyRef.current = {};
    setSearchGroups(null);
    setExpanded(new Set());
    didAutoExpand.current = '';
    api
      .getTopics(subject)
      .then((data) => alive && setTopics(data))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [subject]);

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

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => (a.topicOrder || 0) - (b.topicOrder || 0)),
    [topics]
  );

  const filteredTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return sortedTopics;
    return sortedTopics.filter((t) => t.name.toLowerCase().includes(q));
  }, [sortedTopics, topicQuery]);

  const overview = useMemo(() => {
    const total = topics.reduce((sum, t) => sum + (t.count || 0), 0);
    const mastered = topics.reduce((sum, t) => sum + (t.mastered || 0), 0);
    return {
      total,
      mastered,
      topics: topics.length,
      percent: total ? Math.round((mastered / total) * 100) : 0,
    };
  }, [topics]);

  const loadTopicQuestions = useCallback(
    async (topicName, { force = false } = {}) => {
      const key = topicCacheKey(topicName, difficulty);
      if (!force && questionsByKeyRef.current[key]) return;
      setLoadingTopics((prev) => new Set(prev).add(topicName));
      try {
        const data = await api.getQuestions({
          subject,
          topic: topicName,
          difficulty: difficulty || undefined,
          page: 1,
          limit: 200,
        });
        setQuestionsByKey((prev) => {
          const next = { ...prev, [key]: data.items || [] };
          questionsByKeyRef.current = next;
          return next;
        });
      } catch (err) {
        console.error(err);
        setQuestionsByKey((prev) => {
          const next = { ...prev, [key]: [] };
          questionsByKeyRef.current = next;
          return next;
        });
      } finally {
        setLoadingTopics((prev) => {
          const next = new Set(prev);
          next.delete(topicName);
          return next;
        });
      }
    },
    [subject, difficulty]
  );

  useEffect(() => {
    if (!isSearching) {
      setSearchGroups(null);
      return;
    }
    let alive = true;
    setSearchLoading(true);
    api
      .getQuestions({
        subject,
        search: debouncedSearch,
        difficulty: difficulty || undefined,
        page: 1,
        limit: 200,
      })
      .then((data) => {
        if (!alive) return;
        const groups = new Map();
        for (const q of data.items || []) {
          const name = q.topic || 'Other';
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(q);
        }
        setSearchGroups(groups);
        setExpanded(new Set(groups.keys()));
      })
      .catch(console.error)
      .finally(() => alive && setSearchLoading(false));
    return () => {
      alive = false;
    };
  }, [subject, debouncedSearch, difficulty, isSearching]);

  useEffect(() => {
    if (isSearching || loading || !sortedTopics.length) return;

    if (topic) {
      setExpanded((prev) => new Set([...prev, topic]));
      loadTopicQuestions(topic);
      const scrollKey = `${subject}:${topic}`;
      if (didAutoExpand.current !== scrollKey) {
        didAutoExpand.current = scrollKey;
        requestAnimationFrame(() => {
          sectionRefs.current[topic]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return;
    }

    const landKey = `${subject}:auto`;
    if (didAutoExpand.current === landKey) return;
    didAutoExpand.current = landKey;
    const start = sortedTopics[0]?.name;
    if (!start) return;
    setExpanded(new Set([start]));
    loadTopicQuestions(start);
  }, [topic, sortedTopics, loading, isSearching, loadTopicQuestions, subject]);

  useEffect(() => {
    setQuestionsByKey({});
    questionsByKeyRef.current = {};
    if (isSearching) return;
    for (const name of expanded) {
      loadTopicQuestions(name, { force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const setTopic = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set('topic', name);
    else next.delete('topic');
    next.delete('q');
    setSearchParams(next);
  };

  const onSearchChange = (value) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('qsearch', value.trim());
    else next.delete('qsearch');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const toggleExpand = (name) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else {
        next.add(name);
        if (!isSearching) loadTopicQuestions(name);
      }
      return next;
    });
  };

  const expandAll = () => {
    const names = filteredTopics.map((t) => t.name);
    setExpanded(new Set(names));
    if (!isSearching) names.forEach((name) => loadTopicQuestions(name));
  };

  const collapseAll = () => {
    setExpanded(new Set());
    const next = new URLSearchParams(searchParams);
    next.delete('topic');
    next.delete('q');
    setSearchParams(next);
  };

  const openQuestion = (id, topicName) => {
    const next = new URLSearchParams(searchParams);
    if (topicName) next.set('topic', topicName);
    next.set('q', id);
    setSearchParams(next);
  };

  const closeQuestion = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  const patchQuestionInCaches = (updated) => {
    setQuestionsByKey((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((item) =>
          item._id === updated._id ? { ...item, ...updated } : item
        );
      }
      return next;
    });
    setSearchGroups((prev) => {
      if (!prev) return prev;
      const next = new Map();
      for (const [name, items] of prev) {
        next.set(
          name,
          items.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
        );
      }
      return next;
    });
  };

  const onUpdated = (updated) => {
    setSelected(updated);
    patchQuestionInCaches(updated);
  };

  const onDeleted = (id) => {
    setQuestionsByKey((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((q) => q._id !== id);
      }
      return next;
    });
    setSearchGroups((prev) => {
      if (!prev) return prev;
      const next = new Map();
      for (const [name, items] of prev) {
        next.set(
          name,
          items.filter((q) => q._id !== id)
        );
      }
      return next;
    });
    setTopics((prev) =>
      prev.map((t) => {
        const match = Object.values(questionsByKeyRef.current)
          .flat()
          .find((q) => q._id === id);
        if (match && t.name === match.topic) {
          return { ...t, count: Math.max(0, (t.count || 0) - 1) };
        }
        return t;
      })
    );
    closeQuestion();
  };

  const outlineTopics = useMemo(() => {
    if (isSearching && searchGroups) {
      return filteredTopics
        .filter((t) => searchGroups.has(t.name))
        .map((t) => ({
          ...t,
          matchCount: searchGroups.get(t.name)?.length || 0,
        }));
    }
    return filteredTopics;
  }, [filteredTopics, isSearching, searchGroups]);

  const getQuestionsForTopic = (topicName) => {
    if (isSearching && searchGroups) {
      return searchGroups.get(topicName) || [];
    }
    return questionsByKey[topicCacheKey(topicName, difficulty)] || [];
  };

  return (
    <div className="animate-fade space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <Link to="/" className="hover:text-ink">
              Subjects
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
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse every topic and its questions in one outline.
          </p>
        </div>
        <Link
          to={`/add?subject=${subject}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add question
        </Link>
      </div>

      <div className="glass-panel rounded-2xl px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Subject overview
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {loading ? '…' : overview.total}
              <span className="ml-2 text-base font-sans font-normal text-muted">questions</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted">Topics</p>
              <p className="font-medium tabular-nums">{overview.topics}</p>
            </div>
            <div>
              <p className="text-muted">Mastered</p>
              <p className="font-medium tabular-nums">
                {overview.mastered} · {overview.percent}%
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${overview.percent}%`, background: meta.accent }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search all ${meta.label} questions…`}
            className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="relative w-full lg:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={topicQuery}
            onChange={(e) => setTopicQuery(e.target.value)}
            placeholder="Filter topics…"
            className="w-full rounded-xl border border-line bg-paper py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="">All levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-paper-2 hover:text-ink"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-paper-2 hover:text-ink"
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Topic outline</p>
          <p className="mt-0.5 text-sm text-muted">
            {isSearching
              ? searchLoading
                ? 'Searching…'
                : `${outlineTopics.length} topic${outlineTopics.length === 1 ? '' : 's'} with matches`
              : `${outlineTopics.length} topics · expand to see questions`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-0 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton mb-1 h-12 rounded-lg" />
            ))}
          </div>
        ) : outlineTopics.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-display text-xl font-semibold">Nothing to show</p>
            <p className="mt-2 text-sm text-muted">
              {isSearching
                ? 'No questions match this search. Try another term or clear filters.'
                : 'No topics match your filter.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {outlineTopics.map((t, topicIndex) => {
              const pct = t.count ? Math.round(((t.mastered || 0) / t.count) * 100) : 0;
              const isOpen = expanded.has(t.name);
              const isFocused = topic === t.name;
              const questions = getQuestionsForTopic(t.name);
              const isLoadingQs = loadingTopics.has(t.name) || (isSearching && searchLoading);

              return (
                <li
                  key={t.name}
                  ref={(el) => {
                    sectionRefs.current[t.name] = el;
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpand(t.name);
                      if (!isOpen && !isSearching) setTopic(t.name);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-paper-2/60 sm:px-5 ${
                      isFocused ? 'bg-paper-2/50' : ''
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line text-muted transition ${
                        isOpen ? 'bg-ink text-paper' : 'bg-paper'
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>

                    <span className="w-7 shrink-0 font-mono text-xs tabular-nums text-muted">
                      {String(topicIndex + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold leading-snug sm:text-[15px]">{t.name}</p>
                        {isSearching ? (
                          <span className="text-xs text-muted">
                            {t.matchCount} match{t.matchCount === 1 ? '' : 'es'}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex max-w-md items-center gap-3">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: meta.accent }}
                          />
                        </div>
                        <p className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                          {t.count} Q · {t.mastered || 0} mastered
                        </p>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-line bg-paper/50 pb-2 pl-4 pr-2 sm:pl-14 sm:pr-3">
                      {isLoadingQs ? (
                        <div className="space-y-1 py-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton h-10 rounded-lg" />
                          ))}
                        </div>
                      ) : questions.length === 0 ? (
                        <p className="py-4 text-sm text-muted">
                          No questions in this view
                          {difficulty ? ' for the selected difficulty' : ''}.
                        </p>
                      ) : (
                        <ul className="py-1">
                          {questions.map((q, idx) => (
                            <li
                              key={q._id}
                              className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-paper-2 sm:gap-3 ${
                                selectedId === q._id ? 'bg-paper-2 ring-1 ring-accent' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openQuestion(q._id, t.name)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-baseline gap-2">
                                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                                    {String(q.order || idx + 1).padStart(2, '0')}
                                  </span>
                                  <span className="text-sm leading-snug text-ink">{q.question}</span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-6">
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      difficultyStyle[q.difficulty] || difficultyStyle.medium
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>
                                  {q.bookmarked ? (
                                    <Bookmark className="h-3.5 w-3.5 fill-accent-2 text-accent-2" />
                                  ) : null}
                                  {q.mastered ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                                  ) : null}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => openQuestion(q._id, t.name)}
                                className="rounded-md border border-transparent p-1.5 text-muted opacity-70 transition hover:border-line hover:bg-paper hover:text-ink group-hover:opacity-100"
                                title="View answer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
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
