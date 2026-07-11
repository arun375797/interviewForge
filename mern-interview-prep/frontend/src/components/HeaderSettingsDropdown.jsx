import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Check, ChevronDown, Palette, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function HeaderSettingsDropdown() {
  const { isAdmin } = useAuth();
  const { theme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const isAdminActive = location.pathname.startsWith('/admin');
  const activeTheme = themes.find((item) => item.id === theme);

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
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
  }, [location.pathname]);

  const toggleOpen = () => {
    const next = !open;
    if (next && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
          open || isAdminActive
            ? 'bg-paper-2 text-ink'
            : 'text-muted hover:bg-paper-2 hover:text-ink'
        }`}
        title="Theme and admin"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Palette className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{activeTheme?.label || 'Theme'}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label="Theme and admin"
              style={menuStyle}
              className="fixed z-[100] w-60 rounded-xl border border-line bg-surface p-1.5 shadow-xl"
            >
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Theme
              </p>
              {themes.map((item) => {
                const active = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setTheme(item.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      active ? 'bg-paper-2 text-ink' : 'text-muted hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    <span className="flex shrink-0 gap-0.5">
                      {item.preview.map((color) => (
                        <span
                          key={color}
                          className="h-4 w-4 rounded-full border border-line/60"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block truncate text-xs opacity-75">{item.description}</span>
                    </span>
                    {active ? <Check className="h-4 w-4 shrink-0 text-accent" /> : null}
                  </button>
                );
              })}

              {isAdmin ? (
                <>
                  <div className="my-1.5 border-t border-line" />

                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Admin
                  </p>
                  <Link
                    to="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isAdminActive
                        ? 'bg-paper-2 text-ink'
                        : 'text-muted hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Manage answers</span>
                  </Link>
                </>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
