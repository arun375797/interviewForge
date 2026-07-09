import { useEffect, useMemo, useState } from 'react';
import { Check, Search, Save } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import RichAnswerEditor from './RichAnswerEditor';
import { stripAnswerFormatting } from '../utils/answerFormatting';

const STUDY_LANGUAGES = Object.entries(SUBJECT_META).map(([key, meta]) => ({
  key,
  label: meta.label,
}));

const CODE_LANGUAGES = STUDY_LANGUAGES.filter((item) =>
  ['javascript', 'dsa'].includes(item.key)
);

const STATUS_FILTERS = [
  { key: 'missing', label: 'Missing manual answers', manualAnswer: 'false' },
  { key: 'manual', label: 'Manually answered', manualAnswer: 'true' },
  { key: 'all', label: 'All questions', manualAnswer: undefined },
];

const PAGE_SIZE = 50;

function isManualAnswer(question) {
  return question?.answerManuallyAdded === true;
}

export default function AdminAnswers() {
  const [mode, setMode] = useState('study');
  const [subject, setSubject] = useState('javascript');
  const [statusFilter, setStatusFilter] = useState('missing');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const languages = mode === 'code' ? CODE_LANGUAGES : STUDY_LANGUAGES;
  const activeStatus = STATUS_FILTERS.find((item) => item.key === statusFilter);

  const selected = useMemo(
    () => questions.find((question) => question._id === selectedId) || null,
    [questions, selectedId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (mode === 'code' && !CODE_LANGUAGES.some((item) => item.key === subject)) {
      setSubject('javascript');
    }
  }, [mode, subject]);

  useEffect(() => {
    setPage(1);
  }, [mode, subject, statusFilter, debouncedSearch]);

  useEffect(() => {
    let alive = true;
    const params = {
      subject,
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      manualAnswer: activeStatus?.manualAnswer,
    };
    const loadQuestions = mode === 'code' ? api.getCodeQuestions : api.getQuestions;

    setLoading(true);
    setError('');
    loadQuestions(params)
      .then((data) => {
        if (!alive) return;
        setQuestions(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setMessage('');
      })
      .catch((err) => {
        if (!alive) return;
        setQuestions([]);
        setTotal(0);
        setPages(1);
        setError(err.message || 'Could not load questions');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeStatus?.manualAnswer, debouncedSearch, mode, page, subject]);

  useEffect(() => {
    if (!questions.length) {
      setSelectedId('');
      setDraftAnswer('');
      return;
    }

    if (selectedId && questions.some((question) => question._id === selectedId)) return;

    setSelectedId(questions[0]._id);
    setDraftAnswer(questions[0].answer || '');
  }, [questions, selectedId]);

  const chooseQuestion = (question) => {
    setSelectedId(question._id);
    setDraftAnswer(question.answer || '');
    setError('');
    setMessage('');
  };

  const saveAnswer = async () => {
    if (!selected || saving) return;
    if (!stripAnswerFormatting(draftAnswer).trim()) {
      setError('Add an answer before saving it as manually answered.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.updateQuestion(selected._id, { answer: draftAnswer });
      setQuestions((prev) =>
        prev.map((question) =>
          question._id === updated._id
            ? { ...question, ...updated, answerManuallyAdded: true }
            : question
        )
      );
      setDraftAnswer(updated.answer || draftAnswer);
      setMessage('Saved. This question is now marked as manually answered.');
    } catch (err) {
      setError(err.message || 'Could not save answer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Admin</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Manual answer status
          </h1>
          <p className="mt-1 text-sm text-muted">
            Red tick means the answer still needs manual editing. Green tick means it was saved manually.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
          <p className="font-semibold">{total} matching questions</p>
          <p className="text-muted">Showing {mode === 'code' ? 'code practice' : 'study'} answers</p>
        </div>
      </div>

      <div className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Section
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          >
            <option value="study">Study</option>
            <option value="code">Code</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Language
          </span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          >
            {languages.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a question..."
              className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 outline-none focus:border-accent"
            />
          </div>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="glass-panel h-fit overflow-hidden rounded-2xl">
          <div className="border-b border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Questions</p>
          </div>
          <div className="max-h-[68vh] overflow-y-auto p-2">
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="skeleton mb-2 h-20 rounded-xl" />
              ))
            ) : questions.length ? (
              questions.map((question) => {
                const manual = isManualAnswer(question);
                const active = selectedId === question._id;
                return (
                  <button
                    key={question._id}
                    type="button"
                    onClick={() => chooseQuestion(question)}
                    className={`mb-2 w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-ink bg-ink text-paper'
                        : 'border-transparent hover:border-line hover:bg-paper-2'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          manual
                            ? active
                              ? 'bg-emerald-300 text-emerald-950'
                              : 'bg-emerald-100 text-emerald-700'
                            : active
                              ? 'bg-rose-300 text-rose-950'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                        title={manual ? 'Manually answered' : 'Needs manual answer'}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-semibold leading-snug">
                          {question.question}
                        </span>
                        <span
                          className={`mt-1 block text-xs ${
                            active ? 'text-paper/70' : 'text-muted'
                          }`}
                        >
                          {question.topic} | {manual ? 'manual' : 'needs manual answer'}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted">No questions found.</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line p-3 text-sm">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-muted">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </aside>

        <section className="glass-panel rounded-2xl p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      isManualAnswer(selected)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isManualAnswer(selected) ? 'Manually answered' : 'Needs manual answer'}
                  </div>
                  <h2 className="text-xl font-semibold leading-snug">{selected.question}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {SUBJECT_META[selected.subject]?.label || selected.subject} | {selected.topic}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAnswer}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save as manual'}
                </button>
              </div>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Answer</span>
                <RichAnswerEditor
                  rows={16}
                  value={draftAnswer}
                  onChange={setDraftAnswer}
                  placeholder="Write the manual answer here..."
                />
              </label>
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-center text-sm text-muted">
              Select a question to edit its answer.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
