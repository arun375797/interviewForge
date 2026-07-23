import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FileQuestion,
  Layers,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionDetail from './QuestionDetail';

const DIFFICULTY_OPTIONS = [
  { key: '', label: 'All difficulties' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

const difficultyStyle = {
  easy: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-900',
  hard: 'bg-rose-100 text-rose-800',
};

function questionLabel(question, mode) {
  if (mode === 'code') {
    return question.codePrompt?.title || question.question || 'Untitled code question';
  }
  return question.question || 'Untitled question';
}

function questionTopicName(question, mode) {
  if (mode === 'code') {
    return question.codePrompt?.topic || question.topic || 'Other';
  }
  return question.topic || 'Other';
}

function fallbackSubjects() {
  return Object.entries(SUBJECT_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    questionCount: 0,
  }));
}

function topicCacheKey(name, difficulty) {
  return `${name}::${difficulty || 'all'}`;
}

export default function QuestionManagement() {
  const [mode, setMode] = useState('study');
  const [subjects, setSubjects] = useState(fallbackSubjects);
  const [subject, setSubject] = useState('javascript');
  const [topics, setTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [selected, setSelected] = useState(null);
  const [openingId, setOpeningId] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [questionsByKey, setQuestionsByKey] = useState({});
  const questionsByKeyRef = useRef({});
  const [loadingTopics, setLoadingTopics] = useState(() => new Set());
  const [searchGroups, setSearchGroups] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState('');
  const sectionRefs = useRef({});
  const didAutoExpand = useRef('');

  const subjectOptions = useMemo(
    () =>
      mode === 'code'
        ? subjects.filter(
            (item) =>
              item.supportsCode || item.key === 'javascript' || item.key === 'dsa'
          )
        : subjects,
    [mode, subjects]
  );

  const meta = SUBJECT_META[subject] || { label: subject, accent: '#0f766e' };
  const isSearching = Boolean(debouncedSearch.trim());

  useEffect(() => {
    questionsByKeyRef.current = questionsByKey;
  }, [questionsByKey]);

  useEffect(() => {
    let alive = true;
    api
      .getSubjects()
      .then((data) => {
        if (!alive || !data?.length) return;
        setSubjects(
          data.map((item) => ({
            key: item.key,
            label: item.label,
            questionCount: item.questionCount || 0,
            supportsCode: Boolean(item.supportsCode),
          }))
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!subjectOptions.some((item) => item.key === subject)) {
      setSubject(subjectOptions[0]?.key || 'javascript');
    }
  }, [subjectOptions, subject]);

  useEffect(() => {
    let alive = true;
    setTopicsLoading(true);
    setQuestionsByKey({});
    questionsByKeyRef.current = {};
    setSearchGroups(null);
    setExpanded(new Set());
    setActiveTopic('');
    didAutoExpand.current = '';
    setError('');

    const loader = mode === 'code' ? api.getCodeTopics({ subject }) : api.getTopics(subject);

    loader
      .then((data) => {
        if (!alive) return;
        const nextTopics = (data || []).map((item) => ({
          name: item.name,
          count: item.count || 0,
          topicOrder: item.topicOrder || 0,
        }));
        setTopics(nextTopics);
      })
      .catch(() => alive && setTopics([]))
      .finally(() => alive && setTopicsLoading(false));

    return () => {
      alive = false;
    };
  }, [mode, subject]);

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
    return { total, topics: topics.length };
  }, [topics]);

  const loadTopicQuestions = useCallback(
    async (topicName, { force = false } = {}) => {
      const key = topicCacheKey(topicName, difficulty);
      if (!force && questionsByKeyRef.current[key]) return;
      setLoadingTopics((prev) => new Set(prev).add(topicName));
      setError('');
      try {
        const params = {
          subject,
          topic: topicName,
          difficulty: difficulty || undefined,
          page: 1,
          limit: 200,
          sort: 'order',
        };
        const loader = mode === 'code' ? api.getCodeQuestions : api.getQuestions;
        const data = await loader(params, { cache: 'no-store' });
        setQuestionsByKey((prev) => {
          const next = { ...prev, [key]: data.items || [] };
          questionsByKeyRef.current = next;
          return next;
        });
      } catch (err) {
        console.error(err);
        setError(err.message || 'Could not load questions');
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
    [subject, difficulty, mode]
  );

  useEffect(() => {
    if (!isSearching) {
      setSearchGroups(null);
      return;
    }
    let alive = true;
    setSearchLoading(true);
    setError('');
    const params = {
      subject,
      search: debouncedSearch,
      difficulty: difficulty || undefined,
      page: 1,
      limit: 200,
      sort: 'newest',
    };
    const loader = mode === 'code' ? api.getCodeQuestions : api.getQuestions;
    loader(params, { cache: 'no-store' })
      .then((data) => {
        if (!alive) return;
        const groups = new Map();
        for (const q of data.items || []) {
          const name = questionTopicName(q, mode);
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(q);
        }
        setSearchGroups(groups);
        setExpanded(new Set(groups.keys()));
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Could not search questions');
        setSearchGroups(new Map());
      })
      .finally(() => alive && setSearchLoading(false));
    return () => {
      alive = false;
    };
  }, [subject, debouncedSearch, difficulty, isSearching, mode]);

  useEffect(() => {
    if (isSearching || topicsLoading || !sortedTopics.length) return;

    if (activeTopic) {
      setExpanded((prev) => new Set([...prev, activeTopic]));
      loadTopicQuestions(activeTopic);
      const scrollKey = `${mode}:${subject}:${activeTopic}`;
      if (didAutoExpand.current !== scrollKey) {
        didAutoExpand.current = scrollKey;
        requestAnimationFrame(() => {
          sectionRefs.current[activeTopic]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }
      return;
    }

    const landKey = `${mode}:${subject}:auto`;
    if (didAutoExpand.current === landKey) return;
    didAutoExpand.current = landKey;
    const start = sortedTopics[0]?.name;
    if (!start) return;
    setExpanded(new Set([start]));
    loadTopicQuestions(start);
  }, [
    activeTopic,
    sortedTopics,
    topicsLoading,
    isSearching,
    loadTopicQuestions,
    subject,
    mode,
  ]);

  useEffect(() => {
    setQuestionsByKey({});
    questionsByKeyRef.current = {};
    if (isSearching) return;
    for (const name of expanded) {
      loadTopicQuestions(name, { force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const subjectLabel = useMemo(
    () => subjectOptions.find((item) => item.key === subject)?.label || subject,
    [subjectOptions, subject]
  );

  const resetFilters = () => {
    setDifficulty('');
    setSearch('');
    setTopicQuery('');
    setActiveTopic('');
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetFilters();
  };

  const handleSubjectChange = (value) => {
    setSubject(value);
    setActiveTopic('');
    setSearch('');
    setTopicQuery('');
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
    setActiveTopic('');
  };

  const refreshAll = () => {
    setQuestionsByKey({});
    questionsByKeyRef.current = {};
    setSearchGroups(null);
    didAutoExpand.current = '';
    setMessage('');
    setError('');

    const loader = mode === 'code' ? api.getCodeTopics({ subject }) : api.getTopics(subject);
    setTopicsLoading(true);
    loader
      .then((data) => {
        const nextTopics = (data || []).map((item) => ({
          name: item.name,
          count: item.count || 0,
          topicOrder: item.topicOrder || 0,
        }));
        setTopics(nextTopics);
        const openNames = [...expanded];
        if (isSearching) {
          setDebouncedSearch((prev) => prev);
        } else {
          openNames.forEach((name) => loadTopicQuestions(name, { force: true }));
          if (!openNames.length && nextTopics[0]?.name) {
            setExpanded(new Set([nextTopics[0].name]));
            loadTopicQuestions(nextTopics[0].name, { force: true });
          }
        }
      })
      .catch((err) => setError(err.message || 'Could not refresh'))
      .finally(() => setTopicsLoading(false));
  };

  const openQuestion = async (question) => {
    if (!question?._id || openingId) return;
    setOpeningId(question._id);
    setError('');
    try {
      const full =
        mode === 'code'
          ? await api.getCodeQuestion(question._id)
          : await api.getQuestion(question._id);
      setSelected(full);
    } catch (err) {
      setError(err.message || 'Could not load answer');
    } finally {
      setOpeningId('');
    }
  };

  const closeQuestion = () => setSelected(null);

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

  const removeFromCaches = (id) => {
    setQuestionsByKey((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((q) => q._id !== id);
      }
      questionsByKeyRef.current = next;
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
  };

  const onQuestionUpdated = (updated) => {
    setSelected(updated);
    patchQuestionInCaches(updated);
  };

  const onQuestionDeleted = (id) => {
    // Decrement topic count for the topic that held this question
    let topicName = '';
    for (const [key, items] of Object.entries(questionsByKeyRef.current)) {
      if (items.some((q) => q._id === id)) {
        topicName = key.split('::')[0];
        break;
      }
    }
    if (!topicName && searchGroups) {
      for (const [name, items] of searchGroups) {
        if (items.some((q) => q._id === id)) {
          topicName = name;
          break;
        }
      }
    }
    removeFromCaches(id);
    if (topicName) {
      setTopics((prev) =>
        prev.map((t) =>
          t.name === topicName ? { ...t, count: Math.max(0, (t.count || 0) - 1) } : t
        )
      );
    }
    setSelected(null);
    setMessage('Question deleted');
  };

  const removeQuestion = async (question) => {
    const label = questionLabel(question, mode);
    const confirmed = window.confirm(
      `Delete this question?\n\n"${label}"\n\nThis permanently removes the question and all user progress tied to it.`
    );
    if (!confirmed) return;

    setBusyId(question._id);
    setMessage('');
    setError('');
    try {
      await api.deleteQuestion(question._id);
      onQuestionDeleted(question._id);
    } catch (err) {
      setError(err.message || 'Could not delete question');
    } finally {
      setBusyId('');
    }
  };

  const outlineTopics = useMemo(() => {
    if (isSearching && searchGroups) {
      const names = new Set(searchGroups.keys());
      const fromTopics = filteredTopics
        .filter((t) => names.has(t.name))
        .map((t) => ({
          ...t,
          matchCount: searchGroups.get(t.name)?.length || 0,
        }));
      // Include search-only topic names not in the topic list
      const extras = [...names]
        .filter((name) => !filteredTopics.some((t) => t.name === name))
        .map((name) => ({
          name,
          count: searchGroups.get(name)?.length || 0,
          matchCount: searchGroups.get(name)?.length || 0,
          topicOrder: 9999,
        }));
      return [...fromTopics, ...extras];
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Question management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Browse study and code questions by topic outline. Expand a topic to view, open, or delete
            questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/subjects"
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2"
          >
            <Layers className="h-4 w-4" />
            Subjects
          </Link>
          <button
            type="button"
            onClick={refreshAll}
            disabled={topicsLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${topicsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted">
              <FileQuestion className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {mode === 'code' ? 'Code practice' : 'Study'} · {subjectLabel}
              </span>
            </div>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {topicsLoading ? '…' : overview.total}
              <span className="ml-2 text-base font-sans font-normal text-muted">questions</span>
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted">Topics</p>
            <p className="font-medium tabular-nums">{overview.topics}</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'study', label: 'Study questions' },
            { key: 'code', label: 'Code questions' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleModeChange(item.key)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                mode === item.key
                  ? 'bg-ink text-paper'
                  : 'border border-line text-muted hover:bg-paper-2 hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="block w-full lg:w-48">
            <span className="sr-only">Subject</span>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {subjectOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                  {item.questionCount ? ` (${item.questionCount})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions across all topics…"
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
              {DIFFICULTY_OPTIONS.map((item) => (
                <option key={item.key || 'all'} value={item.key}>
                  {item.label}
                </option>
              ))}
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
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Topic outline</p>
          <p className="mt-0.5 text-sm text-muted">
            {isSearching
              ? searchLoading
                ? 'Searching…'
                : `${outlineTopics.length} topic${outlineTopics.length === 1 ? '' : 's'} with matches`
              : `${outlineTopics.length} topics · expand to manage questions`}
          </p>
        </div>

        {topicsLoading ? (
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
              const isOpen = expanded.has(t.name);
              const isFocused = activeTopic === t.name;
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
                      if (!isOpen && !isSearching) setActiveTopic(t.name);
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
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
                        {t.count} question{t.count === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-line bg-paper/50 pb-2 pl-4 pr-2 sm:pl-14 sm:pr-3">
                      {isLoadingQs ? (
                        <div className="space-y-1 py-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton h-12 rounded-lg" />
                          ))}
                        </div>
                      ) : questions.length === 0 ? (
                        <p className="py-4 text-sm text-muted">
                          No questions in this view
                          {difficulty ? ' for the selected difficulty' : ''}.
                        </p>
                      ) : (
                        <ul className="py-1">
                          {questions.map((q, idx) => {
                            const label = questionLabel(q, mode);
                            const isOpening = openingId === q._id;
                            return (
                              <li
                                key={q._id}
                                className="group flex items-start gap-2 rounded-lg px-2 py-2.5 transition hover:bg-paper-2 sm:gap-3"
                              >
                                <button
                                  type="button"
                                  onClick={() => openQuestion(q)}
                                  disabled={Boolean(openingId)}
                                  className="min-w-0 flex-1 text-left disabled:opacity-60"
                                >
                                  <div className="flex items-baseline gap-2">
                                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
                                      {String(q.order || idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-medium leading-snug text-ink hover:text-accent">
                                      {label}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-6">
                                    {q.difficulty ? (
                                      <span
                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                          difficultyStyle[q.difficulty] || difficultyStyle.medium
                                        }`}
                                      >
                                        {q.difficulty}
                                      </span>
                                    ) : null}
                                    <span className="font-mono text-[10px] text-muted">{q._id}</span>
                                  </div>
                                </button>

                                <div className="flex shrink-0 flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openQuestion(q)}
                                    disabled={Boolean(openingId)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-medium hover:bg-paper-2 disabled:opacity-50"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    {isOpening ? '…' : 'Answer'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(q)}
                                    disabled={busyId === q._id}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {busyId === q._id ? '…' : 'Delete'}
                                  </button>
                                </div>
                              </li>
                            );
                          })}
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

      {selected ? (
        <QuestionDetail
          question={selected}
          onClose={closeQuestion}
          onUpdated={onQuestionUpdated}
          onDeleted={onQuestionDeleted}
        />
      ) : null}
    </div>
  );
}
