import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import SubjectPage from './components/SubjectPage';
import Practice from './components/Practice';
import Bookmarks from './components/Bookmarks';
import AddQuestion from './components/AddQuestion';
import Learn from './components/Learn';
import LearnSubject from './components/LearnSubject';
import NotFound from './components/NotFound';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { api } from './api';

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
              <Routes>
                <Route
                  path="/"
                  element={<Home subjects={subjects} stats={stats} loading={loading} />}
                />
                <Route path="/subject/:subject" element={<SubjectPage />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/:subject" element={<LearnSubject />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/add" element={<AddQuestion />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
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
