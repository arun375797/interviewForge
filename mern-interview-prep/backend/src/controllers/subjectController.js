const Subject = require('../models/Subject');
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const {
  aggregateSubjectStats,
  aggregateTopicStats,
} = require('../utils/userProgressService');
const { getProgressOwnerId } = require('../utils/progressScope');

const DEFAULT_COLORS = ['#0F766E', '#CA8A04', '#0891B2', '#16A34A', '#DB2777', '#7C3AED', '#EA580C'];

function slugifyKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeTopicName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

async function refreshSubjectCounts(key) {
  const [studyCount, topics] = await Promise.all([
    Question.countDocuments({ subject: key, codeOnly: { $ne: true } }),
    Question.distinct('topic', { subject: key }),
  ]);
  const subject = await Subject.findOne({ key });
  const catalogNames = (subject?.topics || []).map((t) => t.name);
  const topicCount = new Set([...topics, ...catalogNames]).size;
  await Subject.findOneAndUpdate(
    { key },
    { questionCount: studyCount, topicCount },
    { new: true }
  );
  return { questionCount: studyCount, topicCount };
}

function mergeTopicLists(catalogTopics = [], liveTopics = [], { codePractice = false } = {}) {
  const map = new Map();

  for (const topic of catalogTopics) {
    if (Boolean(topic.codePractice) !== codePractice) continue;
    map.set(topic.name, {
      name: topic.name,
      topicOrder: topic.order ?? 0,
      count: 0,
      bookmarked: 0,
      mastered: 0,
      learned: 0,
      completed: 0,
      fromCatalog: true,
      codePractice: Boolean(topic.codePractice),
    });
  }

  for (const topic of liveTopics) {
    const existing = map.get(topic.name);
    if (existing) {
      map.set(topic.name, {
        ...existing,
        ...topic,
        topicOrder: topic.topicOrder ?? existing.topicOrder,
        fromCatalog: existing.fromCatalog,
        codePractice,
      });
    } else {
      map.set(topic.name, {
        ...topic,
        fromCatalog: false,
        codePractice,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => (a.topicOrder || 0) - (b.topicOrder || 0) || a.name.localeCompare(b.name)
  );
}

async function ensureSubjectExists(key) {
  const subject = await Subject.findOne({ key });
  if (!subject) {
    const err = new Error('Subject not found');
    err.status = 404;
    throw err;
  }
  return subject;
}

exports.getSubjectsAdmin = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const [subjects, liveCounts, codeCounts] = await Promise.all([
      Subject.find().sort({ order: 1, label: 1 }).lean(),
      aggregateSubjectStats(userId),
      Question.aggregate([
        { $match: { codeOnly: true } },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
      ]),
    ]);
    const liveMap = new Map(liveCounts.map((item) => [item.subject, item]));
    const codeMap = new Map(codeCounts.map((item) => [item._id, item.count]));

    res.json(
      subjects.map((subject) => {
        const live = liveMap.get(subject.key);
        return {
          ...subject,
          questionCount: live?.questionCount || 0,
          topicCount: Math.max(live?.topicCount || 0, subject.topics?.length || 0),
          codeQuestionCount: codeMap.get(subject.key) || 0,
          bookmarked: live?.bookmarked || 0,
          mastered: live?.mastered || 0,
          learned: live?.learned || 0,
        };
      })
    );
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const label = String(req.body.label || '').trim();
    const key = slugifyKey(req.body.key || label);
    if (!label || !key) {
      return res.status(400).json({ message: 'label is required' });
    }
    if (!/^[a-z][a-z0-9-]{1,47}$/.test(key)) {
      return res.status(400).json({
        message: 'key must be 2–48 chars, start with a letter, and use lowercase letters, numbers, or hyphens',
      });
    }

    const existing = await Subject.findOne({ key });
    if (existing) {
      return res.status(409).json({ message: `Subject "${key}" already exists` });
    }

    const count = await Subject.countDocuments();
    const subject = await Subject.create({
      key,
      label,
      short: String(req.body.short || label).trim().slice(0, 12),
      color: req.body.color || DEFAULT_COLORS[count % DEFAULT_COLORS.length],
      description: String(req.body.description || '').trim(),
      supportsCode: Boolean(req.body.supportsCode),
      order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : count + 1,
      topics: [],
    });

    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Subject key already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { key } = req.params;
    const subject = await ensureSubjectExists(key);
    const allowed = ['label', 'short', 'color', 'description', 'supportsCode', 'order'];
    for (const field of allowed) {
      if (req.body[field] === undefined) continue;
      if (field === 'supportsCode') {
        subject.supportsCode = Boolean(req.body.supportsCode);
      } else if (field === 'order') {
        subject.order = Number(req.body.order) || 0;
      } else {
        subject[field] = String(req.body[field] || '').trim();
      }
    }
    if (!subject.label) {
      return res.status(400).json({ message: 'label cannot be empty' });
    }
    await subject.save();
    const counts = await refreshSubjectCounts(key);
    res.json({ ...subject.toObject(), ...counts });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { key } = req.params;
    const cascade = req.query.cascade === 'true' || req.body?.cascade === true;
    await ensureSubjectExists(key);

    const questionCount = await Question.countDocuments({ subject: key });
    if (questionCount > 0 && !cascade) {
      return res.status(400).json({
        message: `Subject has ${questionCount} question(s). Pass cascade=true to delete them too.`,
        questionCount,
      });
    }

    if (questionCount > 0) {
      const ids = await Question.find({ subject: key }).select('_id').lean();
      const questionIds = ids.map((item) => item._id);
      await UserProgress.deleteMany({ questionId: { $in: questionIds } });
      await Question.deleteMany({ subject: key });
    }

    await Subject.deleteOne({ key });
    res.json({ message: 'Subject deleted', key, deletedQuestions: questionCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getSubjectTopicsAdmin = async (req, res) => {
  try {
    const { key } = req.params;
    const mode = req.query.mode === 'code' ? 'code' : 'study';
    const subject = await ensureSubjectExists(key);
    const userId = getProgressOwnerId(req);

    if (mode === 'code') {
      const codeTopics = await Question.aggregate([
        { $match: { subject: key, codeOnly: true } },
        {
          $group: {
            _id: '$topic',
            topicOrder: { $min: '$topicOrder' },
            count: { $sum: 1 },
          },
        },
        { $sort: { topicOrder: 1, _id: 1 } },
      ]);
      const live = codeTopics.map((row) => ({
        name: row._id,
        topicOrder: row.topicOrder,
        count: row.count,
      }));
      return res.json({
        subject: {
          key: subject.key,
          label: subject.label,
          supportsCode: subject.supportsCode,
          color: subject.color,
        },
        topics: mergeTopicLists(subject.topics, live, { codePractice: true }),
      });
    }

    const live = await aggregateTopicStats(userId, key);
    res.json({
      subject: {
        key: subject.key,
        label: subject.label,
        supportsCode: subject.supportsCode,
        color: subject.color,
      },
      topics: mergeTopicLists(subject.topics, live, { codePractice: false }),
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { key } = req.params;
    const name = normalizeTopicName(req.body.name);
    const codePractice = Boolean(req.body.codePractice);
    if (!name) {
      return res.status(400).json({ message: 'topic name is required' });
    }

    const subject = await ensureSubjectExists(key);
    if (codePractice && !subject.supportsCode) {
      return res.status(400).json({
        message: 'Enable code practice on this subject before adding code topics',
      });
    }

    const duplicate = subject.topics.some(
      (topic) => topic.name.toLowerCase() === name.toLowerCase() && Boolean(topic.codePractice) === codePractice
    );
    if (duplicate) {
      return res.status(409).json({ message: 'Topic already exists in the catalog' });
    }

    const sameMode = subject.topics.filter((topic) => Boolean(topic.codePractice) === codePractice);
    const order =
      Number.isFinite(Number(req.body.order))
        ? Number(req.body.order)
        : sameMode.reduce((max, topic) => Math.max(max, topic.order || 0), 0) + 1;

    subject.topics.push({ name, order, codePractice });
    subject.topicCount = new Set(subject.topics.map((topic) => topic.name)).size;
    await subject.save();

    res.status(201).json({
      name,
      topicOrder: order,
      count: 0,
      codePractice,
      fromCatalog: true,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.renameTopic = async (req, res) => {
  try {
    const { key } = req.params;
    const oldName = normalizeTopicName(req.body.oldName);
    const newName = normalizeTopicName(req.body.newName);
    const codePractice = Boolean(req.body.codePractice);
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'oldName and newName are required' });
    }
    if (oldName === newName) {
      return res.json({ message: 'No change', oldName, newName, updatedQuestions: 0 });
    }

    const subject = await ensureSubjectExists(key);
    const filter = {
      subject: key,
      topic: oldName,
      ...(codePractice ? { codeOnly: true } : { codeOnly: { $ne: true } }),
    };

    const updated = await Question.updateMany(filter, { $set: { topic: newName } });

    let catalogUpdated = false;
    subject.topics = subject.topics.map((topic) => {
      if (topic.name === oldName && Boolean(topic.codePractice) === codePractice) {
        catalogUpdated = true;
        return {
          name: newName,
          order: topic.order || 0,
          codePractice: Boolean(topic.codePractice),
        };
      }
      return {
        name: topic.name,
        order: topic.order || 0,
        codePractice: Boolean(topic.codePractice),
      };
    });
    if (catalogUpdated || updated.modifiedCount > 0) {
      await subject.save();
      await refreshSubjectCounts(key);
    }

    if (!catalogUpdated && updated.modifiedCount === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({
      message: 'Topic renamed',
      oldName,
      newName,
      updatedQuestions: updated.modifiedCount,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.reorderTopics = async (req, res) => {
  try {
    const { key } = req.params;
    const codePractice = Boolean(req.body.codePractice);
    const items = Array.isArray(req.body.topics) ? req.body.topics : [];
    if (!items.length) {
      return res.status(400).json({ message: 'topics array is required' });
    }

    const subject = await ensureSubjectExists(key);
    const orderByName = new Map(
      items
        .map((item) => [normalizeTopicName(item.name), Number(item.order)])
        .filter(([name, order]) => name && Number.isFinite(order))
    );

    subject.topics = subject.topics.map((topic) => {
      if (Boolean(topic.codePractice) !== codePractice) {
        return {
          name: topic.name,
          order: topic.order || 0,
          codePractice: Boolean(topic.codePractice),
        };
      }
      if (!orderByName.has(topic.name)) {
        return {
          name: topic.name,
          order: topic.order || 0,
          codePractice: Boolean(topic.codePractice),
        };
      }
      return {
        name: topic.name,
        order: orderByName.get(topic.name),
        codePractice: Boolean(topic.codePractice),
      };
    });

    // Ensure catalog contains every reordered topic
    for (const [name, order] of orderByName.entries()) {
      const exists = subject.topics.some(
        (topic) => topic.name === name && Boolean(topic.codePractice) === codePractice
      );
      if (!exists) {
        subject.topics.push({ name, order, codePractice });
      }
    }

    await subject.save();

    const questionFilter = {
      subject: key,
      ...(codePractice ? { codeOnly: true } : { codeOnly: { $ne: true } }),
    };
    const ops = [...orderByName.entries()].map(([name, order]) =>
      Question.updateMany({ ...questionFilter, topic: name }, { $set: { topicOrder: order } })
    );
    await Promise.all(ops);

    res.json({ message: 'Topics reordered', count: orderByName.size });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { key } = req.params;
    const name = normalizeTopicName(req.body.name || req.query.name);
    const codePractice = req.body.codePractice === true || req.query.codePractice === 'true';
    const cascade = req.body.cascade === true || req.query.cascade === 'true';
    if (!name) {
      return res.status(400).json({ message: 'topic name is required' });
    }

    const subject = await ensureSubjectExists(key);
    const filter = {
      subject: key,
      topic: name,
      ...(codePractice ? { codeOnly: true } : { codeOnly: { $ne: true } }),
    };
    const questionCount = await Question.countDocuments(filter);

    if (questionCount > 0 && !cascade) {
      return res.status(400).json({
        message: `Topic has ${questionCount} question(s). Pass cascade=true to delete them too.`,
        questionCount,
      });
    }

    let deletedQuestions = 0;
    if (questionCount > 0) {
      const ids = await Question.find(filter).select('_id').lean();
      const questionIds = ids.map((item) => item._id);
      await UserProgress.deleteMany({ questionId: { $in: questionIds } });
      const result = await Question.deleteMany(filter);
      deletedQuestions = result.deletedCount || 0;
    }

    subject.topics = subject.topics.filter(
      (topic) => !(topic.name === name && Boolean(topic.codePractice) === codePractice)
    );
    await subject.save();
    await refreshSubjectCounts(key);

    res.json({ message: 'Topic deleted', name, deletedQuestions });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.refreshSubjectCounts = refreshSubjectCounts;
exports.slugifyKey = slugifyKey;
exports.ensureSubjectExists = ensureSubjectExists;
