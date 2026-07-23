import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Circle, Code2, GraduationCap, Power, Rocket } from 'lucide-react';
import { api, SUBJECT_META } from '../api';
import QuestionDetail from './QuestionDetail';

const PLAN_DAYS = [3, 5, 10, 15];
const STUDY_LANGUAGES = ['javascript', 'mongodb', 'react', 'nodejs', 'dsa'];
const CODE_LANGUAGES = ['javascript', 'dsa', 'nodejs', 'react'];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PlanStudy() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('study');
  const [subject, setSubject] = useState('javascript');
  const [days, setDays] = useState(5);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const languageOptions = mode === 'code' ? CODE_LANGUAGES : STUDY_LANGUAGES;
  const activePlan = plans.find((plan) => plan.mode === mode && plan.subject === subject);
  const meta = SUBJECT_META[subject] || { label: subject, accent: '#0f766e' };

  const todayKey = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toDateString();
  }, []);

  const loadPlans = () => {
    setLoading(true);
    api
      .getActivePlans()
      .then((data) => setPlans(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (!languageOptions.includes(subject)) {
      setSubject(languageOptions[0]);
    }
  }, [languageOptions, subject]);

  const startPlan = async () => {
    setStarting(true);
    setError('');
    try {
      const plan = await api.startPlan({ mode, subject, days });
      setPlans((prev) => [
        plan,
        ...prev.filter((item) => !(item.mode === mode && item.subject === subject)),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const disablePlan = async (id) => {
    try {
      await api.disablePlan(id);
      setPlans((prev) => prev.filter((plan) => plan._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const recomputePlan = (plan) => {
    const planDays = plan.planDays.map((day) => {
      const completed = day.questions.filter((q) => q.done).length;
      return {
        ...day,
        completed,
        remaining: Math.max(0, day.questions.length - completed),
        percent: day.questions.length ? Math.round((completed / day.questions.length) * 100) : 0,
      };
    });
    const completed = planDays.reduce((sum, day) => sum + day.completed, 0);
    const totalQuestions = planDays.reduce((sum, day) => sum + day.questions.length, 0);
    return {
      ...plan,
      planDays,
      completed,
      totalQuestions,
      remaining: Math.max(0, totalQuestions - completed),
      percent: totalQuestions ? Math.round((completed / totalQuestions) * 100) : 0,
    };
  };

  const toggleQuestionDone = async (questionId) => {
    try {
      const updated =
        mode === 'code' ? await api.toggleCodeCompleted(questionId) : await api.toggleLearned(questionId);
      setPlans((prev) =>
        prev.map((plan) => {
          if (plan._id !== activePlan?._id) return plan;
          const nextPlan = {
            ...plan,
            planDays: plan.planDays.map((day) => ({
              ...day,
              questions: day.questions.map((question) =>
                question._id === questionId
                  ? {
                      ...question,
                      done: mode === 'code' ? updated.codeCompleted : updated.learned,
                    }
                  : question
              ),
            })),
          };
          return recomputePlan(nextPlan);
        })
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const openQuestion = async (question) => {
    if (mode === 'code') {
      navigate(`/code/${question.subject}/${question._id}`);
      return;
    }
    try {
      const fullQuestion = await api.getQuestion(question._id);
      setSelectedQuestion(fullQuestion);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshActivePlans = () => {
    api
      .getActivePlans()
      .then((data) => setPlans(data))
      .catch((err) => setError(err.message));
  };

  return (
    <div className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Plan & Study
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Plan and study
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Choose Study or Code, pick a language and day plan, then split all questions across
            the selected days starting today.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_280px_auto] lg:items-end">
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Plan type
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'study', label: 'Study', icon: GraduationCap },
                { id: 'code', label: 'Code', icon: Code2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                    mode === id ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Language
            </span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm font-medium outline-none focus:border-accent"
            >
              {languageOptions.map((key) => (
                <option key={key} value={key}>
                  {SUBJECT_META[key]?.label || key}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Days
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLAN_DAYS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDays(option)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    days === option ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startPlan}
            disabled={starting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 lg:w-auto"
          >
            <Rocket className="h-4 w-4" />
            {starting ? 'Starting...' : activePlan ? 'Restart plan' : 'Start'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-3xl" />
      ) : activePlan ? (
        <section className="space-y-5">
          <div className="glass-panel rounded-2xl p-4 sm:rounded-3xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em]"
                  style={{ color: meta.accent }}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Active {mode} plan
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                  {meta.label} · {activePlan.days} day plan
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {formatDate(activePlan.startDate)} to {formatDate(activePlan.endDate)} ·{' '}
                  {activePlan.completed}/{activePlan.totalQuestions} completed ({activePlan.percent}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => disablePlan(activePlan._id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 sm:w-auto"
              >
                <Power className="h-4 w-4" />
                Disable active plan
              </button>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${activePlan.percent}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {activePlan.planDays.map((day) => {
              const dateKey = new Date(day.date).toDateString();
              const isToday = dateKey === todayKey;
              return (
                <details
                  key={day.dayNumber}
                  open={isToday || day.dayNumber === 1}
                  className="glass-panel rounded-2xl p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-semibold">
                          Day {day.dayNumber}{' '}
                          {isToday ? <span className="text-sm text-accent">(Today)</span> : null}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatDate(day.date)} · {day.completed}/{day.total} done ·{' '}
                          {day.remaining} remaining
                        </p>
                      </div>
                      <span className="rounded-full bg-paper-2 px-3 py-1 text-sm font-medium">
                        {day.percent}%
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${day.percent}%` }}
                      />
                    </div>
                  </summary>

                  <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                    {day.questions.map((question, index) => (
                      <div
                        key={question._id}
                        className="rounded-xl border border-line bg-paper px-3 py-3 transition hover:bg-paper-2"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleQuestionDone(question._id)}
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                              question.done
                                ? 'border-accent bg-accent text-white'
                                : 'border-line bg-paper text-muted hover:border-accent hover:text-accent'
                            }`}
                            title={question.done ? 'Mark not covered' : 'Mark covered'}
                          >
                            {question.done ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <span className="mt-1 font-mono text-xs text-muted">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => openQuestion(question)}
                              className="block w-full text-left"
                            >
                              <p
                                className={`overflow-anywhere text-sm font-medium leading-snug ${
                                  question.done ? 'text-muted line-through' : 'text-ink'
                                }`}
                              >
                                {question.question}
                              </p>
                              <p className="overflow-anywhere mt-1 text-xs text-muted">{question.topic}</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <p className="font-display text-2xl font-semibold">No active plan</p>
          <p className="mt-2 text-sm text-muted">
            Select Study or Code, choose a language and plan length, then click Start.
          </p>
        </div>
      )}

      {selectedQuestion && mode === 'study' ? (
        <QuestionDetail
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdated={(updated) => {
            setSelectedQuestion(updated);
            refreshActivePlans();
          }}
          onDeleted={() => {
            setSelectedQuestion(null);
            refreshActivePlans();
          }}
        />
      ) : null}
    </div>
  );
}
