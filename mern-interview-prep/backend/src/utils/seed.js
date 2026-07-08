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

const DESCRIPTIONS = {
  javascript:
    'Core JavaScript interview questions — language fundamentals to async, DOM, and patterns.',
  react: 'React interview questions — components, hooks, Redux, performance, and modern patterns.',
  nodejs: 'Node.js & Express interview questions — runtime, APIs, middleware, security, and scaling.',
  dsa: 'Data Structures & Algorithms — complexity, arrays to graphs, with interview-ready explanations.',
};

async function buildAndInsert() {
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
      questionCount: subject.questionCount,
      topicCount: subject.topicCount,
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
          bookmarked: false,
          mastered: false,
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
  console.log('Seed complete. Counts:', counts);
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
