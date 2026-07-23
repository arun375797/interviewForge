const mongoose = require('mongoose');

const topicCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    codePractice: { type: Boolean, default: false },
  },
  { _id: false }
);

const subjectSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    short: { type: String, default: '', trim: true },
    color: { type: String, default: '#0F766E' },
    description: { type: String, default: '' },
    supportsCode: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    topicCount: { type: Number, default: 0 },
    topics: { type: [topicCatalogSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
