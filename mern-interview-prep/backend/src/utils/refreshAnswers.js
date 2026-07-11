/**
 * Regenerates answers for all questions without wiping user progress.
 * User progress (bookmarks, learned, etc.) lives in UserProgress, not Question.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const { generateAnswer, generateKeyPoints } = require('./answerGenerator');
const connectDB = require('../config/db');

async function refreshAnswers() {
  await connectDB();
  const total = await Question.countDocuments();
  console.log(`Refreshing answers for ${total} questions (preserving learned/bookmarks)...`);

  const cursor = Question.find({}).cursor();
  let updated = 0;
  const bulk = [];

  for await (const doc of cursor) {
    const answer = generateAnswer(doc.question, doc.subject, doc.topic);
    const keyPoints = generateKeyPoints(doc.question, doc.subject, doc.topic);
    bulk.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { answer, keyPoints } },
      },
    });

    if (bulk.length >= 200) {
      await Question.bulkWrite(bulk, { ordered: false });
      updated += bulk.length;
      bulk.length = 0;
      console.log(`  ${updated} / ${total}`);
    }
  }

  if (bulk.length) {
    await Question.bulkWrite(bulk, { ordered: false });
    updated += bulk.length;
  }

  const sample = await Question.findOne({
    subject: 'javascript',
    question: /what is js/i,
  }).lean();

  console.log('\nSample JS answer:');
  console.log(sample?.answer?.slice(0, 280));
  console.log(`\nDone. Updated ${updated} questions.`);
  await mongoose.disconnect();
}

refreshAnswers().catch((err) => {
  console.error(err);
  process.exit(1);
});
