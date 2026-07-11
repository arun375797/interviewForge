const FOLLOW_UP_PATTERNS = [
  {
    test: /complexity|big\s*o|time\s+complexity|space\s+complexity/i,
    followUps: [
      'Can you optimize this further? What would the improved complexity be?',
      'What is the trade-off between time and space here?',
      'How does this scale with input size in production?',
    ],
  },
  {
    test: /react|component|hook|jsx|virtual\s*dom/i,
    followUps: [
      'How would you optimize re-renders in this scenario?',
      'What happens if this component unmounts during an async call?',
      'How would you test this in a real application?',
    ],
  },
  {
    test: /node|express|middleware|api|server/i,
    followUps: [
      'How would you handle errors and logging in production?',
      'What security concerns should we consider here?',
      'How would you scale this under high traffic?',
    ],
  },
  {
    test: /async|promise|await|callback|event\s*loop/i,
    followUps: [
      'What happens if one promise rejects in a chain?',
      'How would you debug a race condition here?',
      'Can you explain the order of execution step by step?',
    ],
  },
  {
    test: /array|sort|search|tree|graph|stack|queue|linked/i,
    followUps: [
      'What edge cases would you handle?',
      'Can you walk through your approach with a small example?',
      'What is the worst-case input for your solution?',
    ],
  },
  {
    test: /closure|scope|this|prototype|class/i,
    followUps: [
      'Can you show a short code example?',
      'What common mistake do candidates make here?',
      'How is this different in strict mode?',
    ],
  },
];

const GENERIC_FOLLOW_UPS = [
  'Can you give a real-world example from a project you worked on?',
  'What would you do differently if requirements changed?',
  'What follow-up question might the interviewer ask next?',
  'How would you explain this to a junior developer?',
  'What are the trade-offs of your approach?',
];

function generateFollowUps(question) {
  const text = `${question.question || ''} ${question.topic || ''} ${(question.tags || []).join(' ')}`;
  const matched = [];

  for (const pattern of FOLLOW_UP_PATTERNS) {
    if (pattern.test.test(text)) {
      matched.push(...pattern.followUps);
    }
  }

  const pool = matched.length ? matched : GENERIC_FOLLOW_UPS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

module.exports = { generateFollowUps };
