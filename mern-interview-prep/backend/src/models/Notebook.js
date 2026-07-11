const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    color: {
      type: String,
      default: '#0f766e',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 280,
    },
  },
  { timestamps: true }
);

notebookSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Notebook', notebookSchema);
