const INTERVALS = [1, 3, 7, 14, 30, 60, 90];

const RATING = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
  blank: 1,
  partial: 2,
  confident: 4,
  shaky: 2,
};

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeRating(rating) {
  if (typeof rating === 'number') return Math.min(4, Math.max(1, rating));
  const key = String(rating || '').toLowerCase();
  return RATING[key] || 3;
}

function computeNextReview({ reviewCount = 0, easeFactor = 2.5, rating }) {
  const score = normalizeRating(rating);
  let nextEase = easeFactor;
  let intervalDays = 1;
  let nextCount = reviewCount;

  if (score <= 1) {
    nextCount = 0;
    intervalDays = 1;
    nextEase = Math.max(1.3, easeFactor - 0.2);
  } else if (score === 2) {
    nextCount = Math.max(0, reviewCount);
    intervalDays = INTERVALS[Math.min(nextCount, INTERVALS.length - 1)] || 1;
    nextEase = Math.max(1.3, easeFactor - 0.05);
  } else {
    nextCount = reviewCount + 1;
    const base = INTERVALS[Math.min(nextCount - 1, INTERVALS.length - 1)] || 14;
    intervalDays = score === 4 ? Math.round(base * nextEase) : base;
    nextEase = score === 4 ? easeFactor + 0.1 : easeFactor;
  }

  return {
    reviewCount: nextCount,
    easeFactor: Math.round(nextEase * 100) / 100,
    nextReviewAt: addDays(startOfDay(), intervalDays),
    intervalDays,
  };
}

function scheduleInitialReview() {
  return {
    reviewCount: 0,
    easeFactor: 2.5,
    nextReviewAt: addDays(startOfDay(), 1),
    intervalDays: 1,
  };
}

module.exports = {
  INTERVALS,
  RATING,
  normalizeRating,
  computeNextReview,
  scheduleInitialReview,
  startOfDay,
  addDays,
};
