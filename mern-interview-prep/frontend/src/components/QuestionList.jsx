import { Bookmark, CheckCircle2 } from 'lucide-react';

const difficultyStyle = {
  easy: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-900',
  hard: 'bg-rose-100 text-rose-800',
};

export default function QuestionList({ questions, loading, onSelect, selectedId }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="font-display text-xl font-semibold">No questions found</p>
        <p className="mt-2 text-sm text-muted">Try another topic or clear your search filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {questions.map((q, idx) => (
        <button
          key={q._id}
          type="button"
          onClick={() => onSelect(q._id)}
          className={`glass-panel w-full rounded-xl px-4 py-3.5 text-left transition hover:-translate-y-px hover:shadow-md ${
            selectedId === q._id ? 'ring-2 ring-accent' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-xs text-muted tabular-nums">
              {String(q.order || idx + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="overflow-anywhere text-sm font-medium leading-snug text-ink sm:text-[15px]">{q.question}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    difficultyStyle[q.difficulty] || difficultyStyle.medium
                  }`}
                >
                  {q.difficulty}
                </span>
                <span className="overflow-anywhere text-xs text-muted">{q.topic}</span>
                {q.bookmarked && <Bookmark className="h-3.5 w-3.5 fill-accent-2 text-accent-2" />}
                {q.mastered && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
