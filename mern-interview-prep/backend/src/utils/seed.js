require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const {
  generateAnswer,
  generateKeyPoints,
  difficultyFromQuestion,
} = require('./answerGenerator');
const { CODE_PRACTICE_QUESTIONS } = require('./curatedCodeQuestions');

const DESCRIPTIONS = {
  javascript:
    'Core JavaScript interview questions — language fundamentals to async, DOM, and patterns.',
  mongodb:
    'MongoDB interview questions — documents, CRUD, indexes, aggregation, modeling, and operations.',
  react: 'React interview questions — components, hooks, Redux, performance, and modern patterns.',
  nodejs: 'Node.js & Express interview questions — runtime, APIs, middleware, security, and scaling.',
  dsa: 'Data Structures & Algorithms — complexity, arrays to graphs, with interview-ready explanations.',
};

function formatExpectedOutput(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  return JSON.stringify(value, null, 2);
}

async function seedCodePractice() {
  console.log('Seeding curated code practice questions...');
  const operations = [];
  CODE_PRACTICE_QUESTIONS.forEach((item, index) => {
    item.subjects.forEach((subject) => {
      operations.push({
        insertOne: {
          document: {
            subject,
            topic: item.topic,
            topicOrder: item.topicOrder || index + 1,
            question: item.title,
            answer: formatExpectedOutput(item.expectedOutput),
            keyPoints: [
              `Code topic: ${item.topic}`,
              `Task: ${item.task}`,
              `Expected output: ${formatExpectedOutput(item.expectedOutput)}`,
              ...(item.hint ? [`Hint: ${item.hint}`] : []),
            ],
            difficulty: item.difficulty || 'medium',
            tags: [
              'code-curated',
              'code-practice',
              subject,
              item.topic.toLowerCase(),
              ...(item.tags || []).slice(0, 6),
            ],
            codeOnly: true,
            order: index + 1,
          },
        },
      });
    });
  });

  if (operations.length) {
    await Question.bulkWrite(operations, { ordered: false });
  }
  console.log(`Inserted ${operations.length} code practice question rows.`);
}

async function buildAndInsert({ includeCodePractice = true } = {}) {
  const dataPath = path.join(__dirname, '../../data/parsed-questions.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Seed data not found at ${dataPath}`);
  }
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Clearing existing questions & subjects...');
  await Question.deleteMany({});
  await Subject.deleteMany({});

  const subjectDocs = [];
  const questionDocs = [];

  for (const [key, subject] of Object.entries(data)) {
    subjectDocs.push({
      key,
      label: subject.label,
      color: subject.color,
      description: DESCRIPTIONS[key] || '',
      supportsCode: key === 'javascript' || key === 'dsa' || key === 'nodejs' || key === 'react',
      short: key === 'javascript' ? 'JS' : key === 'nodejs' ? 'Node' : key === 'mongodb' ? 'Mongo' : subject.label,
      order: ['javascript', 'mongodb', 'react', 'nodejs', 'dsa'].indexOf(key) + 1,
      questionCount: subject.questionCount,
      topicCount: subject.topicCount,
      topics: (subject.topics || []).map((topic) => ({
        name: topic.name,
        order: topic.order || 0,
        codePractice: false,
      })),
    });

    for (const topic of subject.topics) {
      topic.questions.forEach((q, idx) => {
        questionDocs.push({
          subject: key,
          topic: topic.name,
          topicOrder: topic.order,
          question: q,
          answer: generateAnswer(q, key, topic.name),
          keyPoints: generateKeyPoints(q, key, topic.name),
          difficulty: difficultyFromQuestion(q, topic.name),
          tags: [key, topic.name.split(/[,&/]/)[0].trim().toLowerCase()].filter(Boolean),
          notes: '',
          order: idx + 1,
        });
      });
    }
  }

  console.log(`Inserting ${subjectDocs.length} subjects...`);
  await Subject.insertMany(subjectDocs);

  console.log(`Inserting ${questionDocs.length} questions in batches...`);
  const BATCH = 500;
  for (let i = 0; i < questionDocs.length; i += BATCH) {
    const slice = questionDocs.slice(i, i + BATCH);
    await Question.insertMany(slice, { ordered: false });
    console.log(`  ${Math.min(i + BATCH, questionDocs.length)} / ${questionDocs.length}`);
  }

  const counts = await Question.aggregate([{ $group: { _id: '$subject', n: { $sum: 1 } } }]);
  console.log('Interview seed complete. Counts:', counts);

  if (includeCodePractice) {
    await seedCodePractice();
  }

  return questionDocs.length;
}

/** Auto-seed on boot if DB is empty (safe for Render first deploy). */
async function ensureSeeded() {
  const count = await Question.countDocuments();
  if (count > 0) {
    console.log(`Database already has ${count} questions — skip auto-seed.`);
    return { seeded: false, count };
  }
  console.log('Database empty — auto-seeding questions (first boot)...');
  const inserted = await buildAndInsert();
  return { seeded: true, count: inserted };
}

async function runCliSeed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_interview_prep';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');
  await buildAndInsert();
  await mongoose.disconnect();
}

module.exports = { ensureSeeded, buildAndInsert };

if (require.main === module) {
  runCliSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
