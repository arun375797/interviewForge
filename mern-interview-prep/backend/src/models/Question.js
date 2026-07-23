const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    topic: { type: String, required: true, index: true },
    topicOrder: { type: Number, default: 0 },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    answerManuallyAdded: { type: Boolean, default: false, index: true },
    keyPoints: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [{ type: String }],
    codeOnly: { type: Boolean, default: false, index: true },
    notes: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ question: 'text', answer: 'text', topic: 'text', tags: 'text' });
questionSchema.index({ subject: 1, topic: 1, order: 1 });
questionSchema.index({ subject: 1, topicOrder: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
