export function calcWpm(correctChars, elapsedMs) {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

export function calcAccuracy(correctChars, totalTyped) {
  if (totalTyped <= 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
}

export function countCorrectChars(target, typed) {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct += 1;
  }
  return correct;
}

export function countErrors(target, typed) {
  let errors = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== target[i]) errors += 1;
  }
  return errors;
}

export function getCharStatus(target, typed, index) {
  if (index >= typed.length) {
    return index === typed.length ? 'current' : 'pending';
  }
  return typed[index] === target[index] ? 'correct' : 'incorrect';
}

export function isSnippetComplete(target, typed) {
  return typed.length >= target.length;
}

export function pickSnippet(snippets, category, excludeText) {
  const pool =
    category === 'all' ? snippets : snippets.filter((s) => s.category === category);
  if (!pool.length) return snippets[0];
  const filtered = excludeText
    ? pool.filter((s) => s.text !== excludeText && s.question !== excludeText)
    : pool;
  const choices = filtered.length ? filtered : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function loadTypingStats(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTypingStats(storageKey, stats) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(stats));
  } catch {
    /* non-blocking */
  }
}

export function updateBestScore(stats, category, wpm) {
  const key = category || 'all';
  const prev = stats[key]?.bestWpm || 0;
  if (wpm <= prev) return stats;
  return {
    ...stats,
    [key]: {
      bestWpm: wpm,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
