const Question = require('../models/Question');
const Notebook = require('../models/Notebook');
const NotebookPage = require('../models/NotebookPage');
const mongoose = require('mongoose');
const {
  computeNextReview,
  scheduleInitialReview,
  startOfDay,
} = require('../utils/spacedRepetition');
const { generateFollowUps } = require('../utils/followUpGenerator');
const { checkFeynmanAnswer } = require('../utils/feynmanCheck');

const PUBLIC_QUESTION_FILTER = { codeOnly: { $ne: true } };

exports.getReviewSummary = async (_req, res) => {
  try {
    const now = startOfDay();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const base = { ...PUBLIC_QUESTION_FILTER, inDailyReview: true };

    const [dueToday, overdue, upcoming, inQueue] = await Promise.all([
      Question.countDocuments({
        ...base,
        $or: [
          { nextReviewAt: { $lte: endOfToday } },
          { nextReviewAt: { $exists: false } },
          { nextReviewAt: null },
        ],
      }),
      Question.countDocuments({
        ...base,
        nextReviewAt: { $lt: now },
      }),
      Question.countDocuments({
        ...base,
        nextReviewAt: { $gt: endOfToday },
      }),
      Question.countDocuments(base),
    ]);

    res.json({ dueToday, overdue, upcoming, inQueue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDueReviews = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const subject = req.query.subject;
    const mode = req.query.mode || 'due';
    const endOfToday = new Date(startOfDay());
    endOfToday.setHours(23, 59, 59, 999);

    const filter = {
      ...PUBLIC_QUESTION_FILTER,
      inDailyReview: true,
    };
    if (subject) filter.subject = subject;

    if (mode === 'due') {
      filter.$or = [
        { nextReviewAt: { $lte: endOfToday } },
        { nextReviewAt: { $exists: false } },
        { nextReviewAt: null },
      ];
    }

    const items = await Question.find(filter)
      .sort({ nextReviewAt: 1, failCount: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    const counts = await Question.aggregate([
      { $match: { ...PUBLIC_QUESTION_FILTER, inDailyReview: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    const countBySubject = Object.fromEntries(counts.map((row) => [row._id, row.count]));
    const totalAll = counts.reduce((sum, row) => sum + row.count, 0);

    res.json({
      items,
      total: items.length,
      counts: { all: totalAll, bySubject: countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearDailyReview = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { inDailyReview: true };
    if (subject) filter.subject = subject;

    const result = await Question.updateMany(filter, {
      $set: { inDailyReview: false },
    });
    res.json({ cleared: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating) return res.status(400).json({ message: 'rating is required' });

    const item = await Question.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });

    const schedule = computeNextReview({
      reviewCount: item.reviewCount || 0,
      easeFactor: item.easeFactor || 2.5,
      rating,
    });

    item.reviewCount = schedule.reviewCount;
    item.easeFactor = schedule.easeFactor;
    item.nextReviewAt = schedule.nextReviewAt;
    item.lastReviewRating = String(rating).toLowerCase();
    item.lastReviewedAt = new Date();

    const score = ['again', 'blank', 'partial', 'shaky', 'hard'].includes(
      item.lastReviewRating
    )
      ? 0
      : 1;
    if (score === 0) item.failCount = (item.failCount || 0) + 1;
    if (['good', 'easy', 'confident'].includes(item.lastReviewRating) && !item.mastered) {
      item.mastered = item.reviewCount >= 3;
    }

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeakSpots = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = {
      ...PUBLIC_QUESTION_FILTER,
      weakSpot: true,
    };
    if (subject) filter.subject = subject;

    const questions = await Question.find(filter)
      .sort({ subject: 1, topicOrder: 1, order: 1, updatedAt: -1 })
      .lean();

    const bySubject = {};
    for (const q of questions) {
      if (!bySubject[q.subject]) bySubject[q.subject] = [];
      bySubject[q.subject].push(q);
    }

    const counts = await Question.aggregate([
      { $match: { ...PUBLIC_QUESTION_FILTER, weakSpot: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    const countBySubject = Object.fromEntries(counts.map((row) => [row._id, row.count]));
    const totalAll = counts.reduce((sum, row) => sum + row.count, 0);

    res.json({
      questions,
      bySubject,
      total: questions.length,
      counts: { all: totalAll, bySubject: countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearWeakSpots = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { weakSpot: true };
    if (subject) filter.subject = subject;

    const result = await Question.updateMany(filter, { $set: { weakSpot: false } });
    res.json({ cleared: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExplainList = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = {
      ...PUBLIC_QUESTION_FILTER,
      inExplainList: true,
    };
    if (subject) filter.subject = subject;

    const questions = await Question.find(filter)
      .sort({ subject: 1, topicOrder: 1, order: 1, updatedAt: -1 })
      .lean();

    const counts = await Question.aggregate([
      { $match: { ...PUBLIC_QUESTION_FILTER, inExplainList: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    const countBySubject = Object.fromEntries(counts.map((row) => [row._id, row.count]));
    const totalAll = counts.reduce((sum, row) => sum + row.count, 0);

    res.json({
      questions,
      total: questions.length,
      counts: { all: totalAll, bySubject: countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearExplainList = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { inExplainList: true };
    if (subject) filter.subject = subject;

    const result = await Question.updateMany(filter, { $set: { inExplainList: false } });
    res.json({ cleared: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFlashcards = async (req, res) => {
  try {
    const subject = req.query.subject;
    const source = req.query.source || 'all';
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const filter = { ...PUBLIC_QUESTION_FILTER };
    if (subject) filter.subject = subject;
    if (source === 'bookmarked') filter.bookmarked = true;
    if (source === 'due') filter.inDailyReview = true;
    if (source === 'weak') filter.weakSpot = true;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
    ]);

    const cards = [];
    for (const q of questions) {
      if (q.keyPoints?.length) {
        for (const point of q.keyPoints.slice(0, 2)) {
          cards.push({
            id: `${q._id}-kp-${cards.length}`,
            questionId: q._id,
            subject: q.subject,
            topic: q.topic,
            front: q.question,
            back: point,
            type: 'keyPoint',
          });
        }
      } else {
        cards.push({
          id: `${q._id}-q`,
          questionId: q._id,
          subject: q.subject,
          topic: q.topic,
          front: q.question,
          back: q.answer?.slice(0, 500) || 'No answer',
          type: 'question',
        });
      }
    }

    res.json({ cards: cards.slice(0, limit), total: cards.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInterleaved = async (req, res) => {
  try {
    const subject = req.query.subject;
    const difficulty = req.query.difficulty;
    const count = Math.min(20, Math.max(1, parseInt(req.query.count, 10) || 1));

    const match = { ...PUBLIC_QUESTION_FILTER };
    if (subject) match.subject = subject;
    if (difficulty) match.difficulty = difficulty;

    const topics = await Question.distinct('topic', match);
    if (!topics.length) return res.status(404).json({ message: 'No questions found' });

    const perTopic = Math.max(1, Math.ceil(count / Math.min(topics.length, count)));
    const items = [];

    const shuffledTopics = [...topics].sort(() => Math.random() - 0.5);
    for (const topic of shuffledTopics) {
      if (items.length >= count) break;
      const [q] = await Question.aggregate([
        { $match: { ...match, topic } },
        { $sample: { size: 1 } },
      ]);
      if (q) items.push(q);
    }

    while (items.length < count) {
      const [q] = await Question.aggregate([
        { $match: { ...match, _id: { $nin: items.map((i) => i._id) } } },
        { $sample: { size: 1 } },
      ]);
      if (!q) break;
      items.push(q);
    }

    res.json({ items: items.slice(0, count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFollowUps = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Question not found' });
    res.json({ followUps: generateFollowUps(item) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkFeynman = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ message: 'answer is required' });

    const item = await Question.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Question not found' });

    const result = checkFeynmanAnswer(answer, item);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPageFromQuestion = async (req, res) => {
  try {
    const questionId = req.body.questionId || req.params.questionId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Valid questionId is required' });
    }

    const question = await Question.findById(questionId).lean();
    if (!question) return res.status(404).json({ message: 'Question not found' });

    let notebookId = req.body.notebookId;
    if (notebookId) {
      const nb = await Notebook.findOne({ _id: notebookId, userId: req.user.id });
      if (!nb) return res.status(404).json({ message: 'Notebook not found' });
    } else {
      let nb = await Notebook.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
      if (!nb) {
        nb = await Notebook.create({
          userId: req.user.id,
          title: 'Study Notes',
          color: '#0f766e',
          description: 'Auto-created for question notes',
        });
      }
      notebookId = nb._id;
    }

    const latest = await NotebookPage.findOne({ notebookId, userId: req.user.id })
      .sort({ pageNumber: -1 })
      .select('pageNumber')
      .lean();
    const pageNumber = (latest?.pageNumber || 0) + 1;

    const keyPointsHtml = (question.keyPoints || [])
      .map((p) => `<li>${p}</li>`)
      .join('');
    const content = `<h2>${question.question}</h2>
<p><strong>Subject:</strong> ${question.subject} · <strong>Topic:</strong> ${question.topic}</p>
<h3>My notes</h3>
<p></p>
<h3>Key points to remember</h3>
${keyPointsHtml ? `<ul>${keyPointsHtml}</ul>` : '<p></p>'}
<h3>Model answer</h3>
<p>${(question.answer || '').replace(/\n/g, '<br/>')}</p>`;

    const page = await NotebookPage.create({
      notebookId,
      userId: req.user.id,
      pageNumber,
      topic: question.topic,
      subtopics: [question.question.slice(0, 80)],
      content,
      questionId: question._id,
    });

    await Question.findByIdAndUpdate(question._id, { linkedNotebookPageId: page._id });
    await Notebook.findByIdAndUpdate(notebookId, { updatedAt: new Date() });

    res.status(201).json({
      notebookId,
      page: page.toObject(),
      questionId: question._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.initReviewSchedule = scheduleInitialReview;
