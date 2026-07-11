const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
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
const {
  mergeQuestions,
  mergeQuestionWithProgress,
  getOrCreateProgress,
  countProgressBySubject,
  clearProgressFlags,
  formatQuestionResponse,
} = require('../utils/userProgressService');
const { getProgressOwnerId } = require('../utils/progressScope');

const PUBLIC_QUESTION_FILTER = { codeOnly: { $ne: true } };

exports.getReviewSummary = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const now = startOfDay();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const base = { userId, inDailyReview: true };

    const [dueToday, overdue, upcoming, inQueue] = await Promise.all([
      UserProgress.countDocuments({
        ...base,
        $or: [
          { nextReviewAt: { $lte: endOfToday } },
          { nextReviewAt: { $exists: false } },
          { nextReviewAt: null },
        ],
      }),
      UserProgress.countDocuments({
        ...base,
        nextReviewAt: { $lt: now },
      }),
      UserProgress.countDocuments({
        ...base,
        nextReviewAt: { $gt: endOfToday },
      }),
      UserProgress.countDocuments(base),
    ]);

    res.json({ dueToday, overdue, upcoming, inQueue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDueReviews = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const subject = req.query.subject;
    const mode = req.query.mode || 'due';
    const endOfToday = new Date(startOfDay());
    endOfToday.setHours(23, 59, 59, 999);

    const filter = { userId, inDailyReview: true };
    if (mode === 'due') {
      filter.$or = [
        { nextReviewAt: { $lte: endOfToday } },
        { nextReviewAt: { $exists: false } },
        { nextReviewAt: null },
      ];
    }

    const progressRows = await UserProgress.find(filter)
      .sort({ nextReviewAt: 1, failCount: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    const questionIds = progressRows.map((row) => row.questionId);
    const questions = await Question.find({
      _id: { $in: questionIds },
      ...PUBLIC_QUESTION_FILTER,
      ...(subject ? { subject } : {}),
    }).lean();
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const items = [];
    for (const row of progressRows) {
      const question = questionMap.get(String(row.questionId));
      if (!question) continue;
      if (subject && question.subject !== subject) continue;
      items.push(mergeQuestionWithProgress(question, row));
      if (items.length >= limit) break;
    }

    const counts = await countProgressBySubject(userId, { inDailyReview: true });

    res.json({
      items,
      total: items.length,
      counts: { all: counts.totalAll, bySubject: counts.countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearDailyReview = async (req, res) => {
  try {
    const cleared = await clearProgressFlags(getProgressOwnerId(req), 'inDailyReview', {
      subject: req.query.subject,
    });
    res.json({ cleared });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating) return res.status(400).json({ message: 'rating is required' });

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const progress = await getOrCreateProgress(getProgressOwnerId(req), question._id);
    const schedule = computeNextReview({
      reviewCount: progress.reviewCount || 0,
      easeFactor: progress.easeFactor || 2.5,
      rating,
    });

    progress.reviewCount = schedule.reviewCount;
    progress.easeFactor = schedule.easeFactor;
    progress.nextReviewAt = schedule.nextReviewAt;
    progress.lastReviewRating = String(rating).toLowerCase();
    progress.lastReviewedAt = new Date();

    const score = ['again', 'blank', 'partial', 'shaky', 'hard'].includes(
      progress.lastReviewRating
    )
      ? 0
      : 1;
    if (score === 0) progress.failCount = (progress.failCount || 0) + 1;
    if (['good', 'easy', 'confident'].includes(progress.lastReviewRating) && !progress.mastered) {
      progress.mastered = progress.reviewCount >= 3;
    }

    await progress.save();
    res.json(await formatQuestionResponse(getProgressOwnerId(req), question._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeakSpots = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const { subject } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const filter = { userId, weakSpot: true };
    const progressRows = await UserProgress.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();
    const questionIds = progressRows.map((row) => row.questionId);

    const questions = await Question.find({
      _id: { $in: questionIds },
      ...PUBLIC_QUESTION_FILTER,
      ...(subject ? { subject } : {}),
    })
      .sort({ subject: 1, topicOrder: 1, order: 1, updatedAt: -1 })
      .lean();

    const progressMap = new Map(progressRows.map((row) => [String(row.questionId), row]));
    const merged = questions.map((q) => mergeQuestionWithProgress(q, progressMap.get(String(q._id))));

    const bySubject = {};
    for (const q of merged) {
      if (!bySubject[q.subject]) bySubject[q.subject] = [];
      bySubject[q.subject].push(q);
    }

    const counts = await countProgressBySubject(userId, { weakSpot: true });

    res.json({
      questions: merged,
      bySubject,
      total: merged.length,
      counts: { all: counts.totalAll, bySubject: counts.countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearWeakSpots = async (req, res) => {
  try {
    const cleared = await clearProgressFlags(getProgressOwnerId(req), 'weakSpot', {
      subject: req.query.subject,
    });
    res.json({ cleared });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExplainList = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const { subject } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const progressRows = await UserProgress.find({ userId, inExplainList: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    const questionIds = progressRows.map((row) => row.questionId);

    const questions = await Question.find({
      _id: { $in: questionIds },
      ...PUBLIC_QUESTION_FILTER,
      ...(subject ? { subject } : {}),
    })
      .sort({ subject: 1, topicOrder: 1, order: 1, updatedAt: -1 })
      .lean();

    const progressMap = new Map(progressRows.map((row) => [String(row.questionId), row]));
    const merged = questions.map((q) => mergeQuestionWithProgress(q, progressMap.get(String(q._id))));

    const counts = await countProgressBySubject(userId, { inExplainList: true });

    res.json({
      questions: merged,
      total: merged.length,
      counts: { all: counts.totalAll, bySubject: counts.countBySubject },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearExplainList = async (req, res) => {
  try {
    const cleared = await clearProgressFlags(getProgressOwnerId(req), 'inExplainList', {
      subject: req.query.subject,
    });
    res.json({ cleared });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFlashcards = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const subject = req.query.subject;
    const source = req.query.source || 'all';
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    let questionFilter = { ...PUBLIC_QUESTION_FILTER };
    if (subject) questionFilter.subject = subject;

    if (source === 'bookmarked') {
      const ids = await UserProgress.find({ userId, bookmarked: true }).distinct('questionId');
      questionFilter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    } else if (source === 'due') {
      const ids = await UserProgress.find({ userId, inDailyReview: true }).distinct('questionId');
      questionFilter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    } else if (source === 'weak') {
      const ids = await UserProgress.find({ userId, weakSpot: true }).distinct('questionId');
      questionFilter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    }

    const questions = await Question.aggregate([
      { $match: questionFilter },
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

    const merged = await mergeQuestions(getProgressOwnerId(req), items.slice(0, count));
    res.json({ items: merged });
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
    const userId = getProgressOwnerId(req);
    const questionId = req.body.questionId || req.params.questionId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Valid questionId is required' });
    }

    const question = await Question.findById(questionId).lean();
    if (!question) return res.status(404).json({ message: 'Question not found' });

    let notebookId = req.body.notebookId;
    if (notebookId) {
      const nb = await Notebook.findOne({ _id: notebookId, userId });
      if (!nb) return res.status(404).json({ message: 'Notebook not found' });
    } else {
      let nb = await Notebook.findOne({ userId }).sort({ updatedAt: -1 });
      if (!nb) {
        nb = await Notebook.create({
          userId,
          title: 'Study Notes',
          color: '#0f766e',
          description: 'Auto-created for question notes',
        });
      }
      notebookId = nb._id;
    }

    const latest = await NotebookPage.findOne({ notebookId, userId })
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
      userId,
      pageNumber,
      topic: question.topic,
      subtopics: [question.question.slice(0, 80)],
      content,
      questionId: question._id,
    });

    const progress = await getOrCreateProgress(userId, question._id);
    progress.linkedNotebookPageId = page._id;
    await progress.save();

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
