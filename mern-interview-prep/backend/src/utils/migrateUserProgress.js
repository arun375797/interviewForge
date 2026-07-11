const Question = require('../models/Question');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Plan = require('../models/Plan');
const Notebook = require('../models/Notebook');
const NotebookPage = require('../models/NotebookPage');
const { getAdminEmails } = require('./adminAccess');
const { ADMIN_SHARED_OWNER_ID } = require('./progressScope');

const LEGACY_PROGRESS_FIELDS = [
  'bookmarked',
  'weakSpot',
  'inDailyReview',
  'inExplainList',
  'mastered',
  'learned',
  'codeCompleted',
  'savedCode',
  'savedCodeUpdatedAt',
  'nextReviewAt',
  'reviewCount',
  'easeFactor',
  'lastReviewRating',
  'failCount',
  'lastReviewedAt',
  'linkedNotebookPageId',
];

let migrationPromise = null;
let adminConsolidated = false;

function mergeProgressValues(existing, incoming) {
  const merged = { ...existing };
  const boolFields = [
    'bookmarked',
    'weakSpot',
    'inDailyReview',
    'inExplainList',
    'mastered',
    'learned',
    'codeCompleted',
  ];
  for (const field of boolFields) {
    merged[field] = Boolean(existing?.[field] || incoming?.[field]);
  }

  if ((incoming?.savedCode || '').length > (existing?.savedCode || '').length) {
    merged.savedCode = incoming.savedCode;
    merged.savedCodeUpdatedAt = incoming.savedCodeUpdatedAt;
  }

  if ((incoming?.notes || '').length > (existing?.notes || '').length) {
    merged.notes = incoming.notes;
  }

  merged.reviewCount = Math.max(existing?.reviewCount || 0, incoming?.reviewCount || 0);
  merged.failCount = Math.max(existing?.failCount || 0, incoming?.failCount || 0);
  merged.easeFactor = Math.max(existing?.easeFactor || 2.5, incoming?.easeFactor || 2.5);

  const existingReview = existing?.nextReviewAt ? new Date(existing.nextReviewAt).getTime() : null;
  const incomingReview = incoming?.nextReviewAt ? new Date(incoming.nextReviewAt).getTime() : null;
  if (
    incomingReview &&
    (existingReview === null || incomingReview <= existingReview)
  ) {
    merged.nextReviewAt = incoming.nextReviewAt;
    merged.lastReviewRating = incoming.lastReviewRating || existing?.lastReviewRating || '';
    merged.lastReviewedAt = incoming.lastReviewedAt || existing?.lastReviewedAt;
  }

  if (incoming?.linkedNotebookPageId && !existing?.linkedNotebookPageId) {
    merged.linkedNotebookPageId = incoming.linkedNotebookPageId;
  }

  return merged;
}

async function consolidateAdminSharedProgress() {
  if (adminConsolidated) return;

  const adminEmails = [...getAdminEmails()];
  const adminUsers = await User.find({ email: { $in: adminEmails } }).select('_id email').lean();
  const adminUserIds = adminUsers
    .map((user) => user._id)
    .filter((id) => String(id) !== String(ADMIN_SHARED_OWNER_ID));

  if (!adminUserIds.length) {
    adminConsolidated = true;
    return;
  }

  const legacyProgress = await UserProgress.find({
    userId: { $in: adminUserIds },
  })
    .select('+savedCode')
    .lean();

  for (const row of legacyProgress) {
    const existing = await UserProgress.findOne({
      userId: ADMIN_SHARED_OWNER_ID,
      questionId: row.questionId,
    })
      .select('+savedCode')
      .lean();

    const merged = mergeProgressValues(existing, row);
    await UserProgress.findOneAndUpdate(
      { userId: ADMIN_SHARED_OWNER_ID, questionId: row.questionId },
      { $set: { ...merged, userId: ADMIN_SHARED_OWNER_ID, questionId: row.questionId } },
      { upsert: true }
    );
  }

  if (legacyProgress.length) {
    await UserProgress.deleteMany({ userId: { $in: adminUserIds } });
    console.info(
      `[migrateUserProgress] Consolidated ${legacyProgress.length} admin progress row(s) into shared admin memory.`
    );
  }

  const [planResult, notebookResult, pageResult] = await Promise.all([
    Plan.updateMany({ userId: { $in: adminUserIds } }, { $set: { userId: ADMIN_SHARED_OWNER_ID } }),
    Notebook.updateMany(
      { userId: { $in: adminUserIds } },
      { $set: { userId: ADMIN_SHARED_OWNER_ID } }
    ),
    NotebookPage.updateMany(
      { userId: { $in: adminUserIds } },
      { $set: { userId: ADMIN_SHARED_OWNER_ID } }
    ),
  ]);

  if (planResult.modifiedCount || notebookResult.modifiedCount || pageResult.modifiedCount) {
    console.info(
      `[migrateUserProgress] Moved admin-owned plans/notebooks to shared admin memory (plans: ${planResult.modifiedCount}, notebooks: ${notebookResult.modifiedCount}, pages: ${pageResult.modifiedCount}).`
    );
  }

  adminConsolidated = true;
}

async function migratePlansWithoutUser() {
  const result = await Plan.deleteMany({ userId: { $exists: false } });
  if (result.deletedCount) {
    console.info(
      `[migrateUserProgress] Removed ${result.deletedCount} legacy plan(s) without userId.`
    );
  }
  return { deletedPlans: result.deletedCount };
}

async function migrateUserProgressOnce() {
  await migratePlansWithoutUser();
  await consolidateAdminSharedProgress();

  const hasLegacyFields = await Question.exists({
    $or: LEGACY_PROGRESS_FIELDS.map((field) => ({ [field]: { $exists: true } })),
  });
  if (!hasLegacyFields) {
    return { cleared: 0 };
  }

  const unset = Object.fromEntries(LEGACY_PROGRESS_FIELDS.map((field) => [field, '']));
  const result = await Question.updateMany({}, { $unset: unset });
  if (result.modifiedCount) {
    console.info(
      `[migrateUserProgress] Cleared legacy global progress fields from ${result.modifiedCount} question(s). Per-user progress now lives in UserProgress.`
    );
  }
  return { cleared: result.modifiedCount };
}

function ensureUserProgressMigration() {
  if (!migrationPromise) {
    migrationPromise = migrateUserProgressOnce().catch((err) => {
      migrationPromise = null;
      throw err;
    });
  }
  return migrationPromise;
}

module.exports = { migrateUserProgressOnce, ensureUserProgressMigration };
