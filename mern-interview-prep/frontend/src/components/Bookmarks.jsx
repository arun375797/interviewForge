import { useEffect, useState } from 'react';
import { api, SUBJECT_META } from '../api';
import QuestionList from './QuestionList';
import QuestionDetail from './QuestionDetail';

const LANGUAGE_OPTIONS = [
  { key: '', label: 'All languages' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'react', label: 'React' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'dsa', label: 'DSA' },
];

export default function Bookmarks() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('bookmarked');
  const [subject, setSubject] = useState('');
  const [counts, setCounts] = useState({});

  const load = () => {
    setLoading(true);
    api
      .getQuestions({
        subject: subject || undefined,
        bookmarked: mode === 'bookmarked' ? 'true' : undefined,
        mastered: mode === 'mastered' ? 'true' : undefined,
        limit: 200,
      })
      .then((data) => setQuestions(data.items))
      .finally(() => setLoading(false));
  };

  const loadCounts = () => {
    Promise.all(
      LANGUAGE_OPTIONS.map(async (lang) => {
        const [bookmarked, mastered] = await Promise.all([
          api.getQuestions({
            subject: lang.key || undefined,
            bookmarked: 'true',
            limit: 1,
          }),
          api.getQuestions({
            subject: lang.key || undefined,
            mastered: 'true',
            limit: 1,
          }),
        ]);
        return [lang.key || 'all', { bookmarked: bookmarked.total, mastered: mastered.total }];
      })
    )
      .then((entries) => setCounts(Object.fromEntries(entries)))
      .catch(console.error);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, subject]);

  useEffect(() => {
    loadCounts();
  }, []);

  const activeLabel = LANGUAGE_OPTIONS.find((lang) => lang.key === subject)?.label || 'All languages';
  const activeCounts = counts[subject || 'all'] || {};

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Saved progress</h1>
          <p className="mt-2 text-sm text-muted">
            Bookmarks and mastered questions separated by language.
          </p>
        </div>

        <label className="block w-full sm:w-56">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            Language
          </span>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSelected(null);
            }}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium outline-none focus:border-accent"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.key || 'all'} value={lang.key}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.18em]"
              style={{ color: subject ? SUBJECT_META[subject]?.accent : '#0f766e' }}
            >
              {activeLabel}
            </p>
            <p className="mt-1 text-sm text-muted">
              {activeCounts.bookmarked ?? '—'} bookmarked · {activeCounts.mastered ?? '—'} mastered
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            {['bookmarked', 'mastered'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setSelected(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
                  mode === m ? 'bg-ink text-paper' : 'border border-line bg-paper'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <QuestionList
        questions={questions}
        loading={loading}
        onSelect={async (id) => {
          const q = await api.getQuestion(id);
          setSelected(q);
        }}
      />

      {selected && (
        <QuestionDetail
          question={selected}
          onClose={() => setSelected(null)}
          onUpdated={(u) => {
            setSelected(u);
            load();
            loadCounts();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
            loadCounts();
          }}
        />
      )}
    </div>
  );
}
