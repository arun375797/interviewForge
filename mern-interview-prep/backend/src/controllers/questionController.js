const Question = require('../models/Question');
const Subject = require('../models/Subject');
const {
  generateAnswer,
  generateKeyPoints,
  difficultyFromQuestion,
} = require('../utils/answerGenerator');

exports.getSubjects = async (_req, res) => {
  try {
    const subjects = await Subject.find().sort({ label: 1 });
    const withLiveCounts = await Promise.all(
      subjects.map(async (s) => {
        const questionCount = await Question.countDocuments({ subject: s.key });
        const topics = await Question.distinct('topic', { subject: s.key });
        const bookmarked = await Question.countDocuments({ subject: s.key, bookmarked: true });
        const mastered = await Question.countDocuments({ subject: s.key, mastered: true });
        return {
          ...s.toObject(),
          questionCount,
          topicCount: topics.length,
          bookmarked,
          mastered,
        };
      })
    );
    res.json(withLiveCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTopics = async (req, res) => {
  try {
    const { subject } = req.params;
    const topics = await Question.aggregate([
      { $match: { subject } },
      {
        $group: {
          _id: '$topic',
          topicOrder: { $min: '$topicOrder' },
          count: { $sum: 1 },
          bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
          mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
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
      page = 1,
      limit = 50,
      sort = 'order',
    } = req.query;

    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (bookmarked === 'true') filter.bookmarked = true;
    if (mastered === 'true') filter.mastered = true;
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
      answer: answer || generateAnswer(question, subject, topic),
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
      'topic',
      'subject',
      'difficulty',
      'keyPoints',
      'notes',
      'tags',
      'bookmarked',
      'mastered',
      'order',
      'topicOrder',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
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

exports.getStats = async (_req, res) => {
  try {
    const [total, bookmarked, mastered, bySubject, byDifficulty] = await Promise.all([
      Question.countDocuments(),
      Question.countDocuments({ bookmarked: true }),
      Question.countDocuments({ mastered: true }),
      Question.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 } } }]),
      Question.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
    ]);
    res.json({ total, bookmarked, mastered, bySubject, byDifficulty });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRandomQuestion = async (req, res) => {
  try {
    const filter = {};
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
