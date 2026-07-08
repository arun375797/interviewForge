import { useEffect, useState } from 'react';
import {
  X,
  Bookmark,
  CheckCircle2,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api';

export default function QuestionDetail({ question, onClose, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    question: question.question,
    answer: question.answer,
    topic: question.topic,
    difficulty: question.difficulty,
    notes: question.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm({
      question: question.question,
      answer: question.answer,
      topic: question.topic,
      difficulty: question.difficulty,
      notes: question.notes || '',
    });
    setEditing(false);
    setConfirmDelete(false);
    setError('');
  }, [question]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateQuestion(question._id, form);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kind) => {
    try {
      const updated =
        kind === 'bookmark'
          ? await api.toggleBookmark(question._id)
          : await api.toggleMastered(question._id);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.deleteQuestion(question._id);
      onDeleted(question._id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="animate-rise relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-[#fffcf6] shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {question.subject} · {question.difficulty}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">
              {editing ? 'Edit question' : 'Interview answer'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line p-2 hover:bg-paper-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          {editing ? (
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Question</span>
                <textarea
                  rows={3}
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Topic</span>
                <input
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Answer (interview style)</span>
                <textarea
                  rows={12}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-sans leading-relaxed outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Personal notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                />
              </label>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Question</p>
                <p className="mt-2 text-lg font-medium leading-snug">{question.question}</p>
                <p className="mt-2 text-sm text-muted">{question.topic}</p>
              </div>

              <div className="rounded-2xl border border-line bg-paper/70 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  How I&apos;d answer in an interview
                </p>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                  {question.answer}
                </div>
              </div>

              {question.keyPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Key talking points
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {question.keyPoints.map((p) => (
                      <li key={p} className="flex gap-2 text-sm text-ink-soft">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.notes ? (
                <div className="rounded-xl border border-dashed border-line p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{question.notes}</p>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toggle('bookmark')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  question.bookmarked
                    ? 'border-accent-2 bg-orange-50 text-accent-2'
                    : 'border-line'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${question.bookmarked ? 'fill-current' : ''}`} />
                {question.bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                type="button"
                onClick={() => toggle('mastered')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  question.mastered ? 'border-accent bg-teal-50 text-accent' : 'border-line'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {question.mastered ? 'Mastered' : 'Mark mastered'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              {confirmDelete ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                >
                  Confirm delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
