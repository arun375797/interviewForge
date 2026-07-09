import { useEffect, useState } from 'react';
import { Shuffle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import AnswerContent from './AnswerContent';
import QuestionDetail from './QuestionDetail';

export default function Practice() {
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [question, setQuestion] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDetail, setOpenDetail] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    setReveal(false);
    try {
      const q = await api.getRandom({
        subject: subject || undefined,
        difficulty: difficulty || undefined,
      });
      setQuestion(q);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, difficulty]);

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Practice mode
        </h1>
        <p className="mt-2 text-sm text-muted">
          Draw a random question, answer out loud, then reveal the interview-style response.
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">All subjects</option>
          {Object.entries(SUBJECT_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
        >
          <Shuffle className="h-4 w-4" />
          {loading ? 'Loading…' : 'New question'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {question && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <p
            className="font-mono text-xs uppercase tracking-[0.18em]"
            style={{ color: SUBJECT_META[question.subject]?.accent }}
          >
            {SUBJECT_META[question.subject]?.label || question.subject} · {question.difficulty}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
            {question.question}
          </h2>
          <p className="mt-3 text-sm text-muted">{question.topic}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {reveal ? 'Hide answer' : 'Reveal answer'}
            </button>
            <button
              type="button"
              onClick={() => setOpenDetail(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm"
            >
              Edit / bookmark
            </button>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Next
            </button>
          </div>

          {reveal && (
            <div className="animate-fade mt-6 rounded-2xl border border-line bg-paper/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Answer
              </p>
              <div className="mt-3">
                <AnswerContent>{question.answer}</AnswerContent>
              </div>
            </div>
          )}
        </div>
      )}

      {openDetail && question && (
        <QuestionDetail
          question={question}
          onClose={() => setOpenDetail(false)}
          onUpdated={(q) => setQuestion(q)}
          onDeleted={() => {
            setOpenDetail(false);
            load();
          }}
        />
      )}
    </div>
  );
}
