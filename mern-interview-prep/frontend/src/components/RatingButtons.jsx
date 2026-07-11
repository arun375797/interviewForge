import { Link } from 'react-router-dom';
import { REVIEW_RATINGS, ratingButtonClass } from '../utils/learningConstants';

export default function RatingButtons({ ratings = REVIEW_RATINGS, onRate, disabled, selected }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ratings.map((r) => (
        <button
          key={r.key}
          type="button"
          disabled={disabled}
          onClick={() => onRate(r.key)}
          className={`rounded-xl border px-3 py-3 text-left text-sm transition disabled:opacity-50 ${ratingButtonClass(
            r.color,
            selected === r.key
          )}`}
        >
          <span className="block font-semibold">{r.label}</span>
          {r.desc ? <span className="mt-0.5 block text-xs opacity-80">{r.desc}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function ReviewDueBanner({ summary, loading }) {
  if (loading || !summary?.dueToday) return null;
  return (
    <Link
      to="/review"
      className="glass-panel flex items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-teal-50/50 p-4 transition hover:border-accent"
    >
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          {summary.dueToday} question{summary.dueToday === 1 ? '' : 's'} due for review
        </p>
        <p className="mt-1 text-sm text-muted">
          Questions you added manually — open any answer and tap Add to daily review.
        </p>
      </div>
      <span className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
        Review now
      </span>
    </Link>
  );
}
