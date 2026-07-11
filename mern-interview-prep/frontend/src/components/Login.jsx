import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login, isAuthenticated, booting } = useAuth();
  const { theme, themes, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!booting && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-body px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-80 login-glow" />

      <div className="absolute right-4 top-4 z-10 flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-lg sm:right-6 sm:top-6">
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            onClick={() => setTheme(item.id)}
            className={`rounded-lg p-2 transition ${
              theme === item.id ? 'bg-paper-2 text-ink' : 'text-muted hover:bg-paper-2 hover:text-ink'
            }`}
          >
            <span className="flex gap-0.5">
              {item.preview.map((color) => (
                <span
                  key={color}
                  className="h-3 w-3 rounded-full border border-line/60"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 text-center">
          <img
            src="/thinkmern-logo.svg"
            alt="thinkMern"
            className="mx-auto mb-4 h-auto w-full max-w-xs object-contain"
          />
          <p className="mt-2 text-sm text-muted">Sign in to access your interview question bank.</p>
        </div>

        <form onSubmit={onSubmit} className="glass-panel rounded-3xl p-6 sm:p-8">
          {error && (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <label className="mb-4 block text-sm">
            <span className="mb-1.5 block font-medium text-ink">Email / username</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-3 outline-none focus:border-accent"
              />
            </div>
          </label>

          <label className="mb-6 block text-sm">
            <span className="mb-1.5 block font-medium text-ink">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-11 outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
