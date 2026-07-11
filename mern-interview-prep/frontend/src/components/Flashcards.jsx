import { useEffect, useState } from 'react';
import { Layers, RotateCcw, Shuffle } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import { REVIEW_RATINGS } from '../utils/learningConstants';
import RatingButtons from './RatingButtons';

export default function Flashcards() {
  const [subject, setSubject] = useState('');
  const [source, setSource] = useState('all');
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    setFlipped(false);
    setIndex(0);
    try {
      const data = await api.getFlashcards({
        subject: subject || undefined,
        source,
        limit: 50,
      });
      setCards(data.cards || []);
    } catch (err) {
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, source]);

  const card = cards[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(cards.length, 1));
  };

  const rate = async (rating) => {
    if (card?.questionId) {
      try {
        await api.submitReview(card.questionId, rating);
      } catch {
        /* non-blocking */
      }
    }
    next();
  };

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Flashcards
        </h1>
        <p className="mt-2 text-sm text-muted">
          Quick flip cards built from questions and key points — perfect for short review sessions.
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:flex-wrap">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">All subjects</option>
          {Object.entries(SUBJECT_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="all">All cards</option>
          <option value="due">Due for review</option>
          <option value="bookmarked">Bookmarked</option>
          <option value="weak">Weak spots</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm"
        >
          <Shuffle className="h-4 w-4" />
          Reshuffle
        </button>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="skeleton h-72 rounded-3xl" />
      ) : !cards.length ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Layers className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 font-display text-xl font-semibold">No flashcards found</p>
          <p className="mt-2 text-sm text-muted">Try a different filter or mark more questions as covered.</p>
        </div>
      ) : (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
            className="glass-panel min-h-[280px] cursor-pointer rounded-3xl p-8 transition hover:border-accent/40"
          >
            <p
              className="font-mono text-xs uppercase tracking-[0.18em]"
              style={{ color: SUBJECT_META[card.subject]?.accent }}
            >
              {SUBJECT_META[card.subject]?.label} · {card.type === 'keyPoint' ? 'Key point' : 'Question'}
            </p>
            <p className="mt-2 text-xs text-muted">{card.topic}</p>
            <p className="overflow-anywhere mt-6 font-display text-xl font-semibold leading-snug sm:text-2xl">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-8 text-center text-xs text-muted">
              {flipped ? 'Tap to see question' : 'Tap to flip'}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Card {index + 1} of {cards.length}
            </span>
            <button type="button" onClick={next} className="inline-flex items-center gap-1 hover:text-ink">
              Skip <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {flipped && (
            <div>
              <p className="mb-3 text-sm font-medium">Rate this card</p>
              <RatingButtons ratings={REVIEW_RATINGS} onRate={rate} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
