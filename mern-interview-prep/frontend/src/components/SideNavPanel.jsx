import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Bookmark,
  Brain,
  CalendarDays,
  ChevronRight,
  Layers2,
  LayoutGrid,
  Mic,
  Plus,
  Shuffle,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'thinkmern-side-nav-open';

const basePanelLinks = [
  { to: '/review', label: 'Review', icon: Brain },
  { to: '/flashcards', label: 'Cards', icon: Layers2 },
  { to: '/feynman', label: 'Explain', icon: Mic },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/practice', label: 'Practice', icon: Shuffle },
  { to: '/mock', label: 'Mock', icon: Timer },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

const adminPanelLink = { to: '/add', label: 'Add', icon: Plus };

function isLinkActive(pathname, { to, end }) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function getStoredOpen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function SideNavPanel() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(getStoredOpen);
  const location = useLocation();
  const pathname = location.pathname;
  const sidePanelLinks = isAdmin ? [...basePanelLinks, adminPanelLink] : basePanelLinks;
  const hasActiveLink = sidePanelLinks.some((link) => isLinkActive(pathname, link));
  const activeLink = sidePanelLinks.find((link) => isLinkActive(pathname, link));
  const ActiveIcon = activeLink?.icon || LayoutGrid;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore storage errors
    }
  }, [open]);

  if (!open) {
    return (
      <aside className="fixed right-4 top-24 z-30 sm:right-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Open tools panel"
          aria-label="Open tools panel"
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface shadow-lg transition hover:scale-105 hover:bg-paper-2 ${
            hasActiveLink ? 'ring-2 ring-accent ring-offset-2 ring-offset-body' : ''
          }`}
        >
          <ActiveIcon className="h-5 w-5 text-ink" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed right-4 top-24 z-30 w-44 sm:right-5 sm:w-48">
      <div className="glass-panel max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl p-2 shadow-xl">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Tools
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize panel"
            aria-label="Minimize panel"
            className="rounded-lg p-1 text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-0.5">
          {sidePanelLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-ink text-paper'
                    : 'text-muted hover:bg-paper-2 hover:text-ink'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
