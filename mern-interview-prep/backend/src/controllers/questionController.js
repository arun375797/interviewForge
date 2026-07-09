const Question = require('../models/Question');
const Subject = require('../models/Subject');
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

const PUBLIC_QUESTION_FILTER = { codeOnly: { $ne: true } };

exports.getSubjects = async (_req, res) => {
  try {
    const [subjects, counts] = await Promise.all([
      Subject.find().sort({ label: 1 }).lean(),
      Question.aggregate([
        { $match: PUBLIC_QUESTION_FILTER },
        {
          $group: {
            _id: '$subject',
            questionCount: { $sum: 1 },
            topics: { $addToSet: '$topic' },
            bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
            mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
            learned: { $sum: { $cond: ['$learned', 1, 0] } },
          },
        },
        {
          $project: {
            questionCount: 1,
            topicCount: { $size: '$topics' },
            bookmarked: 1,
            mastered: 1,
            learned: 1,
          },
        },
      ]),
    ]);
    const countsBySubject = new Map(counts.map((item) => [item._id, item]));
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
    const topics = await Question.aggregate([
      { $match: { subject, ...PUBLIC_QUESTION_FILTER } },
      {
        $group: {
          _id: '$topic',
          topicOrder: { $min: '$topicOrder' },
          count: { $sum: 1 },
          bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
          mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
          learned: { $sum: { $cond: ['$learned', 1, 0] } },
        },
      },
      { $sort: { topicOrder: 1, _id: 1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          topicOrder: 1,
          count: 1,
          bookmarked: 1,
          mastered: 1,
          learned: 1,
        },
      },
    ]);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      search,
      bookmarked,
      mastered,
      learned,
      manualAnswer,
      page = 1,
      limit = 50,
      sort = 'order',
    } = req.query;

    const filter = { ...PUBLIC_QUESTION_FILTER };
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (bookmarked === 'true') filter.bookmarked = true;
    if (mastered === 'true') filter.mastered = true;
    if (learned === 'true') filter.learned = true;
    if (learned === 'false') filter.learned = false;
    if (manualAnswer === 'true') filter.answerManuallyAdded = true;
    if (manualAnswer === 'false') filter.answerManuallyAdded = { $ne: true };
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
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

    const [items, total] = await Promise.all([
      Question.find(filter, projection).sort(sortObj).skip(skip).limit(lim).lean(),
      Question.countDocuments(filter),
    ]);

    res.json({
      items,
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
    const item = await Question.findById(req.params.id);
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
    res.status(201).json(doc);
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
      'bookmarked',
      'mastered',
      'learned',
      'codeCompleted',
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
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const item = await Question.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    await Subject.findOneAndUpdate({ key: item.subject }, { $inc: { questionCount: -1 } });
    res.json({ message: 'Deleted', id: item._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    item.bookmarked = !item.bookmarked;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleMastered = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    item.mastered = !item.mastered;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleLearned = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found' });
    item.learned = !item.learned;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLearnProgress = async (req, res) => {
  try {
    const { subject } = req.query;
    const match = subject ? { subject, ...PUBLIC_QUESTION_FILTER } : { ...PUBLIC_QUESTION_FILTER };

    const [totals, bySubject, byTopic] = await Promise.all([
      Question.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            learned: { $sum: { $cond: ['$learned', 1, 0] } },
          },
        },
      ]),
      Question.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$subject',
            total: { $sum: 1 },
            learned: { $sum: { $cond: ['$learned', 1, 0] } },
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
            learned: { $sum: { $cond: ['$learned', 1, 0] } },
          },
        },
        { $sort: { '_id.subject': 1, topicOrder: 1, '_id.topic': 1 } },
        {
          $project: {
            _id: 0,
            subject: '$_id.subject',
            topic: '$_id.topic',
            topicOrder: 1,
            total: 1,
            learned: 1,
          },
        },
      ]),
    ]);

    const summary = totals[0] || { total: 0, learned: 0 };
    res.json({
      total: summary.total,
      learned: summary.learned,
      remaining: Math.max(0, summary.total - summary.learned),
      percent: summary.total ? Math.round((summary.learned / summary.total) * 100) : 0,
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

async function loadCodeQuestions({ subject, topic, completed, manualAnswer, search } = {}) {
  const filter = {
    subject: subject || { $in: CODE_SUBJECTS },
    $or: [{ question: CODE_KEYWORD_RE }, { codeOnly: true }],
  };
  if (completed === 'true') filter.codeCompleted = true;
  if (completed === 'false') filter.codeCompleted = false;
  if (manualAnswer === 'true') filter.answerManuallyAdded = true;
  if (manualAnswer === 'false') filter.answerManuallyAdded = { $ne: true };

  const docs = await Question.find(filter)
    .sort({ topicOrder: 1, order: 1 })
    .select('+savedCode subject topic topicOrder question answer answerManuallyAdded difficulty tags codeCompleted savedCodeUpdatedAt order createdAt updatedAt')
    .lean();

  const query = search?.trim().toLowerCase();
  return docs
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
}

exports.getCodeProgress = async (req, res) => {
  try {
    const { subject } = req.query;
    if (!isValidCodeSubject(subject)) {
      return res.status(400).json({ message: 'Code practice supports javascript and dsa only' });
    }

    const items = await loadCodeQuestions({ subject });
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

    const items = await loadCodeQuestions({ subject });
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

    const allItems = await loadCodeQuestions({ subject, topic, completed, manualAnswer, search });
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
      .select('+savedCode subject topic topicOrder question answer answerManuallyAdded difficulty tags codeCompleted savedCodeUpdatedAt order createdAt updatedAt')
      .lean();
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }
    res.json(toCodeQuestion(item));
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
    item.codeCompleted = !item.codeCompleted;
    await item.save();
    const safeItem = await Question.findById(item._id)
      .select('+savedCode subject topic topicOrder question answer answerManuallyAdded difficulty tags codeCompleted savedCodeUpdatedAt order createdAt updatedAt')
      .lean();
    res.json(toCodeQuestion(safeItem));
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

    item.savedCode = code;
    item.savedCodeUpdatedAt = new Date();
    await item.save();
    res.json({
      id: item._id,
      hasSavedCode: Boolean(code),
      savedCodeUpdatedAt: item.savedCodeUpdatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSavedCode = async (req, res) => {
  try {
    const item = await Question.findById(req.params.id)
      .select('+savedCode subject topic question savedCodeUpdatedAt')
      .lean();
    if (!item || !isCodePracticeQuestion(item)) {
      return res.status(404).json({ message: 'Code question not found' });
    }
    res.json({
      id: item._id,
      code: item.savedCode || '',
      savedCodeUpdatedAt: item.savedCodeUpdatedAt,
      hasSavedCode: Boolean(item.savedCode),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (_req, res) => {
  try {
    const [stats] = await Question.aggregate([
      { $match: PUBLIC_QUESTION_FILTER },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
                mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
                learned: { $sum: { $cond: ['$learned', 1, 0] } },
              },
            },
          ],
          bySubject: [{ $group: { _id: '$subject', count: { $sum: 1 } } }],
          byDifficulty: [{ $group: { _id: '$difficulty', count: { $sum: 1 } } }],
        },
      },
    ]);
    const totals = stats?.totals?.[0] || {
      total: 0,
      bookmarked: 0,
      mastered: 0,
      learned: 0,
    };
    res.json({
      total: totals.total,
      bookmarked: totals.bookmarked,
      mastered: totals.mastered,
      learned: totals.learned,
      bySubject: stats?.bySubject || [],
      byDifficulty: stats?.byDifficulty || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomQuestion = async (req, res) => {
  try {
    const filter = {};
    Object.assign(filter, PUBLIC_QUESTION_FILTER);
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const [item] = await Question.aggregate([{ $match: filter }, { $sample: { size: 1 } }]);
    if (!item) return res.status(404).json({ message: 'No questions found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomBatch = async (req, res) => {
  try {
    const filter = {};
    Object.assign(filter, PUBLIC_QUESTION_FILTER);
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
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
