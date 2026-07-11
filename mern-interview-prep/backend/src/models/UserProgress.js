const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    bookmarked: { type: Boolean, default: false, index: true },
    weakSpot: { type: Boolean, default: false, index: true },
    inDailyReview: { type: Boolean, default: false, index: true },
    inExplainList: { type: Boolean, default: false, index: true },
    mastered: { type: Boolean, default: false, index: true },
    learned: { type: Boolean, default: false, index: true },
    codeCompleted: { type: Boolean, default: false, index: true },
    savedCode: { type: String, default: '', select: false },
    savedCodeUpdatedAt: { type: Date },
    notes: { type: String, default: '' },
    nextReviewAt: { type: Date, index: true },
    reviewCount: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    lastReviewRating: {
      type: String,
      enum: ['again', 'hard', 'good', 'easy', 'blank', 'partial', 'confident', 'shaky', ''],
      default: '',
    },
    failCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    linkedNotebookPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotebookPage',
    },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, inDailyReview: 1, nextReviewAt: 1 });
userProgressSchema.index({ userId: 1, bookmarked: 1 });
userProgressSchema.index({ userId: 1, weakSpot: 1 });
userProgressSchema.index({ userId: 1, learned: 1 });
userProgressSchema.index({ userId: 1, codeCompleted: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
