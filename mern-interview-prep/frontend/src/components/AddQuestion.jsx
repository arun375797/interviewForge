import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, SUBJECT_META } from '../api';

export default function AddQuestion() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: params.get('subject') || 'javascript',
    topic: params.get('topic') || '',
    question: '',
    answer: '',
    difficulty: 'medium',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.createQuestion({
        ...form,
        answer: form.answer || undefined,
      });
      navigate(`/subject/${created.subject}?topic=${encodeURIComponent(created.topic)}&q=${created._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Add a question</h1>
      <p className="mt-2 text-sm text-muted">
        Leave the answer blank to auto-generate an interview-style response.
      </p>

      <form onSubmit={submit} className="glass-panel mt-6 space-y-4 rounded-2xl p-6">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Subject</span>
          <select
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          >
            {Object.entries(SUBJECT_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Topic</span>
          <input
            required
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            placeholder="e.g. Hooks Rules & Core Hooks"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Question</span>
          <textarea
            required
            rows={3}
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Answer (optional)</span>
          <textarea
            rows={8}
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            placeholder="Write how you'd answer in an interview…"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Difficulty</span>
          <select
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create question'}
        </button>
      </form>
    </div>
  );
}
