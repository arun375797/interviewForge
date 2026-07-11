const mongoose = require('mongoose');

const notebookPageSchema = new mongoose.Schema(
  {
    notebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notebook',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'Untitled',
    },
    subtopics: {
      type: [String],
      default: [],
    },
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

notebookPageSchema.index({ notebookId: 1, pageNumber: 1 });
notebookPageSchema.index({ notebookId: 1, userId: 1 });

module.exports = mongoose.model('NotebookPage', notebookPageSchema);
