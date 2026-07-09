import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { api } from './api';

const Home = lazy(() => import('./components/Home'));
const SubjectPage = lazy(() => import('./components/SubjectPage'));
const Practice = lazy(() => import('./components/Practice'));
const Mock = lazy(() => import('./components/Mock'));
const Bookmarks = lazy(() => import('./components/Bookmarks'));
const AddQuestion = lazy(() => import('./components/AddQuestion'));
const AdminAnswers = lazy(() => import('./components/AdminAnswers'));
const Learn = lazy(() => import('./components/Learn'));
const LearnSubject = lazy(() => import('./components/LearnSubject'));
const Code = lazy(() => import('./components/Code'));
const CodeSubject = lazy(() => import('./components/CodeSubject'));
const CodeWorkspace = lazy(() => import('./components/CodeWorkspace'));
const PlanStudy = lazy(() => import('./components/PlanStudy'));
const NotFound = lazy(() => import('./components/NotFound'));
const Login = lazy(() => import('./components/Login'));

function PageFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-24 rounded-3xl" />
      <div className="skeleton h-48 rounded-3xl" />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, booting } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booting || !isAuthenticated) {
      setLoading(false);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    Promise.all([api.getSubjects(), api.getStats()])
      .then(([subs, st]) => {
        if (!alive) return;
        setSubjects(subs);
        setStats(st);
        setError('');
      })
      .catch((err) => {
        if (!alive) return;
        console.error(err);
        setError(err.message || 'Could not reach the API');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [booting, isAuthenticated]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageFallback />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              )}
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route
                    path="/"
                    element={<Home subjects={subjects} stats={stats} loading={loading} />}
                  />
                  <Route path="/subject/:subject" element={<SubjectPage />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/learn/:subject" element={<LearnSubject />} />
                  <Route path="/code" element={<Code />} />
                  <Route path="/code/:subject" element={<CodeSubject />} />
                  <Route path="/code/:subject/:id" element={<CodeWorkspace />} />
                  <Route path="/plan" element={<PlanStudy />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/mock" element={<Mock />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/add" element={<AddQuestion />} />
                  <Route path="/admin" element={<AdminAnswers />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
