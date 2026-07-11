const Notebook = require('../models/Notebook');
const NotebookPage = require('../models/NotebookPage');
const { getProgressOwnerId } = require('../utils/progressScope');

const NOTEBOOK_COLORS = ['#0f766e', '#0891b2', '#ca8a04', '#c2410c', '#7c3aed', '#db2777', '#16a34a'];

async function assertNotebookOwner(notebookId, userId) {
  const notebook = await Notebook.findOne({ _id: notebookId, userId }).lean();
  if (!notebook) return null;
  return notebook;
}

async function assertPageOwner(pageId, userId) {
  const page = await NotebookPage.findOne({ _id: pageId, userId }).lean();
  if (!page) return null;
  return page;
}

async function nextPageNumber(notebookId, userId) {
  const latest = await NotebookPage.findOne({ notebookId, userId })
    .sort({ pageNumber: -1 })
    .select('pageNumber')
    .lean();
  return (latest?.pageNumber || 0) + 1;
}

function sanitizeSubtopics(value) {
  if (!Array.isArray(value)) {
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizePage(page) {
  if (!page) return page;
  const subtopics =
    Array.isArray(page.subtopics) && page.subtopics.length
      ? sanitizeSubtopics(page.subtopics)
      : page.subtopic
        ? sanitizeSubtopics([page.subtopic])
        : [];
  const { subtopic: _legacy, ...rest } = page;
  return { ...rest, subtopics };
}

exports.listNotebooks = async (req, res) => {
  try {
    const notebooks = await Notebook.find({ userId: getProgressOwnerId(req) })
      .sort({ updatedAt: -1 })
      .lean();

    const pageCounts = await NotebookPage.aggregate([
      { $match: { userId: getProgressOwnerId(req) } },
      { $group: { _id: '$notebookId', count: { $sum: 1 } } },
    ]);
    const countByNotebook = new Map(pageCounts.map((row) => [String(row._id), row.count]));

    res.json(
      notebooks.map((notebook) => ({
        ...notebook,
        pageCount: countByNotebook.get(String(notebook._id)) || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNotebook = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const color =
      NOTEBOOK_COLORS.includes(req.body.color) ? req.body.color : NOTEBOOK_COLORS[0];
    const description = String(req.body.description || '').trim();

    const notebook = await Notebook.create({
      userId: getProgressOwnerId(req),
      title,
      color,
      description,
    });

    res.status(201).json(notebook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotebook = async (req, res) => {
  try {
    const notebook = await assertNotebookOwner(req.params.id, getProgressOwnerId(req));
    if (!notebook) return res.status(404).json({ message: 'Notebook not found' });

    const pages = await NotebookPage.find({ notebookId: notebook._id, userId: getProgressOwnerId(req) })
      .sort({ pageNumber: 1 })
      .select('_id pageNumber topic subtopics subtopic updatedAt createdAt')
      .lean();

    res.json({ ...notebook, pages: pages.map(normalizePage) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: getProgressOwnerId(req) });
    if (!notebook) return res.status(404).json({ message: 'Notebook not found' });

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ message: 'Title cannot be empty' });
      notebook.title = title;
    }
    if (req.body.description !== undefined) {
      notebook.description = String(req.body.description).trim();
    }
    if (req.body.color !== undefined && NOTEBOOK_COLORS.includes(req.body.color)) {
      notebook.color = req.body.color;
    }

    await notebook.save();
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOneAndDelete({ _id: req.params.id, userId: getProgressOwnerId(req) });
    if (!notebook) return res.status(404).json({ message: 'Notebook not found' });

    await NotebookPage.deleteMany({ notebookId: notebook._id, userId: getProgressOwnerId(req) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const notebook = await assertNotebookOwner(req.params.id, getProgressOwnerId(req));
    if (!notebook) return res.status(404).json({ message: 'Notebook not found' });

    const pageNumber =
      req.body.pageNumber !== undefined
        ? Number(req.body.pageNumber)
        : await nextPageNumber(notebook._id, getProgressOwnerId(req));

    if (!Number.isFinite(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: 'Page number must be a positive number' });
    }

    const duplicate = await NotebookPage.findOne({
      notebookId: notebook._id,
      userId: getProgressOwnerId(req),
      pageNumber,
    }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'Page number already exists in this notebook' });
    }

    const topic = String(req.body.topic || 'Untitled').trim() || 'Untitled';
    const subtopics = sanitizeSubtopics(req.body.subtopics ?? req.body.subtopic);
    const content = String(req.body.content || '');

    const page = await NotebookPage.create({
      notebookId: notebook._id,
      userId: getProgressOwnerId(req),
      pageNumber,
      topic,
      subtopics,
      content,
    });

    await Notebook.findByIdAndUpdate(notebook._id, { updatedAt: new Date() });
    res.status(201).json(normalizePage(page.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPage = async (req, res) => {
  try {
    const page = await NotebookPage.findOne({
      _id: req.params.pageId,
      notebookId: req.params.id,
      userId: getProgressOwnerId(req),
    }).lean();

    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(normalizePage(page));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await NotebookPage.findOne({
      _id: req.params.pageId,
      notebookId: req.params.id,
      userId: getProgressOwnerId(req),
    });

    if (!page) return res.status(404).json({ message: 'Page not found' });

    if (req.body.pageNumber !== undefined) {
      const pageNumber = Number(req.body.pageNumber);
      if (!Number.isFinite(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ message: 'Page number must be a positive number' });
      }
      if (pageNumber !== page.pageNumber) {
        const duplicate = await NotebookPage.findOne({
          notebookId: page.notebookId,
          userId: getProgressOwnerId(req),
          pageNumber,
          _id: { $ne: page._id },
        }).lean();
        if (duplicate) {
          return res.status(409).json({ message: 'Page number already exists in this notebook' });
        }
        page.pageNumber = pageNumber;
      }
    }

    if (req.body.topic !== undefined) {
      const topic = String(req.body.topic).trim();
      if (!topic) return res.status(400).json({ message: 'Topic cannot be empty' });
      page.topic = topic;
    }

    if (req.body.subtopics !== undefined || req.body.subtopic !== undefined) {
      page.subtopics = sanitizeSubtopics(req.body.subtopics ?? req.body.subtopic);
    }

    if (req.body.content !== undefined) {
      page.content = String(req.body.content);
    }

    await page.save();
    await Notebook.findByIdAndUpdate(page.notebookId, { updatedAt: new Date() });
    res.json(normalizePage(page.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await NotebookPage.findOneAndDelete({
      _id: req.params.pageId,
      notebookId: req.params.id,
      userId: getProgressOwnerId(req),
    });

    if (!page) return res.status(404).json({ message: 'Page not found' });

    await Notebook.findByIdAndUpdate(page.notebookId, { updatedAt: new Date() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
