const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: ['javascript', 'react', 'nodejs', 'dsa'],
      required: true,
      index: true,
    },
    topic: { type: String, required: true, index: true },
    topicOrder: { type: Number, default: 0 },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    keyPoints: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [{ type: String }],
    codeOnly: { type: Boolean, default: false, index: true },
    bookmarked: { type: Boolean, default: false, index: true },
    mastered: { type: Boolean, default: false, index: true },
    learned: { type: Boolean, default: false, index: true },
    codeCompleted: { type: Boolean, default: false, index: true },
    savedCode: { type: String, default: '', select: false },
    savedCodeUpdatedAt: { type: Date },
    notes: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ question: 'text', answer: 'text', topic: 'text', tags: 'text' });
questionSchema.index({ subject: 1, topic: 1, order: 1 });
questionSchema.index({ subject: 1, codeCompleted: 1, topicOrder: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
