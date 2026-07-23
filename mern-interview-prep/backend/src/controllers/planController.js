const Plan = require('../models/Plan');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const {
  CODE_SUBJECTS,
  CODE_KEYWORD_RE,
  isCodePracticeQuestion,
  toCodeQuestion,
} = require('../utils/codePracticeGenerator');
const { loadProgressMap } = require('../utils/userProgressService');
const { getProgressOwnerId } = require('../utils/progressScope');

const PUBLIC_QUESTION_FILTER = { codeOnly: { $ne: true } };
const PLAN_DAYS = [3, 5, 10, 15];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function splitIntoDays(questionIds, days, startDate) {
  const perDay = Math.ceil(questionIds.length / days) || 0;
  return Array.from({ length: days }, (_, index) => {
    const start = index * perDay;
    const end = start + perDay;
    return {
      dayNumber: index + 1,
      date: addDays(startDate, index),
      questionIds: questionIds.slice(start, end),
    };
  });
}

async function loadStudyQuestionIds(subject) {
  const questions = await Question.find({ subject, ...PUBLIC_QUESTION_FILTER })
    .sort({ topicOrder: 1, order: 1 })
    .select('_id')
    .lean();
  return questions.map((q) => q._id);
}

async function loadCodeQuestionIds(subject) {
  const filter = {
    subject,
    $or: [{ question: CODE_KEYWORD_RE }, { codeOnly: true }],
  };
  const docs = await Question.find(filter)
    .sort({ topicOrder: 1, order: 1 })
    .select('subject topic topicOrder question answer difficulty tags order codeOnly notes')
    .lean();

  return docs
    .filter((doc) => isCodePracticeQuestion(doc))
    .map((doc) => toCodeQuestion(doc))
    .sort(
      (a, b) =>
        (a.codePrompt.topicOrder || 99) - (b.codePrompt.topicOrder || 99) ||
        (a.order || 0) - (b.order || 0)
    )
    .map((q) => q._id);
}

async function validateStartPayload({ mode, subject, days }) {
  if (!['study', 'code'].includes(mode)) return 'mode must be study or code';
  if (!PLAN_DAYS.includes(Number(days))) return 'days must be 3, 5, 10, or 15';
  const subjectDoc = await Subject.findOne({ key: subject }).select('key supportsCode').lean();
  if (!subjectDoc) return 'unknown subject';
  if (mode === 'code' && !(subjectDoc.supportsCode || CODE_SUBJECTS.includes(subject))) {
    return 'code mode is not enabled for this subject';
  }
  return '';
}

function progressForQuestion(progress, mode) {
  if (!progress) return false;
  return mode === 'code' ? Boolean(progress.codeCompleted) : Boolean(progress.learned);
}

async function serializePlan(plan, userId) {
  if (!plan) return null;

  const ids = plan.planDays.flatMap((day) => day.questionIds);
  const questions = await Question.find({ _id: { $in: ids } })
    .select('subject topic topicOrder question difficulty order codeOnly')
    .lean();
  const byId = new Map(questions.map((q) => [String(q._id), q]));
  const progressMap = await loadProgressMap(userId, ids);

  const planDays = plan.planDays.map((day) => {
    const dayQuestions = day.questionIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .map((q) => ({
        ...q,
        done: progressForQuestion(progressMap.get(String(q._id)), plan.mode),
      }));
    const completed = dayQuestions.filter((q) => q.done).length;
    return {
      dayNumber: day.dayNumber,
      date: day.date,
      questions: dayQuestions,
      total: dayQuestions.length,
      completed,
      remaining: Math.max(0, dayQuestions.length - completed),
      percent: dayQuestions.length ? Math.round((completed / dayQuestions.length) * 100) : 0,
    };
  });

  const completed = planDays.reduce((sum, day) => sum + day.completed, 0);
  const total = planDays.reduce((sum, day) => sum + day.total, 0);

  return {
    _id: plan._id,
    mode: plan.mode,
    subject: plan.subject,
    days: plan.days,
    active: plan.active,
    startDate: plan.startDate,
    endDate: plan.endDate,
    totalQuestions: total,
    completed,
    remaining: Math.max(0, total - completed),
    percent: total ? Math.round((completed / total) * 100) : 0,
    planDays,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

exports.getActivePlans = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const filter = { userId, active: true };
    if (req.query.mode) filter.mode = req.query.mode;
    if (req.query.subject) filter.subject = req.query.subject;

    const plans = await Plan.find(filter).sort({ createdAt: -1 }).lean();
    const serialized = await Promise.all(plans.map((plan) => serializePlan(plan, userId)));
    res.json(serialized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.startPlan = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const { mode, subject } = req.body;
    const days = Number(req.body.days);
    const error = await validateStartPayload({ mode, subject, days });
    if (error) return res.status(400).json({ message: error });

    const questionIds =
      mode === 'code' ? await loadCodeQuestionIds(subject) : await loadStudyQuestionIds(subject);
    if (!questionIds.length) {
      return res.status(404).json({ message: 'No questions found for this plan' });
    }

    const startDate = startOfToday();
    const endDate = addDays(startDate, days - 1);
    const planDays = splitIntoDays(questionIds, days, startDate);

    await Plan.updateMany({ userId, mode, subject, active: true }, { $set: { active: false } });
    const plan = await Plan.create({
      userId,
      mode,
      subject,
      days,
      startDate,
      endDate,
      active: true,
      totalQuestions: questionIds.length,
      planDays,
    });

    res.status(201).json(await serializePlan(plan.toObject(), userId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disablePlan = async (req, res) => {
  try {
    const userId = getProgressOwnerId(req);
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { active: false } },
      { new: true }
    ).lean();
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(await serializePlan(plan, userId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
