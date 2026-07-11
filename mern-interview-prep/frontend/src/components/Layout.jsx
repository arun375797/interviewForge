import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, Shuffle, Plus, LogOut, GraduationCap, Code2, CalendarDays, Timer, ShieldCheck, BookMarked, TerminalSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

const links = [
  { to: '/', label: 'Subjects', icon: BookOpen, end: true },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/code', label: 'Code', icon: Code2 },
  { to: '/ide', label: 'IDE', icon: TerminalSquare },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/practice', label: 'Practice', icon: Shuffle },
  { to: '/mock', label: 'Mock', icon: Timer },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/notebook', label: 'Notebook', icon: BookMarked },
  { to: '/add', label: 'Add', icon: Plus },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderLink = ({ to, label, icon: Icon, end }, variant = 'desktop') => (
    <NavLink
      key={`${variant}-${to}`}
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          variant === 'mobile' ? 'whitespace-nowrap' : ''
        } ${
          isActive
            ? 'bg-ink text-paper'
            : 'text-muted hover:bg-paper-2 hover:text-ink'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={variant === 'desktop' ? 'hidden xl:inline' : ''}>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-body">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-header backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          <Link to="/" className="group flex min-w-0 flex-1 items-center lg:flex-none">
            <img
              src="/thinkmern-logo.svg"
              alt="thinkMern"
              className="h-9 w-auto max-w-[10.5rem] shrink-0 object-contain transition group-hover:scale-[1.02] sm:h-10 sm:max-w-[12.5rem] lg:max-w-[9.5rem] xl:max-w-[12.5rem]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((link) => renderLink(link))}
            </nav>

            <ThemeSwitcher />

            <div className="hidden items-center gap-2 border-l border-line pl-3 md:flex">
              <span className="max-w-[120px] truncate text-xs text-muted lg:max-w-[96px] xl:max-w-[140px]" title={user?.email}>
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
              className="rounded-lg p-2 text-muted hover:bg-paper-2 hover:text-ink md:hidden"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
          {links.map((link) => renderLink(link, 'mobile'))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-line/70 px-4 py-8 text-center text-sm text-muted">
        <span className="font-semibold">
          <span className="text-brand-1">think</span>
          <span className="text-brand-2">Mern</span>
        </span>{' '}
        — Learn. Build. Crack Interviews.
      </footer>
    </div>
  );
}
