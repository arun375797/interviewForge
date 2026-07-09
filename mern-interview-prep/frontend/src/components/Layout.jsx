import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, Brain, Shuffle, Plus, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Subjects', icon: BookOpen, end: true },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/practice', label: 'Practice', icon: Shuffle },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/add', label: 'Add', icon: Plus },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-[#f7f3eb]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-paper shadow-sm transition group-hover:scale-[1.03]">
              <Brain className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                InterviewForge
              </p>
              <p className="hidden text-xs text-muted sm:block">MERN stack · JS · React · Node · DSA</p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-1 sm:gap-2">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
                      isActive
                        ? 'bg-ink text-paper'
                        : 'text-muted hover:bg-paper-2 hover:text-ink'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="ml-1 hidden items-center gap-2 border-l border-line pl-3 sm:flex">
              <span className="max-w-[120px] truncate text-xs text-muted" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-paper-2 hover:text-ink"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-muted hover:bg-paper-2 hover:text-ink sm:hidden"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-line/70 py-8 text-center text-sm text-muted">
        InterviewForge — practice like you speak in interviews.
      </footer>
    </div>
  );
}
