import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, X } from 'lucide-react';
import { api } from '../api';
import { NOTEBOOK_COLORS } from '../utils/notebookConstants';
import { appendIdeSnippet, buildIdeSnippetHtml } from '../utils/notebookContent';
import { buildIndexGroups, normalizeSubtopics } from '../utils/notebookIndex';

function topicKey(topic = '') {
  return topic.trim().toLowerCase();
}

export default function SaveToNotebookModal({
  open,
  onClose,
  code,
  modeLabel,
  language = 'javascript',
}) {
  const [notebooks, setNotebooks] = useState([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(false);
  const [notebookDetail, setNotebookDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [createNotebook, setCreateNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState(NOTEBOOK_COLORS[0].value);

  const [selectedNotebookId, setSelectedNotebookId] = useState('');
  const [saveTarget, setSaveTarget] = useState('existing');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

  const [newTopic, setNewTopic] = useState('');
  const [newSubtopic, setNewSubtopic] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedResult, setSavedResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCreateNotebook(false);
    setNewNotebookTitle('');
    setNewNotebookColor(NOTEBOOK_COLORS[0].value);
    setSaveTarget('existing');
    setSelectedPageId('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setNewTopic(modeLabel || 'IDE Practice');
    setNewSubtopic('');
    setError('');
    setSavedResult(null);

    setLoadingNotebooks(true);
    api
      .getNotebooks()
      .then((data) => {
        setNotebooks(data);
        setSelectedNotebookId(data[0]?._id || '');
        if (!data.length) setCreateNotebook(true);
      })
      .catch((err) => setError(err.message || 'Could not load notebooks'))
      .finally(() => setLoadingNotebooks(false));
  }, [open, modeLabel]);

  useEffect(() => {
    if (!open || !selectedNotebookId || createNotebook) {
      setNotebookDetail(null);
      return;
    }

    let alive = true;
    setLoadingDetail(true);
    api
      .getNotebook(selectedNotebookId)
      .then((data) => {
        if (!alive) return;
        setNotebookDetail(data);
        const pages = [...(data.pages || [])].sort((a, b) => a.pageNumber - b.pageNumber);
        const groups = buildIndexGroups(pages);
        const firstGroup = groups[0];
        const firstEntry = firstGroup?.entries[0];
        setSelectedTopic(firstGroup?.topic || '');
        setSelectedSubtopic(firstEntry?.type === 'subtopic' ? firstEntry.label : '');
        setSelectedPageId(firstEntry?.pageId || pages[0]?._id || '');
        setSaveTarget(pages.length ? 'existing' : 'new');
        if (!pages.length) {
          setNewTopic(modeLabel || 'IDE Practice');
        }
      })
      .catch((err) => alive && setError(err.message || 'Could not load notebook'))
      .finally(() => alive && setLoadingDetail(false));

    return () => {
      alive = false;
    };
  }, [open, selectedNotebookId, createNotebook, modeLabel]);

  const pages = useMemo(
    () => [...(notebookDetail?.pages || [])].sort((a, b) => a.pageNumber - b.pageNumber),
    [notebookDetail]
  );

  const indexGroups = useMemo(() => buildIndexGroups(pages), [pages]);

  const topics = useMemo(() => indexGroups.map((group) => group.topic), [indexGroups]);

  const selectedGroup = useMemo(
    () => indexGroups.find((group) => topicKey(group.topic) === topicKey(selectedTopic)),
    [indexGroups, selectedTopic]
  );

  const subtopicEntries = useMemo(
    () => selectedGroup?.entries.filter((entry) => entry.type === 'subtopic') || [],
    [selectedGroup]
  );

  const pageOnlyEntries = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.pages.filter((page) => !normalizeSubtopics(page).length);
  }, [selectedGroup]);

  const resolvedPage = useMemo(
    () => pages.find((page) => page._id === selectedPageId) || null,
    [pages, selectedPageId]
  );

  const existingSubtopics = useMemo(() => {
    const seen = new Set();
    return pages
      .flatMap((page) => normalizeSubtopics(page))
      .filter((sub) => {
        const key = sub.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [pages]);

  const nextPageNumber = useMemo(() => {
    if (!pages.length) return 1;
    return Math.max(...pages.map((page) => page.pageNumber)) + 1;
  }, [pages]);

  useEffect(() => {
    if (saveTarget !== 'existing' || !selectedGroup) return;

    if (subtopicEntries.length) {
      const match =
        subtopicEntries.find((entry) => entry.label === selectedSubtopic) || subtopicEntries[0];
      if (match && match.pageId !== selectedPageId) {
        setSelectedPageId(match.pageId);
      }
      if (match && match.label !== selectedSubtopic) {
        setSelectedSubtopic(match.label);
      }
      return;
    }

    if (pageOnlyEntries.length === 1) {
      if (pageOnlyEntries[0]._id !== selectedPageId) {
        setSelectedPageId(pageOnlyEntries[0]._id);
      }
      if (selectedSubtopic) setSelectedSubtopic('');
      return;
    }

    if (pageOnlyEntries.length > 1) {
      if (!pageOnlyEntries.some((page) => page._id === selectedPageId)) {
        setSelectedPageId(pageOnlyEntries[0]._id);
      }
      if (selectedSubtopic) setSelectedSubtopic('');
    }
  }, [
    saveTarget,
    selectedGroup,
    subtopicEntries,
    pageOnlyEntries,
    selectedSubtopic,
    selectedPageId,
  ]);

  const onTopicChange = (topic) => {
    setSelectedTopic(topic);
    const group = indexGroups.find((item) => topicKey(item.topic) === topicKey(topic));
    const firstEntry = group?.entries[0];
    if (firstEntry?.type === 'subtopic') {
      setSelectedSubtopic(firstEntry.label);
      setSelectedPageId(firstEntry.pageId);
      return;
    }
    setSelectedSubtopic('');
    setSelectedPageId(group?.pages[0]?._id || '');
  };

  const onSubtopicChange = (subtopic) => {
    setSelectedSubtopic(subtopic);
    const entry = subtopicEntries.find((item) => item.label === subtopic);
    if (entry) setSelectedPageId(entry.pageId);
  };

  if (!open) return null;

  const resolveNotebookId = async () => {
    if (createNotebook) {
      const title = newNotebookTitle.trim();
      if (!title) throw new Error('Give your new notebook a title');
      const notebook = await api.createNotebook({
        title,
        color: newNotebookColor,
        description: 'Saved from IDE',
      });
      return notebook._id;
    }
    if (!selectedNotebookId) throw new Error('Select a notebook');
    return selectedNotebookId;
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmedCode = (code || '').trim();
    if (!trimmedCode) {
      setError('Write some code in the editor before saving');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const notebookId = await resolveNotebookId();
      const snippet = buildIdeSnippetHtml({ code: trimmedCode, modeLabel, language });

      if (createNotebook || saveTarget === 'new') {
        const topic = newTopic.trim();
        if (!topic) throw new Error('Topic is required for a new page');
        const subtopics = newSubtopic.trim() ? [newSubtopic.trim()] : [];
        const pageNumber = createNotebook ? 1 : nextPageNumber;
        const created = await api.createNotebookPage(notebookId, {
          pageNumber,
          topic,
          subtopics,
          content: snippet,
        });
        setSavedResult({ notebookId, pageId: created._id, action: 'created' });
      } else {
        if (!selectedPageId) throw new Error('Select a page to save into');
        const page = await api.getNotebookPage(notebookId, selectedPageId);
        const content = appendIdeSnippet(page.content, snippet);
        await api.updateNotebookPage(notebookId, selectedPageId, { content });
        setSavedResult({ notebookId, pageId: selectedPageId, action: 'appended' });
      }
    } catch (err) {
      setError(err.message || 'Could not save to notebook');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="glass-panel max-h-[90vh] w-full max-w-lg animate-rise overflow-y-auto rounded-3xl p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">Save to notebook</h2>
            <p className="mt-1 text-sm text-muted">
              Add this {modeLabel} code to an existing page or create a new one.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-paper-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {savedResult ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              {savedResult.action === 'created'
                ? 'New notebook page created with your IDE code.'
                : 'IDE code appended to the selected page.'}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-paper-2"
              >
                Close
              </button>
              <Link
                to={`/notebook/${savedResult.notebookId}/page/${savedResult.pageId}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
              >
                <BookMarked className="h-4 w-4" />
                Open in notebook
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-xl border border-line bg-paper-2/60 px-3 py-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createNotebook}
                  onChange={(event) => setCreateNotebook(event.target.checked)}
                  className="rounded border-line"
                />
                Create new notebook
              </label>
            </div>

            {createNotebook ? (
              <div className="space-y-3 rounded-2xl border border-line bg-paper/50 p-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                    Notebook title
                  </span>
                  <input
                    value={newNotebookTitle}
                    onChange={(event) => setNewNotebookTitle(event.target.value)}
                    placeholder="e.g. IDE Snippets"
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
                    autoFocus
                  />
                </label>
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-accent">
                    Color
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {NOTEBOOK_COLORS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setNewNotebookColor(item.value)}
                        title={item.label}
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          newNotebookColor === item.value
                            ? 'border-ink scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: item.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                  Notebook
                </span>
                <select
                  value={selectedNotebookId}
                  onChange={(event) => setSelectedNotebookId(event.target.value)}
                  disabled={loadingNotebooks}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
                >
                  {notebooks.length === 0 ? (
                    <option value="">No notebooks yet</option>
                  ) : (
                    notebooks.map((notebook) => (
                      <option key={notebook._id} value={notebook._id}>
                        {notebook.title}
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}

            {!createNotebook && selectedNotebookId ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['existing', 'new'].map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setSaveTarget(target)}
                      disabled={target === 'existing' && !pages.length}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        saveTarget === target
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line bg-paper text-ink hover:bg-paper-2 disabled:opacity-40'
                      }`}
                    >
                      {target === 'existing' ? 'Existing page' : 'New page'}
                    </button>
                  ))}
                </div>

                {loadingDetail ? (
                  <div className="skeleton h-10 rounded-xl" />
                ) : saveTarget === 'existing' ? (
                  <div className="space-y-3 rounded-2xl border border-line bg-paper/50 p-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                        Topic
                      </span>
                      <select
                        value={selectedTopic}
                        onChange={(event) => onTopicChange(event.target.value)}
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
                      >
                        {topics.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic}
                          </option>
                        ))}
                      </select>
                    </label>

                    {subtopicEntries.length ? (
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                          Subtopic
                        </span>
                        <select
                          value={selectedSubtopic}
                          onChange={(event) => onSubtopicChange(event.target.value)}
                          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
                        >
                          {subtopicEntries.map((entry) => (
                            <option key={`${entry.pageId}-${entry.label}`} value={entry.label}>
                              {entry.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {pageOnlyEntries.length > 1 ? (
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                          Page
                        </span>
                        <select
                          value={selectedPageId}
                          onChange={(event) => setSelectedPageId(event.target.value)}
                          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
                        >
                          {pageOnlyEntries.map((page) => (
                            <option key={page._id} value={page._id}>
                              Page {page.pageNumber}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : resolvedPage ? (
                      <p className="text-xs text-muted">
                        Saving to page <span className="font-mono text-ink">{resolvedPage.pageNumber}</span>
                        {subtopicEntries.length ? null : (
                          <>
                            {' '}
                            under topic <span className="text-ink">{resolvedPage.topic}</span>
                          </>
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-line bg-paper/50 p-4">
                    <p className="text-xs text-muted">New page will be page {nextPageNumber}.</p>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                        Topic
                      </span>
                      <input
                        value={newTopic}
                        onChange={(event) => setNewTopic(event.target.value)}
                        list="ide-notebook-topics"
                        placeholder="e.g. MongoDB Practice"
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
                      />
                      <datalist id="ide-notebook-topics">
                        {topics.map((topic) => (
                          <option key={topic} value={topic} />
                        ))}
                      </datalist>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                        Subtopic
                      </span>
                      <input
                        value={newSubtopic}
                        onChange={(event) => setNewSubtopic(event.target.value)}
                        list="ide-notebook-subtopics"
                        placeholder="Optional — shows in the index"
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
                      />
                      <datalist id="ide-notebook-subtopics">
                        {existingSubtopics.map((sub) => (
                          <option key={sub} value={sub} />
                        ))}
                      </datalist>
                    </label>
                  </div>
                )}
              </div>
            ) : null}

            {createNotebook ? (
              <div className="space-y-3 rounded-2xl border border-line bg-paper/50 p-4">
                <p className="text-xs text-muted">Your first page will be created automatically.</p>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                    Topic
                  </span>
                  <input
                    value={newTopic}
                    onChange={(event) => setNewTopic(event.target.value)}
                    placeholder="e.g. JavaScript Practice"
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
                    Subtopic
                  </span>
                  <input
                    value={newSubtopic}
                    onChange={(event) => setNewSubtopic(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
                  />
                </label>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-paper-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loadingNotebooks}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
