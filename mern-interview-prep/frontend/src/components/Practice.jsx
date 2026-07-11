import { useEffect, useState } from 'react';
import { Layers, Shuffle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import { useAuth } from '../context/AuthContext';
import AnswerContent from './AnswerContent';
import QuestionDetail from './QuestionDetail';
import { RECALL_RATINGS } from '../utils/learningConstants';
import RatingButtons from './RatingButtons';

export default function Practice() {
  const { isAdmin } = useAuth();
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [mode, setMode] = useState('recall');
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [interleavedDeck, setInterleavedDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);

  const loadRandom = async () => {
    setLoading(true);
    setError('');
    setReveal(false);
    setUserAnswer('');
    try {
      const q = await api.getRandom({
        subject: subject || undefined,
        difficulty: difficulty || undefined,
      });
      setQuestion(q);
      setInterleavedDeck([]);
      setDeckIndex(0);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const loadInterleaved = async () => {
    setLoading(true);
    setError('');
    setReveal(false);
    setUserAnswer('');
    try {
      const { items } = await api.getInterleaved({
        subject: subject || undefined,
        difficulty: difficulty || undefined,
        count: 10,
      });
      if (!items?.length) throw new Error('No questions found');
      setInterleavedDeck(items);
      setDeckIndex(0);
      setQuestion(items[0]);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const load = () => (mode === 'interleaved' ? loadInterleaved() : loadRandom());

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, difficulty, mode]);

  const nextInDeck = () => {
    setReveal(false);
    setUserAnswer('');
    if (mode === 'interleaved' && interleavedDeck.length) {
      const next = (deckIndex + 1) % interleavedDeck.length;
      setDeckIndex(next);
      setQuestion(interleavedDeck[next]);
    } else {
      loadRandom();
    }
  };

  const rate = async (rating) => {
    if (question) {
      try {
        await api.submitReview(question._id, rating);
      } catch {
        /* non-blocking */
      }
    }
    nextInDeck();
  };

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Practice mode
        </h1>
        <p className="mt-2 text-sm text-muted">
          Active recall — write your answer first, then reveal and rate yourself. Use interleaved
          mode to mix topics like a real interview.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'recall', label: 'Active recall', icon: Shuffle },
          { key: 'interleaved', label: 'Interleaved', icon: Layers },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
              mode === key ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
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
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent sm:w-auto"
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

      {mode === 'interleaved' && interleavedDeck.length > 0 && (
        <p className="text-xs text-muted">
          Interleaved deck: question {deckIndex + 1} of {interleavedDeck.length} (mixed topics)
        </p>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {question && (
        <div className="glass-panel rounded-2xl p-5 sm:rounded-3xl sm:p-8">
          <p
            className="font-mono text-xs uppercase tracking-[0.18em]"
            style={{ color: SUBJECT_META[question.subject]?.accent }}
          >
            {SUBJECT_META[question.subject]?.label || question.subject} · {question.difficulty}
          </p>
          <h2 className="overflow-anywhere mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
            {question.question}
          </h2>
          <p className="overflow-anywhere mt-3 text-sm text-muted">{question.topic}</p>

          {!reveal && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">Your answer (before revealing)</label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={4}
                placeholder="Answer out loud or type key points here…"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="mt-8 grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {reveal ? 'Hide answer' : 'Reveal answer'}
            </button>
            <button
              type="button"
              onClick={() => setOpenDetail(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm"
            >
              {isAdmin ? 'Edit / bookmark' : 'View / bookmark'}
            </button>
            {!reveal && (
              <button
                type="button"
                onClick={nextInDeck}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Skip
              </button>
            )}
          </div>

          {reveal && (
            <>
              <div className="animate-fade mt-6 rounded-2xl border border-line bg-paper/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Answer</p>
                <div className="mt-3">
                  <AnswerContent>{question.answer}</AnswerContent>
                </div>
                {userAnswer.trim() && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase text-muted">Your attempt</p>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{userAnswer}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">Rate your recall</p>
                <RatingButtons ratings={RECALL_RATINGS} onRate={rate} />
              </div>
            </>
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
