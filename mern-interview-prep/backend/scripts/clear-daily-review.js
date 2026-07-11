require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../src/models/Question');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Question.updateMany({}, { $set: { inDailyReview: false } });
  console.log(`Cleared inDailyReview on ${result.modifiedCount} questions`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
