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

  // Replace curated code-only rows so topics/titles match the latest practice bank.
  await Question.deleteMany({ codeOnly: true, tags: 'code-curated' });

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

  const byTopic = await Question.aggregate([
    { $match: { codeOnly: true, tags: 'code-curated', subject: 'javascript' } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  console.log(`Upserted ${createdOrUpdated} Code-only practice questions.`);
  console.log('Curated Code-only counts:', bySubject);
  console.log('Top JS practice topics:', byTopic);
  await mongoose.disconnect();
}

if (require.main === module) {
  upsertCodePracticeQuestions().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { upsertCodePracticeQuestions };
