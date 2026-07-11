import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  GraduationCap,
  Code2,
  BookMarked,
  TerminalSquare,
  Keyboard,
  Target,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HeaderSettingsDropdown from './HeaderSettingsDropdown';
import SideNavPanel from './SideNavPanel';

const headerLinks = [
  { to: '/', label: 'Subjects', icon: BookOpen, end: true },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/weak-spots', label: 'Weak', icon: Target },
  { to: '/notebook', label: 'Notebook', icon: BookMarked },
];

const buildLinks = [
  {
    to: '/code',
    label: 'Code',
    icon: Code2,
    isActive: (path) => path === '/code' || path.startsWith('/code/'),
  },
  {
    to: '/ide',
    label: 'IDE',
    icon: TerminalSquare,
    isActive: (path) => path === '/ide' || path.startsWith('/ide/'),
  },
  {
    to: '/typing',
    label: 'Type speed',
    icon: Keyboard,
    isActive: (path) => path === '/typing' || path.startsWith('/typing/'),
  },
];

function NavDropdown({
  menuLabel,
  triggerLabel,
  triggerIcon: TriggerIcon,
  items,
  isItemActive,
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const pathname = location.pathname;
  const isActive = items.some((item) => isItemActive(item, pathname));
  const activeItem = items.find((item) => isItemActive(item, pathname));
  const Icon = activeItem?.icon || TriggerIcon;
  const label = activeItem?.label || triggerLabel;

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuStyle(
      align === 'right'
        ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 4, left: rect.left }
    );
  };

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);

    const onPointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggleOpen = () => {
    const next = !open;
    if (next && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle(
        align === 'right'
          ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 4, left: rect.left }
      );
    }
    setOpen(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition ${
          isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-paper-2 hover:text-ink'
        }`}
        title={label}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={menuLabel}
              style={menuStyle}
              className="fixed z-[100] min-w-[10.5rem] rounded-xl border border-line bg-surface p-1 shadow-xl"
            >
              {items.map((item) => {
                const { to, label: itemLabel, icon: ItemIcon, end } = item;
                const itemActive = isItemActive(item, pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    end={end}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      itemActive
                        ? 'bg-paper-2 text-ink'
                        : 'text-muted hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <span>{itemLabel}</span>
                  </Link>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function BuildNavDropdown() {
  return (
    <NavDropdown
      menuLabel="Code tools"
      triggerLabel="Code"
      triggerIcon={Code2}
      items={buildLinks}
      isItemActive={(item, pathname) =>
        item.isActive ? item.isActive(pathname) : pathname === item.to
      }
    />
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const logoSrc = theme === 'paper' ? '/thinkmern-logo.svg' : '/thinkmern-logo-dark.svg';

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderLink = ({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-ink text-paper'
            : 'text-muted hover:bg-paper-2 hover:text-ink'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex min-h-screen flex-col bg-body">
      <header className="sticky top-0 z-40 bg-header/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 sm:gap-4 sm:py-3.5">
            <div className="flex min-w-0 items-center justify-start">
              <Link to="/" className="group flex shrink-0 items-center">
                <img
                  src={logoSrc}
                  alt="thinkMern"
                  className="h-9 w-auto max-w-[10.5rem] object-contain transition group-hover:scale-[1.02] sm:h-10 sm:max-w-[12rem] lg:h-11 lg:max-w-[13.5rem]"
                />
              </Link>
            </div>

            <nav className="scrollbar-none flex items-center justify-center gap-0.5 sm:gap-1">
              {headerLinks.map((link) => renderLink(link))}
              <BuildNavDropdown />
            </nav>

            <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2.5">
              <HeaderSettingsDropdown />

              <span
                className="hidden max-w-[9rem] truncate text-xs text-muted md:inline lg:max-w-[11rem]"
                title={user?.email}
              >
                {user?.email}
              </span>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-paper-2 hover:text-ink"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <SideNavPanel />

      <footer>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 text-center text-sm text-muted sm:px-6">
          <span className="font-semibold">
            <span className="text-brand-1">think</span>
            <span className="text-brand-2">Mern</span>
          </span>{' '}
          — Learn. Build. Crack Interviews.
        </div>
      </footer>
    </div>
  );
}
