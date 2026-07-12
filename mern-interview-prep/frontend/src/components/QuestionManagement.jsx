import { useEffect, useMemo, useState } from 'react';
import { Eye, FileQuestion, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionDetail from './QuestionDetail';

const CODE_SUBJECT_KEYS = new Set(['javascript', 'dsa']);
const PAGE_SIZE = 50;

const DIFFICULTY_OPTIONS = [
  { key: '', label: 'All difficulties' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

function questionLabel(question, mode) {
  if (mode === 'code') {
    return question.codePrompt?.title || question.question || 'Untitled code question';
  }
  return question.question || 'Untitled question';
}

function fallbackSubjects() {
  return Object.entries(SUBJECT_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    questionCount: 0,
  }));
}

export default function QuestionManagement() {
  const [mode, setMode] = useState('study');
  const [subjects, setSubjects] = useState(fallbackSubjects);
  const [subject, setSubject] = useState('javascript');
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [selected, setSelected] = useState(null);
  const [openingId, setOpeningId] = useState('');

  const subjectOptions = useMemo(
    () =>
      mode === 'code'
        ? subjects.filter((item) => CODE_SUBJECT_KEYS.has(item.key))
        : subjects,
    [mode, subjects]
  );

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
      setTopic('');
      setPage(1);
    }
  }, [subjectOptions, subject]);

  useEffect(() => {
    let alive = true;
    setTopicsLoading(true);
    const loader =
      mode === 'code'
        ? api.getCodeTopics({ subject })
        : api.getTopics(subject);

    loader
      .then((data) => {
        if (!alive) return;
        const nextTopics = (data || []).map((item) => ({
          name: item.name,
          count: item.count || 0,
        }));
        setTopics(nextTopics);
      })
      .catch(() => alive && setTopics([]))
      .finally(() => alive && setTopicsLoading(false));

    return () => {
      alive = false;
    };
  }, [mode, subject]);

  useEffect(() => {
    if (!topic || !topics.length) return;
    if (!topics.some((item) => item.name === topic)) {
      setTopic('');
      setPage(1);
    }
  }, [topics, topic]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    const params = {
      subject,
      topic: topic || undefined,
      difficulty: difficulty || undefined,
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      sort: 'newest',
    };
    const loader = mode === 'code' ? api.getCodeQuestions : api.getQuestions;

    try {
      const data = await loader(params, { cache: 'no-store' });
      setQuestions(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setQuestions([]);
      setTotal(0);
      setPages(1);
      setError(err.message || 'Could not load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [mode, subject, topic, difficulty, debouncedSearch, page]);

  const subjectLabel = useMemo(
    () => subjectOptions.find((item) => item.key === subject)?.label || subject,
    [subjectOptions, subject]
  );

  const resetFilters = () => {
    setTopic('');
    setDifficulty('');
    setSearch('');
    setPage(1);
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetFilters();
  };

  const handleSubjectChange = (value) => {
    setSubject(value);
    setTopic('');
    setPage(1);
  };

  const handleTopicChange = (value) => {
    setTopic(value);
    setPage(1);
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    setPage(1);
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

  const onQuestionUpdated = (updated) => {
    setSelected(updated);
    setQuestions((prev) =>
      prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    );
  };

  const onQuestionDeleted = (id) => {
    setQuestions((prev) => prev.filter((item) => item._id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
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
      setQuestions((prev) => prev.filter((item) => item._id !== question._id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selected?._id === question._id) setSelected(null);
      setMessage('Question deleted');
    } catch (err) {
      setError(err.message || 'Could not delete question');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Question management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Browse study and code questions, open any row to view its answer, then delete unwanted
            entries. Use subject and topic filters to narrow the list — many Node.js questions are
            grouped under cross-topic names.
          </p>
        </div>
        <button
          type="button"
          onClick={loadQuestions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted">
            <FileQuestion className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Matching questions</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{total}</p>
          <p className="mt-1 text-xs text-muted">
            {mode === 'code' ? 'Code practice' : 'Study'} · {subjectLabel}
            {topic ? ` · ${topic}` : ''}
          </p>
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

      <div className="glass-panel rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Subject
              </span>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              >
                {subjectOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                    {item.questionCount ? ` (${item.questionCount})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Topic
              </span>
              <select
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                disabled={topicsLoading}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">All topics</option>
                {topics.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                    {item.count ? ` (${item.count})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Difficulty
              </span>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              >
                {DIFFICULTY_OPTIONS.map((item) => (
                  <option key={item.key || 'all'} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Find a question..."
                  className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 outline-none focus:border-accent"
                />
              </div>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
          </div>
        ) : questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            No questions match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-3 font-semibold">Question</th>
                  <th className="px-3 py-3 font-semibold">Topic</th>
                  <th className="px-3 py-3 font-semibold">Difficulty</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => {
                  const label = questionLabel(question, mode);
                  const topicName =
                    mode === 'code' ? question.codePrompt?.topic || question.topic : question.topic;
                  const isOpening = openingId === question._id;
                  return (
                    <tr key={question._id} className="border-b border-line/70 last:border-0">
                      <td className="max-w-md px-3 py-4">
                        <button
                          type="button"
                          onClick={() => openQuestion(question)}
                          disabled={Boolean(openingId)}
                          className="max-w-full text-left disabled:opacity-60"
                          title="View answer"
                        >
                          <p className="line-clamp-2 font-medium hover:text-accent">{label}</p>
                          <p className="mt-1 font-mono text-xs text-muted">{question._id}</p>
                        </button>
                      </td>
                      <td className="max-w-xs px-3 py-4 text-muted">{topicName || '—'}</td>
                      <td className="px-3 py-4 capitalize text-muted">{question.difficulty || '—'}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openQuestion(question)}
                            disabled={Boolean(openingId)}
                            className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
                          >
                            <Eye className="h-4 w-4" />
                            {isOpening ? 'Loading...' : 'Answer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(question)}
                            disabled={busyId === question._id}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {busyId === question._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
          <p className="text-muted">
            Page {page} of {pages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
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
