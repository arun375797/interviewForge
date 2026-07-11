import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './components/Home';
import Login from './components/Login';
import { api } from './api';
import RouteSeo from './seo';

// Heavy / secondary routes stay lazy; Home + Login are eager for first paint.
const SubjectPage = lazy(() => import('./components/SubjectPage'));
const Practice = lazy(() => import('./components/Practice'));
const Mock = lazy(() => import('./components/Mock'));
const Bookmarks = lazy(() => import('./components/Bookmarks'));
const AddQuestion = lazy(() => import('./components/AddQuestion'));
const AdminAnswers = lazy(() => import('./components/AdminAnswers'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Learn = lazy(() => import('./components/Learn'));
const LearnSubject = lazy(() => import('./components/LearnSubject'));
const Code = lazy(() => import('./components/Code'));
const CodeSubject = lazy(() => import('./components/CodeSubject'));
const CodeWorkspace = lazy(() => import('./components/CodeWorkspace'));
const PlanStudy = lazy(() => import('./components/PlanStudy'));
const NotebookList = lazy(() => import('./components/NotebookList'));
const NotebookView = lazy(() => import('./components/NotebookView'));
const Ide = lazy(() => import('./components/Ide'));
const Typing = lazy(() => import('./components/Typing'));
const Review = lazy(() => import('./components/Review'));
const Flashcards = lazy(() => import('./components/Flashcards'));
const WeakSpots = lazy(() => import('./components/WeakSpots'));
const Feynman = lazy(() => import('./components/Feynman'));
const NotFound = lazy(() => import('./components/NotFound'));

function PageFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-24 rounded-3xl" />
      <div className="skeleton h-48 rounded-3xl" />
    </div>
  );
}

function statsFromSubjects(subjects) {
  return subjects.reduce(
    (acc, s) => {
      acc.total += s.questionCount || 0;
      acc.bookmarked += s.bookmarked || 0;
      acc.mastered += s.mastered || 0;
      return acc;
    },
    { total: 0, bookmarked: 0, mastered: 0 }
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
    // One request instead of subjects + stats — halves cold-start API wait.
    api
      .getSubjects()
      .then((subs) => {
        if (!alive) return;
        setSubjects(subs);
        setStats(statsFromSubjects(subs));
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
    <>
      <RouteSeo />
      <Routes>
        <Route path="/login" element={<Login />} />
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
                    <Route path="/ide" element={<Ide />} />
                    <Route path="/typing" element={<Typing />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/weak-spots" element={<WeakSpots />} />
                    <Route path="/feynman" element={<Feynman />} />
                    <Route path="/plan" element={<PlanStudy />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/mock" element={<Mock />} />
                    <Route path="/bookmarks" element={<Bookmarks />} />
                    <Route path="/notebook" element={<NotebookList />} />
                    <Route path="/notebook/:notebookId" element={<NotebookView />} />
                    <Route path="/notebook/:notebookId/page/:pageId" element={<NotebookView />} />
                    <Route
                      path="/add"
                      element={
                        <AdminRoute>
                          <AddQuestion />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <UserManagement />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminAnswers />
                        </AdminRoute>
                      }
                    />
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function AppProviders({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  if (!googleClientId) return children;
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ConfirmDialogProvider>
          <AppProviders>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </AppProviders>
        </ConfirmDialogProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
