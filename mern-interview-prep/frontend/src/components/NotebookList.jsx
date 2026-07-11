import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { useConfirm } from '../context/ConfirmDialogContext';
import { NOTEBOOK_COLORS } from '../utils/notebookConstants';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function CreateNotebookModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(NOTEBOOK_COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setColor(NOTEBOOK_COLORS[0].value);
    setError('');
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give your notebook a title');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const notebook = await api.createNotebook({
        title: trimmed,
        description: description.trim(),
        color,
      });
      onCreated(notebook);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create notebook');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md animate-rise rounded-3xl p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">New notebook</h2>
            <p className="mt-1 text-sm text-muted">Organize topics, pages, and code snippets.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-paper-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. React Interview Notes"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-accent">
              Description
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional short description"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-accent"
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
                  onClick={() => setColor(item.value)}
                  title={item.label}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === item.value ? 'border-ink scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: item.value }}
                />
              ))}
            </div>
          </div>

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
              disabled={saving}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create notebook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotebookList() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = () => {
    setLoading(true);
    api
      .getNotebooks()
      .then((data) => {
        setNotebooks(data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Could not load notebooks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const removeNotebook = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete notebook',
      message: 'Delete this notebook and all its pages? This cannot be undone.',
      confirmLabel: 'Delete notebook',
    });
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await api.deleteNotebook(id);
      setNotebooks((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete notebook');
    } finally {
      setDeletingId('');
    }
  };

  const openNotebook = async (notebook) => {
    try {
      const detail = await api.getNotebook(notebook._id);
      const firstPage = detail.pages?.[0];
      if (firstPage) {
        navigate(`/notebook/${notebook._id}/page/${firstPage._id}`);
      } else {
        navigate(`/notebook/${notebook._id}`);
      }
    } catch (err) {
      setError(err.message || 'Could not open notebook');
    }
  };

  return (
    <div className="space-y-8 animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Notebook</p>
          <h1 className="font-display text-3xl text-balance text-ink sm:text-4xl">
            Your study notebooks
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            Create notebooks with indexed pages, rich notes, and syntax-highlighted code blocks —
            like a real notebook, but smarter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          <Plus className="h-4 w-4" />
          New notebook
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-44 rounded-3xl" />
          ))}
        </div>
      ) : notebooks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <BookMarked className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl text-ink">No notebooks yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Start your first notebook to capture interview topics, page numbers, and code snippets.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
          >
            <Plus className="h-4 w-4" />
            Create notebook
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook) => (
            <button
              key={notebook._id}
              type="button"
              onClick={() => openNotebook(notebook)}
              className="group glass-panel relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: notebook.color || NOTEBOOK_COLORS[0].value }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl text-ink">{notebook.title}</h2>
                  {notebook.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{notebook.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted/80">Personal study notebook</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => removeNotebook(event, notebook._id)}
                  disabled={deletingId === notebook._id}
                  className="rounded-lg p-2 text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-700 group-hover:opacity-100"
                  title="Delete notebook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-muted">
                <span>{notebook.pageCount || 0} pages</span>
                <span>Updated {formatDate(notebook.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CreateNotebookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(notebook) => navigate(`/notebook/${notebook._id}`)}
      />
    </div>
  );
}
