const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');
const { scheduleInitialReview } = require('./spacedRepetition');

const PROGRESS_FIELDS = [
  'bookmarked',
  'weakSpot',
  'inDailyReview',
  'inExplainList',
  'mastered',
  'learned',
  'codeCompleted',
  'savedCode',
  'savedCodeUpdatedAt',
  'notes',
  'nextReviewAt',
  'reviewCount',
  'easeFactor',
  'lastReviewRating',
  'failCount',
  'lastReviewedAt',
  'linkedNotebookPageId',
];

const PROGRESS_DEFAULTS = Object.fromEntries(
  PROGRESS_FIELDS.map((field) => {
    if (field === 'easeFactor') return [field, 2.5];
    if (field === 'reviewCount' || field === 'failCount') return [field, 0];
    if (field === 'savedCode' || field === 'notes' || field === 'lastReviewRating') return [field, ''];
    return [field, field.endsWith('At') || field.endsWith('Id') ? null : false];
  })
);

function progressToPlain(progress) {
  if (!progress) return { ...PROGRESS_DEFAULTS };
  const plain = typeof progress.toObject === 'function' ? progress.toObject() : progress;
  const out = { ...PROGRESS_DEFAULTS };
  for (const field of PROGRESS_FIELDS) {
    if (plain[field] !== undefined && plain[field] !== null) {
      out[field] = plain[field];
    }
  }
  return out;
}

function mergeQuestionWithProgress(question, progress) {
  const q = typeof question.toObject === 'function' ? question.toObject() : { ...question };
  const p = progressToPlain(progress);
  return {
    ...q,
    ...p,
    editorNotes: q.notes || '',
    notes: p.notes || '',
  };
}

async function loadProgressMap(userId, questionIds = null) {
  const filter = { userId };
  if (questionIds?.length) {
    filter.questionId = { $in: questionIds };
  }
  const rows = await UserProgress.find(filter).select('+savedCode').lean();
  return new Map(rows.map((row) => [String(row.questionId), row]));
}

async function mergeQuestions(userId, questions, { includeSavedCode = false } = {}) {
  if (!questions.length) return [];
  const ids = questions.map((q) => q._id);
  const filter = { userId, questionId: { $in: ids } };
  const query = UserProgress.find(filter);
  if (includeSavedCode) query.select('+savedCode');
  const rows = await query.lean();
  const map = new Map(rows.map((row) => [String(row.questionId), row]));
  return questions.map((q) => mergeQuestionWithProgress(q, map.get(String(q._id))));
}

async function getOrCreateProgress(userId, questionId) {
  let progress = await UserProgress.findOne({ userId, questionId });
  if (!progress) {
    progress = await UserProgress.create({ userId, questionId });
  }
  return progress;
}

async function questionIdsForProgressFilter(userId, progressFilter, { subject } = {}) {
  const filter = { userId, ...progressFilter };
  let ids = await UserProgress.find(filter).distinct('questionId');
  if (!ids.length) return [];
  if (subject) {
    const allowed = await Question.find({ _id: { $in: ids }, subject }).distinct('_id');
    ids = allowed;
  }
  return ids;
}

async function countProgressBySubject(userId, progressFilter) {
  const rows = await UserProgress.aggregate([
    { $match: { userId, ...progressFilter } },
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
    { $group: { _id: '$question.subject', count: { $sum: 1 } } },
  ]);
  const countBySubject = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  const totalAll = rows.reduce((sum, row) => sum + row.count, 0);
  return { totalAll, countBySubject };
}

async function formatQuestionResponse(userId, questionId, { includeSavedCode = false } = {}) {
  const question = await Question.findById(questionId).lean();
  if (!question) return null;
  const query = UserProgress.findOne({ userId, questionId });
  if (includeSavedCode) query.select('+savedCode');
  const progress = await query.lean();
  return mergeQuestionWithProgress(question, progress);
}

async function updateManyProgress(userId, filter, updates) {
  const baseFilter = { userId, ...filter };
  if (filter.subject) {
    const ids = await Question.find({ subject: filter.subject }).distinct('_id');
    baseFilter.questionId = { $in: ids };
    delete baseFilter.subject;
  }
  const result = await UserProgress.updateMany(baseFilter, { $set: updates });
  return result.modifiedCount;
}

async function clearProgressFlags(userId, flagField, { subject } = {}) {
  const filter = { userId, [flagField]: true };
  if (subject) {
    const ids = await Question.find({ subject }).distinct('_id');
    filter.questionId = { $in: ids };
  }
  const result = await UserProgress.updateMany(filter, { $set: { [flagField]: false } });
  return result.modifiedCount;
}

async function aggregateSubjectStats(userId) {
  const allQuestions = await Question.aggregate([
    { $match: { codeOnly: { $ne: true } } },
    {
      $group: {
        _id: '$subject',
        questionCount: { $sum: 1 },
        topics: { $addToSet: '$topic' },
      },
    },
    {
      $project: {
        questionCount: 1,
        topicCount: { $size: '$topics' },
      },
    },
  ]);

  const progressBySubject = await UserProgress.aggregate([
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
        _id: '$question.subject',
        bookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
        mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
        learned: { $sum: { $cond: ['$learned', 1, 0] } },
      },
    },
  ]);

  const progressMap = new Map(progressBySubject.map((row) => [row._id, row]));
  return allQuestions.map((row) => {
    const progress = progressMap.get(row._id) || {};
    return {
      subject: row._id,
      questionCount: row.questionCount,
      topicCount: row.topicCount,
      bookmarked: progress.bookmarked || 0,
      mastered: progress.mastered || 0,
      learned: progress.learned || 0,
    };
  });
}

async function aggregateTopicStats(userId, subject) {
  const questions = await Question.aggregate([
    { $match: { subject, codeOnly: { $ne: true } } },
    {
      $group: {
        _id: '$topic',
        topicOrder: { $min: '$topicOrder' },
        count: { $sum: 1 },
        questionIds: { $push: '$_id' },
      },
    },
    { $sort: { topicOrder: 1, _id: 1 } },
  ]);

  const allIds = questions.flatMap((t) => t.questionIds);
  const progressMap = await loadProgressMap(userId, allIds);

  return questions.map((topic) => {
    let bookmarked = 0;
    let mastered = 0;
    let learned = 0;
    for (const id of topic.questionIds) {
      const p = progressMap.get(String(id));
      if (p?.bookmarked) bookmarked += 1;
      if (p?.mastered) mastered += 1;
      if (p?.learned) learned += 1;
    }
    return {
      name: topic._id,
      topicOrder: topic.topicOrder,
      count: topic.count,
      bookmarked,
      mastered,
      learned,
    };
  });
}

async function toggleDailyReview(userId, questionId) {
  const progress = await getOrCreateProgress(userId, questionId);
  progress.inDailyReview = !progress.inDailyReview;
  if (progress.inDailyReview) {
    const schedule = scheduleInitialReview();
    progress.nextReviewAt = schedule.nextReviewAt;
    if (!progress.reviewCount) progress.reviewCount = 0;
  }
  await progress.save();
  return progress;
}

module.exports = {
  PROGRESS_FIELDS,
  PROGRESS_DEFAULTS,
  progressToPlain,
  mergeQuestionWithProgress,
  loadProgressMap,
  mergeQuestions,
  getOrCreateProgress,
  questionIdsForProgressFilter,
  countProgressBySubject,
  formatQuestionResponse,
  updateManyProgress,
  clearProgressFlags,
  aggregateSubjectStats,
  aggregateTopicStats,
  toggleDailyReview,
};
