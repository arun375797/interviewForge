import { useEffect, useState } from 'react';
import { api } from '../api';
import QuestionList from './QuestionList';
import QuestionDetail from './QuestionDetail';

export default function Bookmarks() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('bookmarked');

  const load = () => {
    setLoading(true);
    api
      .getQuestions({
        bookmarked: mode === 'bookmarked' ? 'true' : undefined,
        mastered: mode === 'mastered' ? 'true' : undefined,
        limit: 100,
      })
      .then((data) => setQuestions(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="animate-rise space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Saved progress</h1>
        <p className="mt-2 text-sm text-muted">Bookmarks and mastered questions across all subjects.</p>
      </div>

      <div className="flex gap-2">
        {['bookmarked', 'mastered'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              mode === m ? 'bg-ink text-paper' : 'border border-line bg-paper'
            }`}
          >
            {m}
          </button>
        ))}
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
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
