function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

function uniqueWords(list) {
  return [...new Set(list)];
}

function checkFeynmanAnswer(userAnswer, question) {
  const userTokens = new Set(tokenize(userAnswer));
  const keySources = [
    ...(question.keyPoints || []),
    question.answer || '',
    question.topic || '',
  ];
  const expectedTokens = uniqueWords(keySources.flatMap(tokenize));

  const matched = [];
  const missed = [];

  for (const token of expectedTokens.slice(0, 40)) {
    if (userTokens.has(token)) matched.push(token);
    else missed.push(token);
  }

  const coverage =
    expectedTokens.length > 0
      ? Math.round((matched.length / Math.min(expectedTokens.length, 40)) * 100)
      : 0;

  let feedback = 'Good start — compare your explanation with the model answer.';
  if (coverage >= 70) feedback = 'Strong explanation. You covered most of the key ideas.';
  else if (coverage >= 40) feedback = 'Partial coverage. You hit some key points but missed important details.';
  else feedback = 'Try again — focus on the core concepts and use simpler language.';

  return {
    coverage,
    matchedKeywords: matched.slice(0, 12),
    missedKeywords: missed.slice(0, 12),
    feedback,
  };
}

module.exports = { checkFeynmanAnswer };
