import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Hash,
  ListTree,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useConfirm } from '../context/ConfirmDialogContext';
import NotebookEditor from './NotebookEditor';
import { NOTEBOOK_COLORS } from '../utils/notebookConstants';
import {
  buildIndexGroups,
  filterIndexGroups,
  normalizeSubtopics,
  sanitizeSubtopics,
} from '../utils/notebookIndex';

function formatSavedAt(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function IndexSidebar({
  groups,
  notebookId,
  activePageId,
  expandedTopics,
  onToggleTopic,
  indexSearch,
  onSearchChange,
  totalPages,
}) {
  const indexRowGrid =
    'grid grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-center gap-x-2 px-2';

  const filteredGroups = useMemo(
    () => filterIndexGroups(groups, indexSearch),
    [groups, indexSearch]
  );

  const matchingPageCount = useMemo(() => {
    const ids = new Set();
    for (const group of filteredGroups) {
      for (const entry of group.entries) ids.add(entry.pageId);
    }
    return ids.size;
  }, [filteredGroups]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Index</h2>
        <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs text-muted">
          {indexSearch.trim()
            ? `${matchingPageCount} / ${totalPages}`
            : `${totalPages} pages`}
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={indexSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search topic or subtopic…"
          className="w-full rounded-xl border border-line bg-paper py-2 pl-9 pr-9 text-sm outline-none focus:border-accent"
        />
        {indexSearch ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:bg-paper-2 hover:text-ink"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className={`mb-3 ${indexRowGrid} text-[11px] font-semibold uppercase tracking-wide text-muted`}
      >
        <span>Page</span>
        <span>Topic / Subtopic</span>
        <span aria-hidden="true" />
      </div>

      <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
        {filteredGroups.length === 0 ? (
          <p className="rounded-xl bg-paper-2/60 px-3 py-4 text-center text-sm text-muted">
            No pages match &ldquo;{indexSearch.trim()}&rdquo;
          </p>
        ) : (
          filteredGroups.map((group) => {
            const expanded = expandedTopics.has(group.key) || Boolean(indexSearch.trim());
            const groupActive = group.pages.some((item) => item._id === activePageId);

            if (!group.isExpandable) {
              const entry = group.entries[0];
              const active = entry.pageId === activePageId;
              return (
                <Link
                  key={group.key}
                  to={`/notebook/${notebookId}/page/${entry.pageId}`}
                  className={`${indexRowGrid} rounded-xl py-2 text-sm transition ${
                    active ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-2'
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums">{entry.pageNumber}</span>
                  <span className="truncate">{group.topic}</span>
                  <span aria-hidden="true" />
                </Link>
              );
            }

            return (
              <div key={group.key} className="rounded-xl">
                <button
                  type="button"
                  onClick={() => onToggleTopic(group.key)}
                  className={`${indexRowGrid} w-full rounded-xl py-2 text-left text-sm transition ${
                    groupActive && !expanded
                      ? 'bg-ink/10 text-ink'
                      : 'text-ink hover:bg-paper-2'
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums text-muted">{group.minPage}</span>
                  <span className="truncate font-medium">{group.topic}</span>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 justify-self-end text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 justify-self-end text-muted" />
                  )}
                </button>

                {expanded ? (
                  <div className="mt-0.5 space-y-0.5">
                    {group.entries.map((entry, index) => {
                      const active = entry.pageId === activePageId;
                      return (
                        <Link
                          key={`${entry.pageId}-${entry.label}-${index}`}
                          to={`/notebook/${notebookId}/page/${entry.pageId}`}
                          className={`${indexRowGrid} rounded-lg py-1.5 text-sm transition ${
                            active
                              ? 'bg-ink text-paper'
                              : 'text-ink-soft hover:bg-paper-2 hover:text-ink'
                          }`}
                        >
                          <span className="font-mono text-[11px] tabular-nums opacity-70">
                            {entry.pageNumber}
                          </span>
                          <span className="truncate border-l border-line/70 pl-2">
                            {entry.label}
                          </span>
                          <span aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export default function NotebookView() {
  const { notebookId, pageId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const saveTimer = useRef(null);
  const pendingSave = useRef(null);

  const [notebook, setNotebook] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState(['']);
  const [pageNumber, setPageNumber] = useState('');
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [creatingPage, setCreatingPage] = useState(false);
  const [addingSubtopic, setAddingSubtopic] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [indexSearch, setIndexSearch] = useState('');
  const [expandedTopics, setExpandedTopics] = useState(() => new Set());

  const pages = notebook?.pages || [];
  const accent = notebook?.color || NOTEBOOK_COLORS[0].value;

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.pageNumber - b.pageNumber),
    [pages]
  );

  const indexGroups = useMemo(() => buildIndexGroups(sortedPages), [sortedPages]);

  const isSubtopicPage = useMemo(() => {
    if (!page) return false;
    return normalizeSubtopics(page).length > 0;
  }, [page]);

  const childSubtopicPages = useMemo(() => {
    if (!page || isSubtopicPage) return [];
    const topicKey = (page.topic || 'Untitled').trim().toLowerCase();
    return sortedPages.filter((item) => {
      if (normalizeSubtopics(item).length === 0) return false;
      return (item.topic || 'Untitled').trim().toLowerCase() === topicKey;
    });
  }, [page, isSubtopicPage, sortedPages]);

  const parentTopicPage = useMemo(() => {
    if (!page || !isSubtopicPage) return null;
    const topicKey = (page.topic || 'Untitled').trim().toLowerCase();
    return (
      sortedPages.find(
        (item) =>
          item._id !== page._id &&
          normalizeSubtopics(item).length === 0 &&
          (item.topic || 'Untitled').trim().toLowerCase() === topicKey
      ) || null
    );
  }, [page, isSubtopicPage, sortedPages]);

  const loadNotebook = useCallback(async () => {
    const data = await api.getNotebook(notebookId);
    setNotebook(data);
    return data;
  }, [notebookId]);

  const loadPage = useCallback(
    async (targetPageId) => {
      const data = await api.getNotebookPage(notebookId, targetPageId);
      setPage(data);
      setTopic(data.topic);
      const nextSubtopics = normalizeSubtopics(data);
      setSubtopics(nextSubtopics);
      setPageNumber(String(data.pageNumber));
      setContent(data.content || '');
      setSaveState('idle');
      return data;
    },
    [notebookId]
  );

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError('');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      pendingSave.current = null;

      try {
        const nb = await loadNotebook();
        if (!alive) return;

        if (pageId) {
          await loadPage(pageId);
        } else if (nb.pages?.length) {
          const first = [...nb.pages].sort((a, b) => a.pageNumber - b.pageNumber)[0];
          navigate(`/notebook/${notebookId}/page/${first._id}`, { replace: true });
        } else {
          setPage(null);
        }
      } catch (err) {
        if (alive) setError(err.message || 'Could not load notebook');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [notebookId, pageId, loadNotebook, loadPage, navigate]);

  useEffect(() => {
    if (!pageId || !sortedPages.length) return;
    const current = sortedPages.find((item) => item._id === pageId);
    if (!current) return;
    const key = (current.topic || 'Untitled').trim().toLowerCase();
    setExpandedTopics((prev) => new Set([...prev, key]));
  }, [pageId, sortedPages]);

  const flushSave = useCallback(async () => {
    if (!page || !pendingSave.current) return;
    const payload = pendingSave.current;
    pendingSave.current = null;
    setSaveState('saving');
    try {
      const updated = await api.updateNotebookPage(notebookId, page._id, payload);
      setPage(updated);
      setNotebook((prev) => {
        if (!prev) return prev;
        const nextPages = prev.pages.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                topic: updated.topic,
                subtopics: normalizeSubtopics(updated),
                pageNumber: updated.pageNumber,
                updatedAt: updated.updatedAt,
              }
            : item
        );
        return { ...prev, pages: nextPages, updatedAt: updated.updatedAt };
      });
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setError(err.message || 'Could not save page');
    }
  }, [notebookId, page]);

  const scheduleSave = useCallback(
    (patch) => {
      pendingSave.current = { ...(pendingSave.current || {}), ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        flushSave();
      }, 700);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onTopicChange = (value) => {
    setTopic(value);
    scheduleSave({ topic: value.trim() || 'Untitled' });
  };

  const saveSubtopics = (next) => {
    setSubtopics(next);
    scheduleSave({ subtopics: sanitizeSubtopics(next) });
  };

  const onSubtopicChange = (value) => {
    saveSubtopics([value]);
  };

  const addSubtopic = async () => {
    if (!page || addingSubtopic) return;
    setAddingSubtopic(true);
    setError('');
    try {
      const topicKey = (topic || 'Untitled').trim().toLowerCase();
      const siblings = sortedPages.filter(
        (item) =>
          normalizeSubtopics(item).length > 0 &&
          (item.topic || 'Untitled').trim().toLowerCase() === topicKey
      );
      const nextNumber =
        sortedPages.length > 0 ? Math.max(...sortedPages.map((item) => item.pageNumber)) + 1 : 1;
      const created = await api.createNotebookPage(notebookId, {
        pageNumber: nextNumber,
        topic: topic.trim() || 'Untitled',
        subtopics: [`Subtopic ${siblings.length + 1}`],
        content: '',
      });
      setNotebook((prev) => ({
        ...prev,
        pages: [...(prev?.pages || []), { ...created, subtopics: normalizeSubtopics(created) }],
      }));
      const key = (created.topic || 'Untitled').trim().toLowerCase();
      setExpandedTopics((prev) => new Set([...prev, key]));
      navigate(`/notebook/${notebookId}/page/${created._id}`);
    } catch (err) {
      setError(err.message || 'Could not create subtopic page');
    } finally {
      setAddingSubtopic(false);
    }
  };

  const onPageNumberChange = (value) => {
    setPageNumber(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      scheduleSave({ pageNumber: parsed });
    }
  };

  const onContentChange = (html) => {
    setContent(html);
    scheduleSave({ content: html });
  };

  const toggleTopic = (key) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const createPage = async () => {
    setCreatingPage(true);
    setError('');
    try {
      const nextNumber =
        sortedPages.length > 0 ? Math.max(...sortedPages.map((item) => item.pageNumber)) + 1 : 1;
      const created = await api.createNotebookPage(notebookId, {
        pageNumber: nextNumber,
        topic: `Topic ${nextNumber}`,
        subtopics: [],
        content: '',
      });
      setNotebook((prev) => ({
        ...prev,
        pages: [...(prev?.pages || []), { ...created, subtopics: normalizeSubtopics(created) }],
      }));
      navigate(`/notebook/${notebookId}/page/${created._id}`);
    } catch (err) {
      setError(err.message || 'Could not create page');
    } finally {
      setCreatingPage(false);
    }
  };

  const deleteCurrentPage = async () => {
    if (!page) return;
    const confirmed = await confirm({
      title: 'Delete page',
      message: 'Delete this page permanently? This cannot be undone.',
      confirmLabel: 'Delete page',
    });
    if (!confirmed) return;
    try {
      await api.deleteNotebookPage(notebookId, page._id);
      const nb = await loadNotebook();
      const remaining = [...(nb.pages || [])].sort((a, b) => a.pageNumber - b.pageNumber);
      if (remaining.length) {
        navigate(`/notebook/${notebookId}/page/${remaining[0]._id}`, { replace: true });
      } else {
        setPage(null);
        navigate(`/notebook/${notebookId}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Could not delete page');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="skeleton h-[520px] rounded-3xl" />
          <div className="skeleton h-[520px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        Notebook not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <header className="glass-panel rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/notebook"
              className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-paper-2 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Notebooks
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <h1 className="truncate font-display text-2xl text-ink sm:text-3xl">
                  {notebook.title}
                </h1>
              </div>
              {notebook.description ? (
                <p className="mt-1 text-sm text-muted">{notebook.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-sm hover:bg-paper-2 lg:hidden"
            >
              <ListTree className="h-4 w-4" />
              Index
            </button>
            <button
              type="button"
              onClick={createPage}
              disabled={creatingPage}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
            >
              <FilePlus2 className="h-4 w-4" />
              {creatingPage ? 'Adding…' : 'New page'}
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {!page ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 font-display text-2xl text-ink">This notebook is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Add your first page to start building the index with topics and page numbers.
          </p>
          <button
            type="button"
            onClick={createPage}
            disabled={creatingPage}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
          >
            <FilePlus2 className="h-4 w-4" />
            Create first page
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside
            className={`glass-panel rounded-3xl p-4 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            <IndexSidebar
              groups={indexGroups}
              notebookId={notebookId}
              activePageId={page._id}
              expandedTopics={expandedTopics}
              onToggleTopic={toggleTopic}
              indexSearch={indexSearch}
              onSearchChange={setIndexSearch}
              totalPages={sortedPages.length}
            />
          </aside>

          <section className="glass-panel rounded-3xl p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-[100px_1fr]">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Hash className="h-3.5 w-3.5" />
                    Page no.
                  </span>
                  <input
                    value={pageNumber}
                    onChange={(event) => onPageNumberChange(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-mono outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                    Topic
                  </span>
                  <input
                    value={topic}
                    onChange={(event) => onTopicChange(event.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2 font-display text-lg outline-none focus:border-accent"
                  />
                </label>

                <div className="sm:col-span-2">
                  {isSubtopicPage ? (
                    <div>
                      {parentTopicPage ? (
                        <Link
                          to={`/notebook/${notebookId}/page/${parentTopicPage._id}`}
                          className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Back to {parentTopicPage.topic || 'topic'}
                        </Link>
                      ) : null}
                      <label className="block">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                            Subtopic
                          </span>
                          <button
                            type="button"
                            onClick={addSubtopic}
                            disabled={addingSubtopic}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper-2 disabled:opacity-60"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {addingSubtopic ? 'Adding…' : 'Add'}
                          </button>
                        </div>
                        <input
                          value={subtopics[0] || ''}
                          onChange={(event) => onSubtopicChange(event.target.value)}
                          placeholder="Subtopic name…"
                          className="w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                          Subtopics
                        </span>
                        <button
                          type="button"
                          onClick={addSubtopic}
                          disabled={addingSubtopic}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper-2 disabled:opacity-60"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {addingSubtopic ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                      {childSubtopicPages.length ? (
                        <ul className="space-y-1.5">
                          {childSubtopicPages.map((child) => {
                            const label = normalizeSubtopics(child)[0] || 'Untitled';
                            const active = child._id === page._id;
                            return (
                              <li key={child._id}>
                                <Link
                                  to={`/notebook/${notebookId}/page/${child._id}`}
                                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                                    active
                                      ? 'border-accent bg-accent/5 text-ink'
                                      : 'border-line bg-paper text-ink-soft hover:border-accent/40 hover:text-ink'
                                  }`}
                                >
                                  <span className="truncate">{label}</span>
                                  <span className="ml-2 shrink-0 font-mono text-[11px] text-muted">
                                    p.{child.pageNumber}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="rounded-xl border border-dashed border-line bg-paper/60 px-3 py-3 text-sm text-muted">
                          Each subtopic gets its own page so you can write separate notes.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:pt-6">
                <span className="text-xs text-muted">
                  {saveState === 'saving' && 'Saving…'}
                  {saveState === 'saved' && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Save className="h-3.5 w-3.5" />
                      Saved {formatSavedAt(page.updatedAt)}
                    </span>
                  )}
                  {saveState === 'error' && 'Save failed'}
                  {saveState === 'idle' && 'Auto-save on'}
                </span>
                <button
                  type="button"
                  onClick={deleteCurrentPage}
                  className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title="Delete page"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <NotebookEditor
              value={content}
              onChange={onContentChange}
              placeholder="Write notes, bullets, highlights, and turn selected text into code blocks…"
            />
          </section>
        </div>
      )}
    </div>
  );
}
