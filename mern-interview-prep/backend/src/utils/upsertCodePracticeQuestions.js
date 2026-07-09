require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Question = require('../models/Question');
const { CODE_PRACTICE_QUESTIONS } = require('./curatedCodeQuestions');

function formatExpectedOutput(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  return JSON.stringify(value, null, 2);
}

async function upsertCodePracticeQuestions() {
  await connectDB();

  let createdOrUpdated = 0;
  const operations = [];

  CODE_PRACTICE_QUESTIONS.forEach((item, index) => {
    item.subjects.forEach((subject) => {
      operations.push({
        updateOne: {
          filter: {
            subject,
            question: item.title,
            tags: 'code-curated',
          },
          update: {
            $set: {
              subject,
              topic: item.topic,
              topicOrder: index + 1,
              question: item.title,
              answer: formatExpectedOutput(item.expectedOutput),
              keyPoints: [
                `Code topic: ${item.topic}`,
                `Task: ${item.task}`,
                `Expected output: ${formatExpectedOutput(item.expectedOutput)}`,
              ],
              difficulty: 'medium',
              tags: ['code-curated', 'code-practice', subject, item.topic.toLowerCase()],
              codeOnly: true,
            },
            $setOnInsert: {
              bookmarked: false,
              mastered: false,
              learned: false,
              codeCompleted: false,
              savedCode: '',
              notes: '',
              order: index + 1,
            },
          },
          upsert: true,
        },
      });
      createdOrUpdated += 1;
    });
  });

  if (operations.length) {
    await Question.bulkWrite(operations, { ordered: false });
  }

  const bySubject = await Question.aggregate([
    { $match: { codeOnly: true, tags: 'code-curated' } },
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log(`Upserted ${createdOrUpdated} Code-only practice questions.`);
  console.log('Curated Code-only counts:', bySubject);
  await mongoose.disconnect();
}

if (require.main === module) {
  upsertCodePracticeQuestions().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { upsertCodePracticeQuestions };
