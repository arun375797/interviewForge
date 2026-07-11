const mongoose = require('mongoose');

const planDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['study', 'code'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: ['javascript', 'react', 'nodejs', 'dsa'],
      required: true,
      index: true,
    },
    days: {
      type: Number,
      enum: [3, 5, 10, 15],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true, index: true },
    totalQuestions: { type: Number, default: 0 },
    planDays: [planDaySchema],
  },
  { timestamps: true }
);

planSchema.index({ userId: 1, mode: 1, subject: 1, active: 1 });

module.exports = mongoose.model('Plan', planSchema);
