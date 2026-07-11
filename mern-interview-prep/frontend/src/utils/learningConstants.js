export const REVIEW_RATINGS = [
  { key: 'again', label: 'Again', desc: 'Forgot it', color: 'rose' },
  { key: 'hard', label: 'Hard', desc: 'Struggled', color: 'amber' },
  { key: 'good', label: 'Good', desc: 'Got it', color: 'teal' },
  { key: 'easy', label: 'Easy', desc: 'Too easy', color: 'emerald' },
];

export const RECALL_RATINGS = [
  { key: 'blank', label: "Didn't know", color: 'rose' },
  { key: 'partial', label: 'Partial', color: 'amber' },
  { key: 'good', label: 'Got it', color: 'teal' },
  { key: 'easy', label: 'Easy', color: 'emerald' },
];

export const MOCK_RATINGS = [
  { key: 'blank', label: 'Blank', color: 'rose' },
  { key: 'shaky', label: 'Shaky', color: 'amber' },
  { key: 'good', label: 'Confident', color: 'teal' },
  { key: 'easy', label: 'Nailed it', color: 'emerald' },
];

export function ratingButtonClass(color, active) {
  const map = {
    rose: active
      ? 'border-rose-300 bg-rose-50 text-rose-800'
      : 'border-line hover:border-rose-200 hover:bg-rose-50/50',
    amber: active
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : 'border-line hover:border-amber-200 hover:bg-amber-50/50',
    teal: active
      ? 'border-teal-300 bg-teal-50 text-teal-800'
      : 'border-line hover:border-teal-200 hover:bg-teal-50/50',
    emerald: active
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
      : 'border-line hover:border-emerald-200 hover:bg-emerald-50/50',
  };
  return map[color] || map.teal;
}
