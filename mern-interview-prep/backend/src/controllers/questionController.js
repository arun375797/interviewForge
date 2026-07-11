const Question = require('../models/Question');
const Subject = require('../models/Subject');
const UserProgress = require('../models/UserProgress');
const mongoose = require('mongoose');
const {
  generateAnswer,
  generateKeyPoints,
  difficultyFromQuestion,
} = require('../utils/answerGenerator');
const {
  CODE_SUBJECTS,
  CODE_KEYWORD_RE,
  isCodePracticeQuestion,
  toCodeQuestion,
} = require('../utils/codePracticeGenerator');
const {
  mergeQuestions,
  mergeQuestionWithProgress,
  getOrCreateProgress,
  questionIdsForProgressFilter,
  formatQuestionResponse,
  aggregateSubjectStats,
  aggregateTopicStats,
  toggleDailyReview,
} = require('../utils/userProgressService');
const { computeNextReview } = require('../utils/spacedRepetition');
const { getProgressOwnerId } = require('../utils/progressScope');

const PUBLIC_QUESTION_FILTER = { codeOnly: { $ne: true } };

exports.getSubjects = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const [subjects, liveCounts] = await Promise.all([
      Subject.find().sort({ label: 1 }).lean(),
      aggregateSubjectStats(userId),
    ]);
    const countsBySubject = new Map(liveCounts.map((item) => [item.subject, item]));
    const withLiveCounts = subjects.map((subject) => {
      const live = countsBySubject.get(subject.key);
      return {
        ...subject,
        questionCount: live?.questionCount || 0,
        topicCount: live?.topicCount || 0,
        bookmarked: live?.bookmarked || 0,
        mastered: live?.mastered || 0,
        learned: live?.learned || 0,
      };
    });
    res.json(withLiveCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTopics = async (req, res) => {
  try {
    const { subject } = req.params;
    const topics = await aggregateTopicStats(getProgressOwnerId(req), subject);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const {
      subject,
      topic,
      difficulty,
      search,
      bookmarked,
      mastered,
      learned,
      manualAnswer,
      includeAnswer,
      page = 1,
      limit = 50,
      sort = 'order',
    } = req.query;

    const filter = { ...PUBLIC_QUESTION_FILTER };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (manualAnswer === 'true') filter.answerManuallyAdded = true;
    if (manualAnswer === 'false') filter.answerManuallyAdded = { $ne: true };
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    if (bookmarked === 'true') {
      const ids = await questionIdsForProgressFilter(userId, { bookmarked: true }, { subject });
      filter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    }
    if (mastered === 'true') {
      const ids = await questionIdsForProgressFilter(userId, { mastered: true }, { subject });
      filter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    }
    if (learned === 'true') {
      const ids = await questionIdsForProgressFilter(userId, { learned: true }, { subject });
      filter._id = { $in: ids.length ? ids : [new mongoose.Types.ObjectId()] };
    }
    if (learned === 'false') {
      const learnedIds = await questionIdsForProgressFilter(userId, { learned: true }, { subject });
      if (learnedIds.length) filter._id = { ...(filter._id || {}), $nin: learnedIds };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * lim;

    const sortObj =
      search && search.trim()
        ? { score: { $meta: 'textScore' } }
        : sort === 'newest'
          ? { createdAt: -1 }
          : sort === 'difficulty'
            ? { difficulty: 1, topicOrder: 1, order: 1 }
            : { topicOrder: 1, order: 1 };

    const projection =
      search && search.trim() ? { score: { $meta: 'textScore' } } : undefined;

    const listQuery = Question.find(filter, projection).sort(sortObj).skip(skip).limit(lim);
    if (includeAnswer !== 'true') {
      listQuery.select('-answer -keyPoints');
    }

    const [items, total] = await Promise.all([listQuery.lean(), Question.countDocuments(filter)]);

    const merged = await mergeQuestions(userId, items);
    res.json({
      items: merged,
      total,
      page: pageNum,
      pages: Math.ceil(total / lim) || 1,
      limit: lim,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const item = await formatQuestionResponse(getProgressOwnerId(req), req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { subject, topic, question, answer, difficulty, keyPoints, notes, tags } = req.body;
    const hasManualAnswer = typeof answer === 'string' && answer.trim().length > 0;
    if (!subject || !topic || !question) {
      return res.status(400).json({ message: 'subject, topic, and question are required' });
    }

    const maxOrder = await Question.findOne({ subject, topic }).sort({ order: -1 }).select('order topicOrder');
    const topicOrder =
      maxOrder?.topicOrder ||
      (await Question.findOne({ subject, topic }).select('topicOrder'))?.topicOrder ||
      99;

    const doc = await Question.create({
      subject,
      topic,
      topicOrder,
      question,
      answer: hasManualAnswer ? answer : generateAnswer(question, subject, topic),
      answerManuallyAdded: hasManualAnswer,
      keyPoints: keyPoints?.length ? keyPoints : generateKeyPoints(question, subject, topic),
      difficulty: difficulty || difficultyFromQuestion(question, topic),
      tags: tags || [subject],
      notes: notes || '',
      order: (maxOrder?.order || 0) + 1,
    });

    await Subject.findOneAndUpdate({ key: subject }, { $inc: { questionCount: 1 } });
    res.status(201).json(mergeQuestionWithProgress(doc.toObject(), null));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const allowed = [
      'question',
      'answer',
      'answerManuallyAdded',
      'topic',
      'subject',
      'difficulty',
      'keyPoints',
      'notes',
      'tags',
      'order',
      'topicOrder',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.answer !== undefined && req.body.answerManuallyAdded === undefined) {
      updates.answerManuallyAdded = true;
    }

    const item = await Question.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Question not found' });
    const merged = await formatQuestionResponse(getProgressOwnerId(req), item._id);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePersonalNotes = async (req, res) => {
  try {
    const notes = typeof req.body.notes === 'string' ? req.body.notes : '';
    if (notes.length > 10000) {
      return res.status(400).json({ message: 'Notes are too long' });
    }

    const question = await Question.findById(req.params.id).select('_id');
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const progress = await getOrCreateProgress(getProgressOwnerId(req), question._id);
    progress.notes = notes;
    await progress.save();

    const merged = await formatQuestionResponse(getProgressOwnerId(req), question._id);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const item = await Question.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    await UserProgress.deleteMany({ questionId: item._id });
    await Subject.findOneAndUpdate({ key: item.subject }, { $inc: { questionCount: -1 } });
    res.json({ message: 'Deleted', id: item._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function toggleAndRespond(userId, questionId, field) {
  const question = await Question.findById(questionId);
  if (!question) return null;
  const progress = await getOrCreateProgress(userId, questionId);
  progress[field] = !progress[field];
  await progress.save();
  return formatQuestionResponse(userId, questionId);
}

exports.toggleBookmark = async (req, res) => {
  try {
    const merged = await toggleAndRespond(getProgressOwnerId(req), req.params.id, 'bookmarked');
    if (!merged) return res.status(404).json({ message: 'Question not found' });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleWeakSpot = async (req, res) => {
  try {
    const merged = await toggleAndRespond(getProgressOwnerId(req), req.params.id, 'weakSpot');
    if (!merged) return res.status(404).json({ message: 'Question not found' });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleMastered = async (req, res) => {
  try {
    const merged = await toggleAndRespond(getProgressOwnerId(req), req.params.id, 'mastered');
    if (!merged) return res.status(404).json({ message: 'Question not found' });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleLearned = async (req, res) => {
  try {
    const merged = await toggleAndRespond(getProgressOwnerId(req), req.params.id, 'learned');
    if (!merged) return res.status(404).json({ message: 'Question not found' });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleDailyReview = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    await toggleDailyReview(getProgressOwnerId(req), question._id);
    const merged = await formatQuestionResponse(getProgressOwnerId(req), question._id);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleExplainList = async (req, res) => {
  try {
    const merged = await toggleAndRespond(getProgressOwnerId(req), req.params.id, 'inExplainList');
    if (!merged) return res.status(404).json({ message: 'Question not found' });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLearnProgress = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const { subject } = req.query;
    const match = subject ? { subject, ...PUBLIC_QUESTION_FILTER } : { ...PUBLIC_QUESTION_FILTER };

    const [totalCount, learnedRows, bySubjectQuestions, byTopicQuestions] = await Promise.all([
      Question.countDocuments(match),
      UserProgress.aggregate([
        { $match: { userId, learned: true } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        { $match: { 'question.codeOnly': { $ne: true }, ...(subject ? { 'question.subject': subject } : {}) } },
        {
          $group: {
            _id: null,
            learned: { $sum: 1 },
          },
        },
      ]),
      Question.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$subject',
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Question.aggregate([
        { $match: match },
        {
          $group: {
            _id: { subject: '$subject', topic: '$topic' },
            topicOrder: { $min: '$topicOrder' },
            total: { $sum: 1 },
          },
        },
        { $sort: { '_id.subject': 1, topicOrder: 1, '_id.topic': 1 } },
      ]),
    ]);

    const learnedCount = learnedRows[0]?.learned || 0;
    const learnedBySubject = await UserProgress.aggregate([
      { $match: { userId, learned: true } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $match: { 'question.codeOnly': { $ne: true }, ...(subject ? { 'question.subject': subject } : {}) } },
      { $group: { _id: '$question.subject', learned: { $sum: 1 } } },
    ]);
    const learnedSubjectMap = new Map(learnedBySubject.map((row) => [row._id, row.learned]));

    const learnedByTopic = await UserProgress.aggregate([
      { $match: { userId, learned: true } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $match: { 'question.codeOnly': { $ne: true }, ...(subject ? { 'question.subject': subject } : {}) } },
      {
        $group: {
          _id: { subject: '$question.subject', topic: '$question.topic' },
          learned: { $sum: 1 },
        },
      },
    ]);
    const learnedTopicMap = new Map(
      learnedByTopic.map((row) => [`${row._id.subject}:${row._id.topic}`, row.learned])
    );

    const bySubject = bySubjectQuestions.map((row) => ({
      _id: row._id,
      total: row.total,
      learned: learnedSubjectMap.get(row._id) || 0,
    }));

    const byTopic = byTopicQuestions.map((row) => ({
      subject: row._id.subject,
      topic: row._id.topic,
      topicOrder: row.topicOrder,
      total: row.total,
      learned: learnedTopicMap.get(`${row._id.subject}:${row._id.topic}`) || 0,
    }));

    res.json({
      total: totalCount,
      learned: learnedCount,
      remaining: Math.max(0, totalCount - learnedCount),
      percent: totalCount ? Math.round((learnedCount / totalCount) * 100) : 0,
      bySubject,
      byTopic,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function isValidCodeSubject(subject) {
  return !subject || CODE_SUBJECTS.includes(subject);
}

async function loadCodeQuestions(userId, { subject, topic, completed, manualAnswer, search, includeSavedCode = false } = {}) {
  const filter = {
    subject: subject || { $in: CODE_SUBJECTS },
    $or: [{ question: CODE_KEYWORD_RE }, { codeOnly: true }],
  };
  if (manualAnswer === 'true') filter.answerManuallyAdded = true;
  if (manualAnswer === 'false') filter.answerManuallyAdded = { $ne: true };

  const docs = await Question.find(filter)
    .sort({ topicOrder: 1, order: 1 })
    .select('subject topic topicOrder question answer answerManuallyAdded difficulty tags order createdAt updatedAt codeOnly')
    .lean();

  const query = search?.trim().toLowerCase();
  let items = docs
    .filter((doc) => isCodePracticeQuestion(doc))
    .map((doc) => toCodeQuestion(doc))
    .filter((doc) => {
      if (!topic) return true;
      return doc.codePrompt.topic === topic;
    })
    .filter((doc) => {
      if (!query) return true;
      return `${doc.question} ${doc.topic} ${doc.codePrompt.topic}`.toLowerCase().includes(query);
    })
    .sort(
      (a, b) =>
        (a.codePrompt.topicOrder || 99) - (b.codePrompt.topicOrder || 99) ||
        (a.order || 0) - (b.order || 0)
    );

  items = await mergeQuestions(userId, items, { includeSavedCode });

  if (completed === 'true') items = items.filter((q) => q.codeCompleted);
  if (completed === 'false') items = items.filter((q) => !q.codeCompleted);

  return items;
}

exports.getCodeProgress = async (req, res) => {
  try {
    const { subject } = req.query;
    if (!isValidCodeSubject(subject)) {
      return res.status(400).json({ message: 'Code practice supports javascript and dsa only' });
    }

    const items = await loadCodeQuestions(getProgressOwnerId(req), { subject });
    const completed = items.filter((q) => q.codeCompleted).length;
    res.json({
      total: items.length,
      completed,
      remaining: Math.max(0, items.length - completed),
      percent: items.length ? Math.round((completed / items.length) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCodeTopics = async (req, res) => {
  try {
    const { subject } = req.query;
    if (!isValidCodeSubject(subject)) {
      return res.status(400).json({ message: 'Code practice supports javascript and dsa only' });
    }

    const items = await loadCodeQuestions(getProgressOwnerId(req), { subject });
    const topics = new Map();
    for (const item of items) {
      const codeTopic = item.codePrompt.topic;
      if (!topics.has(codeTopic)) {
        topics.set(codeTopic, {
          name: codeTopic,
          subject: item.subject,
          topicOrder: item.codePrompt.topicOrder,
          count: 0,
          completed: 0,
        });
      }
      const entry = topics.get(codeTopic);
      entry.count += 1;
      if (item.codeCompleted) entry.completed += 1;
    }

    res.json(
      [...topics.values()].sort(
        (a, b) => (a.topicOrder || 0) - (b.topicOrder || 0) || a.name.localeCompare(b.name)
      )
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCodeQuestions = async (req, res) => {
  try {
    const {
      subject,
      topic,
      search,
      completed,
      manualAnswer,
      page = 1,
      limit = 40,
    } = req.query;

    if (!isValidCodeSubject(subject)) {
      return res.status(400).json({ message: 'Code practice supports javascript and dsa only' });
    }

    const allItems = await loadCodeQuestions(getProgressOwnerId(req), {
      subject,
      topic,
      completed,
      manualAnswer,
      search,
    });
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 40));
    const skip = (pageNum - 1) * lim;

    res.json({
      items: allItems.slice(skip, skip + lim),
      total: allItems.length,
      page: pageNum,
      pages: Math.ceil(allItems.length / lim) || 1,
      limit: lim,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCodeQuestionById = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id)
      .select('subject topic topicOrder question answer answerManuallyAdded difficulty tags order createdAt updatedAt codeOnly')
      .lean();
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }
    const [merged] = await mergeQuestions(getProgressOwnerId(req), [toCodeQuestion(item)], {
      includeSavedCode: true,
    });
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleCodeCompleted = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }
    const progress = await getOrCreateProgress(getProgressOwnerId(req), item._id);
    progress.codeCompleted = !progress.codeCompleted;
    await progress.save();
    const merged = await formatQuestionResponse(getProgressOwnerId(req), item._id, { includeSavedCode: true });
    res.json(toCodeQuestion(merged));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveCode = async (req, res) => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code : '';
    if (code.length > 100000) {
      return res.status(400).json({ message: 'Saved code is too large' });
    }

    const item = await Question.findById(req.params.id);
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }

    const progress = await getOrCreateProgress(getProgressOwnerId(req), item._id);
    progress.savedCode = code;
    progress.savedCodeUpdatedAt = new Date();
    await progress.save();
    res.json({
      id: item._id,
      hasSavedCode: Boolean(code),
      savedCodeUpdatedAt: progress.savedCodeUpdatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSavedCode = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id)
      .select('subject topic question codeOnly')
      .lean();
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }
    const progress = await UserProgress.findOne({
      userId: getProgressOwnerId(req),
      questionId: item._id,
    })
      .select('+savedCode')
      .lean();
    res.json({
      id: item._id,
      code: progress?.savedCode || '',
      savedCodeUpdatedAt: progress?.savedCodeUpdatedAt,
      hasSavedCode: Boolean(progress?.savedCode),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const [questionStats, progressStats] = await Promise.all([
      Question.aggregate([
        { $match: PUBLIC_QUESTION_FILTER },
        {
          $facet: {
            totals: [{ $group: { _id: null, total: { $sum: 1 } } }],
            bySubject: [{ $group: { _id: '$subject', count: { $sum: 1 } } }],
            byDifficulty: [{ $group: { _id: '$difficulty', count: { $sum: 1 } } }],
          },
        },
      ]),
      UserProgress.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: '$question' },
        { $match: { 'question.codeOnly': { $ne: true } } },
        {
          $group: {
            _id: null,
            bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
            mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
            learned: { $sum: { $cond: ['$learned', 1, 0] } },
          },
        },
      ]),
    ]);

    const totals = questionStats?.[0]?.totals?.[0] || { total: 0 };
    const progress = progressStats[0] || { bookmarked: 0, mastered: 0, learned: 0 };
    res.json({
      total: totals.total,
      bookmarked: progress.bookmarked,
      mastered: progress.mastered,
      learned: progress.learned,
      bySubject: questionStats?.[0]?.bySubject || [],
      byDifficulty: questionStats?.[0]?.byDifficulty || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomQuestion = async (req, res) => {
  try {
    const filter = { ...PUBLIC_QUESTION_FILTER };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const [item] = await Question.aggregate([{ $match: filter }, { $sample: { size: 1 } }]);
    if (!item) return res.status(404).json({ message: 'No questions found' });
    const [merged] = await mergeQuestions(getProgressOwnerId(req), [item]);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomBatch = async (req, res) => {
  try {
    const filter = { ...PUBLIC_QUESTION_FILTER };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    let count = parseInt(req.query.count, 10);
    if (Number.isNaN(count) || count < 1) count = 10;
    count = Math.min(count, 200);

    const excludeRaw = req.query.exclude;
    if (excludeRaw) {
      const ids = String(excludeRaw)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length) {
        const objectIds = ids
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (objectIds.length) filter._id = { $nin: objectIds };
      }
    }

    const items = await Question.aggregate([{ $match: filter }, { $sample: { size: count } }]);
    if (!items.length) return res.status(404).json({ message: 'No questions found' });
    const merged = await mergeQuestions(getProgressOwnerId(req), items);
    res.json({ items: merged, count: merged.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
