import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Code2,
  FileQuestion,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionDetail from './QuestionDetail';

const COLOR_PRESETS = ['#0F766E', '#CA8A04', '#0891B2', '#16A34A', '#DB2777', '#7C3AED', '#EA580C'];

const emptySubjectForm = {
  label: '',
  key: '',
  short: '',
  color: '#0F766E',
  description: '',
  supportsCode: false,
};

const emptyQuestionForm = {
  question: '',
  answer: '',
  difficulty: 'medium',
  notes: '',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function difficultyClass(difficulty) {
  if (difficulty === 'easy') return 'bg-emerald-100 text-emerald-800';
  if (difficulty === 'hard') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-900';
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [mode, setMode] = useState('study');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [editingSubject, setEditingSubject] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [renamingTopic, setRenamingTopic] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const selectedSubject = useMemo(
    () => subjects.find((item) => item.key === selectedKey) || null,
    [subjects, selectedKey]
  );

  const stats = useMemo(
    () => ({
      subjects: subjects.length,
      questions: subjects.reduce((sum, item) => sum + (item.questionCount || 0), 0),
      code: subjects.reduce((sum, item) => sum + (item.codeQuestionCount || 0), 0),
      topics: subjects.reduce((sum, item) => sum + (item.topicCount || 0), 0),
    }),
    [subjects]
  );

  const loadSubjects = useCallback(async (preferKey = '') => {
    setLoadingSubjects(true);
    setError('');
    try {
      const data = await api.getAdminSubjects();
      setSubjects(data || []);
      setSelectedKey((current) => {
        if (preferKey && data.some((item) => item.key === preferKey)) return preferKey;
        if (current && data.some((item) => item.key === current)) return current;
        return data[0]?.key || '';
      });
    } catch (err) {
      setError(err.message || 'Could not load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const loadTopics = useCallback(async (key, nextMode = mode) => {
    if (!key) {
      setTopics([]);
      return;
    }
    setLoadingTopics(true);
    setError('');
    try {
      const data = await api.getAdminSubjectTopics(key, { mode: nextMode });
      const nextTopics = data?.topics || [];
      setTopics(nextTopics);
      setSelectedTopic((current) => {
        if (current && nextTopics.some((topic) => topic.name === current)) return current;
        return nextTopics[0]?.name || '';
      });
    } catch (err) {
      setTopics([]);
      setError(err.message || 'Could not load topics');
    } finally {
      setLoadingTopics(false);
    }
  }, [mode]);

  const loadQuestions = useCallback(async (key, topic, nextMode = mode) => {
    if (!key || !topic) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    setError('');
    try {
      const loader =
        nextMode === 'code'
          ? api.getCodeQuestions({ subject: key, topic, limit: 200 }, { cache: 'no-store' })
          : api.getQuestions(
              { subject: key, topic, limit: 200, includeAnswer: 'true' },
              { cache: 'no-store' }
            );
      const data = await loader;
      setQuestions(data?.items || []);
    } catch (err) {
      setQuestions([]);
      setError(err.message || 'Could not load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [mode]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (!selectedKey) {
      setTopics([]);
      setSelectedTopic('');
      return;
    }
    if (mode === 'code' && selectedSubject && !selectedSubject.supportsCode) {
      setMode('study');
      return;
    }
    loadTopics(selectedKey, mode);
  }, [selectedKey, mode, selectedSubject, loadTopics]);

  useEffect(() => {
    loadQuestions(selectedKey, selectedTopic, mode);
  }, [selectedKey, selectedTopic, mode, loadQuestions]);

  const flash = (text) => {
    setMessage(text);
    setError('');
  };

  const openCreateSubject = () => {
    setEditingSubject(false);
    setSubjectForm(emptySubjectForm);
    setShowSubjectForm(true);
  };

  const openEditSubject = () => {
    if (!selectedSubject) return;
    setEditingSubject(true);
    setSubjectForm({
      label: selectedSubject.label || '',
      key: selectedSubject.key || '',
      short: selectedSubject.short || SUBJECT_META[selectedSubject.key]?.short || '',
      color: selectedSubject.color || SUBJECT_META[selectedSubject.key]?.accent || '#0F766E',
      description: selectedSubject.description || '',
      supportsCode: Boolean(selectedSubject.supportsCode),
    });
    setShowSubjectForm(true);
  };

  const saveSubject = async (event) => {
    event.preventDefault();
    setBusy('subject');
    setError('');
    try {
      if (editingSubject) {
        await api.updateSubject(selectedKey, {
          label: subjectForm.label,
          short: subjectForm.short,
          color: subjectForm.color,
          description: subjectForm.description,
          supportsCode: subjectForm.supportsCode,
        });
        flash(`Updated ${subjectForm.label}`);
        await loadSubjects(selectedKey);
      } else {
        const created = await api.createSubject({
          label: subjectForm.label,
          key: subjectForm.key || slugify(subjectForm.label),
          short: subjectForm.short,
          color: subjectForm.color,
          description: subjectForm.description,
          supportsCode: subjectForm.supportsCode,
        });
        flash(`Created ${created.label}`);
        setShowSubjectForm(false);
        await loadSubjects(created.key);
      }
      setShowSubjectForm(false);
    } catch (err) {
      setError(err.message || 'Could not save subject');
    } finally {
      setBusy('');
    }
  };

  const removeSubject = async () => {
    if (!selectedSubject) return;
    const confirmed = window.confirm(
      `Delete subject "${selectedSubject.label}"?\n\nAll study and code questions under it will be permanently deleted.`
    );
    if (!confirmed) return;
    setBusy('delete-subject');
    setError('');
    try {
      await api.deleteSubject(selectedSubject.key, { cascade: true });
      flash(`Deleted ${selectedSubject.label}`);
      setSelectedTopic('');
      setQuestions([]);
      await loadSubjects();
    } catch (err) {
      setError(err.message || 'Could not delete subject');
    } finally {
      setBusy('');
    }
  };

  const createTopic = async (event) => {
    event.preventDefault();
    if (!selectedKey || !topicName.trim()) return;
    setBusy('topic');
    setError('');
    try {
      const created = await api.createTopic(selectedKey, {
        name: topicName.trim(),
        codePractice: mode === 'code',
      });
      setTopicName('');
      flash(`Created topic "${created.name}"`);
      await loadTopics(selectedKey, mode);
      setSelectedTopic(created.name);
      await loadSubjects(selectedKey);
    } catch (err) {
      setError(err.message || 'Could not create topic');
    } finally {
      setBusy('');
    }
  };

  const saveRenameTopic = async (event) => {
    event.preventDefault();
    if (!selectedKey || !renamingTopic || !renameValue.trim()) return;
    setBusy('rename');
    setError('');
    try {
      await api.renameTopic(selectedKey, {
        oldName: renamingTopic,
        newName: renameValue.trim(),
        codePractice: mode === 'code',
      });
      flash(`Renamed topic to "${renameValue.trim()}"`);
      setRenamingTopic('');
      setRenameValue('');
      setSelectedTopic(renameValue.trim());
      await loadTopics(selectedKey, mode);
      await loadQuestions(selectedKey, renameValue.trim(), mode);
      await loadSubjects(selectedKey);
    } catch (err) {
      setError(err.message || 'Could not rename topic');
    } finally {
      setBusy('');
    }
  };

  const moveTopic = async (topic, direction) => {
    const index = topics.findIndex((item) => item.name === topic.name);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= topics.length) return;

    const next = [...topics];
    const temp = next[index];
    next[index] = next[swapWith];
    next[swapWith] = temp;
    const payload = next.map((item, order) => ({ name: item.name, order: order + 1 }));

    setBusy(`reorder-${topic.name}`);
    setError('');
    try {
      await api.reorderTopics(selectedKey, {
        topics: payload,
        codePractice: mode === 'code',
      });
      await loadTopics(selectedKey, mode);
      flash('Topic order updated');
    } catch (err) {
      setError(err.message || 'Could not reorder topics');
    } finally {
      setBusy('');
    }
  };

  const removeTopic = async (topic) => {
    const confirmed = window.confirm(
      `Delete topic "${topic.name}"?\n\n${topic.count || 0} question(s) in this topic will also be deleted.`
    );
    if (!confirmed) return;
    setBusy(`delete-topic-${topic.name}`);
    setError('');
    try {
      await api.deleteTopic(selectedKey, {
        name: topic.name,
        codePractice: mode === 'code',
        cascade: true,
      });
      flash(`Deleted topic "${topic.name}"`);
      if (selectedTopic === topic.name) setSelectedTopic('');
      await loadTopics(selectedKey, mode);
      await loadSubjects(selectedKey);
    } catch (err) {
      setError(err.message || 'Could not delete topic');
    } finally {
      setBusy('');
    }
  };

  const createQuestion = async (event) => {
    event.preventDefault();
    if (!selectedKey || !selectedTopic) return;
    setBusy('question');
    setError('');
    try {
      const created = await api.createQuestion({
        subject: selectedKey,
        topic: selectedTopic,
        question: questionForm.question.trim(),
        answer: questionForm.answer.trim() || undefined,
        difficulty: questionForm.difficulty,
        notes: questionForm.notes.trim(),
        codeOnly: mode === 'code',
      });
      setQuestionForm(emptyQuestionForm);
      setShowQuestionForm(false);
      flash(mode === 'code' ? 'Code question created' : 'Study question created');
      await loadQuestions(selectedKey, selectedTopic, mode);
      await loadTopics(selectedKey, mode);
      await loadSubjects(selectedKey);
      setSelectedQuestion(created);
    } catch (err) {
      setError(err.message || 'Could not create question');
    } finally {
      setBusy('');
    }
  };

  const deleteQuestion = async (question) => {
    const label =
      mode === 'code'
        ? question.codePrompt?.title || question.question
        : question.question;
    const confirmed = window.confirm(`Delete this question?\n\n${label}`);
    if (!confirmed) return;
    setBusy(`delete-q-${question._id}`);
    setError('');
    try {
      await api.deleteQuestion(question._id);
      flash('Question deleted');
      if (selectedQuestion?._id === question._id) setSelectedQuestion(null);
      await loadQuestions(selectedKey, selectedTopic, mode);
      await loadTopics(selectedKey, mode);
      await loadSubjects(selectedKey);
    } catch (err) {
      setError(err.message || 'Could not delete question');
    } finally {
      setBusy('');
    }
  };

  const openQuestion = async (question) => {
    setBusy(`open-${question._id}`);
    try {
      const full =
        mode === 'code'
          ? await api.getCodeQuestion(question._id)
          : await api.getQuestion(question._id);
      setSelectedQuestion(full);
    } catch (err) {
      setError(err.message || 'Could not open question');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Subject management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Create subjects and topics, then add, edit, or delete study and coding questions from one
            place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/questions"
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2"
          >
            <FileQuestion className="h-4 w-4" />
            All questions
          </Link>
          <Link
            to="/add"
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2"
          >
            <Plus className="h-4 w-4" />
            Quick add
          </Link>
          <button
            type="button"
            onClick={() => loadSubjects(selectedKey)}
            disabled={loadingSubjects}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingSubjects ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateSubject}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            <Plus className="h-4 w-4" />
            New subject
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Subjects', value: stats.subjects, icon: Layers },
          { label: 'Study questions', value: stats.questions, icon: BookOpen },
          { label: 'Code questions', value: stats.code, icon: Code2 },
          { label: 'Topics', value: stats.topics, icon: FileQuestion },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
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

      {showSubjectForm ? (
        <form onSubmit={saveSubject} className="glass-panel space-y-4 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">
              {editingSubject ? 'Edit subject' : 'Create subject'}
            </h2>
            <button
              type="button"
              onClick={() => setShowSubjectForm(false)}
              className="text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Label</span>
              <input
                required
                value={subjectForm.label}
                onChange={(e) =>
                  setSubjectForm((prev) => ({
                    ...prev,
                    label: e.target.value,
                    key: editingSubject ? prev.key : slugify(e.target.value),
                    short: editingSubject ? prev.short : e.target.value.slice(0, 8),
                  }))
                }
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Key</span>
              <input
                required
                disabled={editingSubject}
                value={subjectForm.key}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, key: slugify(e.target.value) }))}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent disabled:opacity-60"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Short label</span>
              <input
                value={subjectForm.short}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, short: e.target.value }))}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Description</span>
              <textarea
                rows={2}
                value={subjectForm.description}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, color }))}
                    className={`h-8 w-8 rounded-full border-2 ${
                      subjectForm.color === color ? 'border-ink' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Pick ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={subjectForm.color}
                  onChange={(e) => setSubjectForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-line bg-paper"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={subjectForm.supportsCode}
                onChange={(e) =>
                  setSubjectForm((prev) => ({ ...prev, supportsCode: e.target.checked }))
                }
              />
              <span>
                <span className="font-medium">Enable code practice</span>
                <span className="mt-0.5 block text-muted">
                  Allows coding topics and code-only questions for this subject.
                </span>
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={busy === 'subject'}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy === 'subject' ? 'Saving…' : editingSubject ? 'Save changes' : 'Create subject'}
          </button>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-2xl p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Subjects</h2>
            <button
              type="button"
              onClick={openCreateSubject}
              className="rounded-lg border border-line p-1.5 text-muted hover:bg-paper-2 hover:text-ink"
              title="New subject"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {loadingSubjects ? (
            <div className="space-y-2">
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
            </div>
          ) : subjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-muted">
              No subjects yet.
            </p>
          ) : (
            <div className="space-y-1">
              {subjects.map((subject) => {
                const active = subject.key === selectedKey;
                const accent = subject.color || SUBJECT_META[subject.key]?.accent || '#0F766E';
                return (
                  <button
                    key={subject.key}
                    type="button"
                    onClick={() => setSelectedKey(subject.key)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                    }`}
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{subject.label}</span>
                      <span className={`mt-0.5 block text-xs ${active ? 'text-paper/70' : 'text-muted'}`}>
                        {subject.questionCount || 0} study · {subject.codeQuestionCount || 0} code
                        {subject.supportsCode ? ' · code on' : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="space-y-4">
          {selectedSubject ? (
            <>
              <div className="glass-panel rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className="font-mono text-[11px] uppercase tracking-[0.18em]"
                      style={{ color: selectedSubject.color || '#0F766E' }}
                    >
                      {selectedSubject.short || selectedSubject.key}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-semibold">{selectedSubject.label}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted">
                      {selectedSubject.description || 'No description yet.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openEditSubject}
                      className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium hover:bg-paper-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={removeSubject}
                      disabled={busy === 'delete-subject'}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('study')}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      mode === 'study'
                        ? 'bg-ink text-paper'
                        : 'border border-line text-muted hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    Study topics
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedSubject.supportsCode && setMode('code')}
                    disabled={!selectedSubject.supportsCode}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      mode === 'code'
                        ? 'bg-ink text-paper'
                        : 'border border-line text-muted hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    Code topics
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="glass-panel rounded-2xl p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {mode === 'code' ? 'Code topics' : 'Study topics'}
                    </h3>
                    <span className="text-xs text-muted">{topics.length} total</span>
                  </div>

                  <form onSubmit={createTopic} className="mb-4 flex gap-2">
                    <input
                      value={topicName}
                      onChange={(e) => setTopicName(e.target.value)}
                      placeholder="New topic name"
                      className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={busy === 'topic' || !topicName.trim()}
                      className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>

                  {loadingTopics ? (
                    <div className="space-y-2">
                      <div className="skeleton h-10 rounded-xl" />
                      <div className="skeleton h-10 rounded-xl" />
                    </div>
                  ) : topics.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-muted">
                      No topics yet. Create one to start adding questions.
                    </p>
                  ) : (
                    <div className="divide-y divide-line rounded-xl border border-line">
                      {topics.map((topic, index) => {
                        const active = topic.name === selectedTopic;
                        return (
                          <div
                            key={`${topic.name}-${topic.codePractice ? 'code' : 'study'}`}
                            className={`flex items-center gap-2 px-2 py-2 ${active ? 'bg-paper-2' : ''}`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedTopic(topic.name)}
                              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left"
                            >
                              <span className="block truncate text-sm font-medium">{topic.name}</span>
                              <span className="text-xs text-muted">{topic.count || 0} questions</span>
                            </button>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0 || Boolean(busy)}
                                onClick={() => moveTopic(topic, 'up')}
                                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === topics.length - 1 || Boolean(busy)}
                                onClick={() => moveTopic(topic, 'down')}
                                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingTopic(topic.name);
                                  setRenameValue(topic.name);
                                }}
                                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTopic(topic)}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {renamingTopic ? (
                    <form onSubmit={saveRenameTopic} className="mt-4 space-y-2 rounded-xl border border-line p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Rename topic
                      </p>
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busy === 'rename'}
                          className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingTopic('');
                            setRenameValue('');
                          }}
                          className="rounded-xl border border-line px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                <div className="glass-panel rounded-2xl p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {selectedTopic || 'Select a topic'}
                      </h3>
                      <p className="text-xs text-muted">
                        {mode === 'code' ? 'Coding questions' : 'Study questions'} in this topic
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!selectedTopic}
                      onClick={() => setShowQuestionForm((open) => !open)}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                      Add {mode === 'code' ? 'code' : 'study'} question
                    </button>
                  </div>

                  {showQuestionForm && selectedTopic ? (
                    <form onSubmit={createQuestion} className="mb-4 space-y-3 rounded-xl border border-line p-3">
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                          {mode === 'code' ? 'Title' : 'Question'}
                        </span>
                        <textarea
                          required
                          rows={2}
                          value={questionForm.question}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({ ...prev, question: e.target.value }))
                          }
                          className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                          {mode === 'code' ? 'Task / prompt' : 'Answer (optional)'}
                        </span>
                        <textarea
                          rows={4}
                          value={questionForm.answer}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({ ...prev, answer: e.target.value }))
                          }
                          className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-1 block font-medium">Difficulty</span>
                          <select
                            value={questionForm.difficulty}
                            onChange={(e) =>
                              setQuestionForm((prev) => ({ ...prev, difficulty: e.target.value }))
                            }
                            className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block font-medium">
                            {mode === 'code' ? 'Hint / notes' : 'Editor notes'}
                          </span>
                          <input
                            value={questionForm.notes}
                            onChange={(e) =>
                              setQuestionForm((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busy === 'question'}
                          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
                        >
                          {busy === 'question' ? 'Creating…' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuestionForm(false)}
                          className="rounded-xl border border-line px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {!selectedTopic ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-10 text-center text-sm text-muted">
                      Select or create a topic to manage its questions.
                    </p>
                  ) : loadingQuestions ? (
                    <div className="space-y-2">
                      <div className="skeleton h-14 rounded-xl" />
                      <div className="skeleton h-14 rounded-xl" />
                    </div>
                  ) : questions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-10 text-center text-sm text-muted">
                      No questions in this topic yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question) => {
                        const title =
                          mode === 'code'
                            ? question.codePrompt?.title || question.question
                            : question.question;
                        return (
                          <div
                            key={question._id}
                            className="flex items-start gap-2 rounded-xl border border-line px-3 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="overflow-anywhere text-sm font-medium">{title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                                <span
                                  className={`rounded-full px-2 py-0.5 font-medium ${difficultyClass(
                                    question.difficulty
                                  )}`}
                                >
                                  {question.difficulty || 'medium'}
                                </span>
                                {mode === 'code' && question.codeCompleted ? (
                                  <span>Completed</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => openQuestion(question)}
                                className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-paper-2"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteQuestion(question)}
                                disabled={busy === `delete-q-${question._id}`}
                                className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl px-4 py-16 text-center text-sm text-muted">
              {loadingSubjects ? 'Loading subjects…' : 'Create a subject to get started.'}
            </div>
          )}
        </section>
      </div>

      {selectedQuestion ? (
        <QuestionDetail
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdated={(updated) => {
            setSelectedQuestion(updated);
            setQuestions((prev) =>
              prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
            );
          }}
          onDeleted={(id) => {
            setSelectedQuestion(null);
            setQuestions((prev) => prev.filter((item) => item._id !== id));
            loadTopics(selectedKey, mode);
            loadSubjects(selectedKey);
          }}
        />
      ) : null}
    </div>
  );
}
