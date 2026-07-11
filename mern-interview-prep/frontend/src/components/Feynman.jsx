import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  List,
  Mic,
  Play,
  RefreshCw,
  Shuffle,
  Square,
  Trash2,
} from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import AnswerContent from './AnswerContent';
import { RECALL_RATINGS } from '../utils/learningConstants';
import RatingButtons from './RatingButtons';

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Feynman() {
  const [mode, setMode] = useState('random');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState(null);
  const [listDeck, setListDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [listCount, setListCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordError, setRecordError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  const clearRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsRecording(false);
    setIsPlaying(false);
    setRecordError('');
  }, []);

  const resetSession = useCallback(() => {
    setUserAnswer('');
    setReveal(false);
    clearRecording();
  }, [clearRecording]);

  const loadRandom = async () => {
    setLoading(true);
    setError('');
    resetSession();
    try {
      const q = await api.getRandom({ subject: subject || undefined });
      setQuestion(q);
      setListDeck([]);
      setDeckIndex(0);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExplainList = async () => {
    setLoading(true);
    setError('');
    resetSession();
    try {
      const data = await api.getExplainList({ subject: subject || undefined });
      const items = data.questions || [];
      setListCount(data.counts?.all ?? items.length);
      if (!items.length) {
        setQuestion(null);
        setListDeck([]);
        setDeckIndex(0);
        return;
      }
      const deck = shuffle(items);
      setListDeck(deck);
      setDeckIndex(0);
      setQuestion(deck[0]);
    } catch (err) {
      setError(err.message);
      setQuestion(null);
      setListDeck([]);
    } finally {
      setLoading(false);
    }
  };

  const load = () => (mode === 'list' ? loadExplainList() : loadRandom());

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, mode]);

  useEffect(() => () => clearRecording(), [clearRecording]);

  const nextInList = () => {
    resetSession();
    if (!listDeck.length) {
      loadExplainList();
      return;
    }
    const next = (deckIndex + 1) % listDeck.length;
    setDeckIndex(next);
    setQuestion(listDeck[next]);
  };

  const afterQuestion = () => {
    if (mode === 'list') {
      nextInList();
      return;
    }
    loadRandom();
  };

  const clearList = async () => {
    const label = subject
      ? SUBJECT_META[subject]?.label || subject
      : 'all languages';
    if (!window.confirm(`Remove all questions from your explain list for ${label}?`)) return;
    try {
      await api.clearExplainList({ subject: subject || undefined });
      loadExplainList();
    } catch (err) {
      setError(err.message);
    }
  };

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordError('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecording = () => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.play().catch(() => {
      setRecordError('Could not play recording.');
    });
  };

  const rate = async (rating) => {
    if (question) {
      try {
        await api.submitReview(question._id, rating);
      } catch {
        /* non-blocking */
      }
    }
    afterQuestion();
  };

  const activeLabel = subject
    ? SUBJECT_META[subject]?.label || subject
    : 'All subjects';

  return (
    <div className="mx-auto max-w-3xl animate-rise space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Explain mode
          </h1>
          <p className="mt-2 text-sm text-muted">
            Explain the concept out loud or in writing, then reveal the model answer and compare.
            Add questions with <strong className="text-ink">Add to explain</strong> on any answer,
            then practice them here under <strong className="text-ink">My list</strong>.
          </p>
        </div>
        {mode === 'list' && listCount > 0 && (
          <button
            type="button"
            onClick={clearList}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear list
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'random', label: 'Random', icon: Shuffle },
          { key: 'list', label: 'My list', icon: List },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
              mode === key ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">All subjects</option>
          {Object.entries(SUBJECT_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
        >
          <Shuffle className="h-4 w-4" />
          {loading ? 'Loading…' : mode === 'list' ? 'Shuffle list' : 'New question'}
        </button>
      </div>

      {mode === 'list' && listDeck.length > 0 && (
        <p className="text-xs text-muted">
          My explain list: question {deckIndex + 1} of {listDeck.length} ({activeLabel})
        </p>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {loading && !question ? (
        <div className="skeleton h-64 rounded-3xl" />
      ) : mode === 'list' && !question ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Mic className="mx-auto h-10 w-10 text-muted" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Your explain list is empty</h2>
          <p className="mt-2 text-sm text-muted">
            Open any question answer and click <strong>Add to explain</strong> to build your list
            for {activeLabel.toLowerCase()}.
          </p>
          <Link
            to="/learn"
            className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper"
          >
            Browse questions
          </Link>
        </div>
      ) : question ? (
        <div className="glass-panel space-y-6 rounded-2xl p-5 sm:rounded-3xl sm:p-8">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.18em]"
              style={{ color: SUBJECT_META[question.subject]?.accent }}
            >
              {SUBJECT_META[question.subject]?.label} · {question.topic}
            </p>
            <h2 className="overflow-anywhere mt-3 font-display text-2xl font-semibold leading-snug">
              {question.question}
            </h2>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Mic className="h-4 w-4 text-accent" />
              Practice out loud (optional)
            </label>
            <div className="rounded-xl border border-line bg-paper/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
                  >
                    <Mic className="h-4 w-4" />
                    Record
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    Stop
                  </button>
                )}
                {audioUrl && !isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={playRecording}
                      disabled={isPlaying}
                      className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      {isPlaying ? 'Playing…' : 'Play'}
                    </button>
                    <button
                      type="button"
                      onClick={clearRecording}
                      className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted hover:text-ink"
                    >
                      <Trash2 className="h-4 w-4" />
                      Discard
                    </button>
                  </>
                )}
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-rose-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rose-600" />
                    Recording…
                  </span>
                )}
              </div>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="mt-3 w-full"
                  controls
                />
              )}
              <p className="mt-2 text-xs text-muted">
                Record and listen back in your browser only — nothing is saved to the server.
              </p>
              {recordError && <p className="mt-2 text-xs text-rose-700">{recordError}</p>}
            </div>
          </div>

          {!reveal && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Your explanation (optional notes)
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                placeholder="Explain as if the interviewer is sitting across from you…"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {reveal ? 'Hide answer' : 'Reveal answer'}
            </button>
            {!reveal && (
              <button
                type="button"
                onClick={afterQuestion}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Skip
              </button>
            )}
          </div>

          {reveal && (
            <div className="animate-fade space-y-4">
              {userAnswer.trim() && (
                <div className="rounded-2xl border border-line bg-paper/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Your attempt
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{userAnswer}</p>
                </div>
              )}

              <div className="rounded-2xl border border-line bg-paper/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Answer
                </p>
                <div className="mt-3">
                  <AnswerContent>{question.answer}</AnswerContent>
                </div>
              </div>

              {question.keyPoints?.length > 0 && (
                <ul className="space-y-1 text-sm text-muted">
                  {question.keyPoints.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-accent">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <p className="mb-3 text-sm font-medium">How did you do?</p>
                <RatingButtons ratings={RECALL_RATINGS} onRate={rate} />
              </div>

              <button
                type="button"
                onClick={afterQuestion}
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
              >
                <RefreshCw className="h-4 w-4" />
                {mode === 'list' ? 'Next in list' : 'Next question'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
