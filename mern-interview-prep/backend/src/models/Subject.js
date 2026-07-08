const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    label: { type: String, required: true },
    color: { type: String, default: '#0F766E' },
    description: { type: String, default: '' },
    questionCount: { type: Number, default: 0 },
    topicCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
