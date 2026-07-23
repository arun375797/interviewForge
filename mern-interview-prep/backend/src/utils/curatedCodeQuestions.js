const path = require('path');
const fs = require('fs');

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const DIFFICULTY_MAP = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

const BANKS = [
  {
    primarySubject: 'javascript',
    practicePath: path.join(__dirname, '../../data/javascript-code-practice.json'),
    topicOrderPath: path.join(__dirname, '../../data/javascript-code-topic-order.json'),
  },
  {
    primarySubject: 'dsa',
    practicePath: path.join(__dirname, '../../data/dsa-code-practice.json'),
    topicOrderPath: path.join(__dirname, '../../data/dsa-code-topic-order.json'),
  },
  {
    primarySubject: 'nodejs',
    practicePath: path.join(__dirname, '../../data/nodejs-code-practice.json'),
    topicOrderPath: path.join(__dirname, '../../data/nodejs-code-topic-order.json'),
  },
  {
    primarySubject: 'react',
    practicePath: path.join(__dirname, '../../data/react-code-practice.json'),
    topicOrderPath: path.join(__dirname, '../../data/react-code-topic-order.json'),
  },
];

function mapPracticeItem(item, topicOrder, primarySubject) {
  return {
    id: item.id,
    topic: item.topic,
    title: item.title,
    type: item.type || 'coding',
    difficulty: DIFFICULTY_MAP[item.difficulty] || 'medium',
    task: item.task,
    functionName: item.functionName || 'solve',
    starterCode: item.starterCode || '',
    sampleInput: item.sampleInput,
    expectedOutput: item.expectedOutput,
    constraints: item.constraints || [],
    subjects: [primarySubject],
    tags: item.tags || [],
    hint: item.hint || '',
    sourceQuestions: item.sourceQuestions || [],
    implementationType: item.implementationType || '',
    topicOrder: topicOrder[item.topic] || 999,
    primarySubject,
  };
}

const TOPIC_ORDER = {};
const CODE_PRACTICE_QUESTIONS = [];

for (const bank of BANKS) {
  const practiceData = loadJson(bank.practicePath, { questions: [] });
  const topicOrder = loadJson(bank.topicOrderPath, {});
  Object.assign(TOPIC_ORDER, topicOrder);

  for (const item of practiceData.questions || []) {
    CODE_PRACTICE_QUESTIONS.push(mapPracticeItem(item, topicOrder, bank.primarySubject));
  }
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[`'"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CURATED_BY_SUBJECT_AND_TITLE = new Map();
for (const item of CODE_PRACTICE_QUESTIONS) {
  for (const subject of item.subjects) {
    CURATED_BY_SUBJECT_AND_TITLE.set(`${subject}:${normalizeTitle(item.title)}`, item);
  }
}

function findCuratedCodeQuestion(subject, title) {
  return CURATED_BY_SUBJECT_AND_TITLE.get(`${subject}:${normalizeTitle(title)}`) || null;
}

function getCodeTopicOrder(topic) {
  return TOPIC_ORDER[topic] || 999;
}

module.exports = {
  CODE_PRACTICE_QUESTIONS,
  findCuratedCodeQuestion,
  normalizeTitle,
  getCodeTopicOrder,
  TOPIC_ORDER,
};
