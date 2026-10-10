import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle, LogoutBtn, Logo } from './index';
import { isAdminUser } from '../utils/authHelper';

const MobileMenuDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
  const isAdmin = isAdminUser(userData);
  const { style, setStyle, styles } = useTheme();

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation & Aesthetics Menu"
    >
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Sheet */}
      <div className="mobile-drawer-sheet relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl p-5 sm:p-6 shadow-2xl animate-drawerEnter">
        {/* Pull handle */}
        <div className="flex justify-center -mt-1 mb-3">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Header row: Logo & Close Button */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border-color-subtle)]">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={onClose}>
              <Logo width="130px" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 rounded-xl neu-surface-sm text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Status Card */}
        {authStatus && userData?.name ? (
          <div className="neu-surface-sm p-3.5 rounded-2xl mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-sm ring-1 ring-[var(--accent-primary)]/30 flex-shrink-0">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userData.name}
                  </span>
                  {isAdmin && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {userData.email || 'Author'}
                </p>
              </div>
            </div>
            <div onClick={onClose}>
              <LogoutBtn />
            </div>
          </div>
        ) : !authStatus ? (
          <div className="neu-surface-sm p-3.5 rounded-2xl mb-5 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Welcome to InkSpace</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Join our storytellers today</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigate('/login');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl neu-surface"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/signup');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl neu-btn-primary"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : null}

        {/* Design System Aesthetic Studio */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Design Systems (5 Aesthetics)
            </span>
            <span className="text-[11px] font-semibold text-[var(--accent-primary)]">
              Interactive
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {styles.map((item) => {
              const isSelected = item.id === style;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStyle(item.id)}
                  className={`mobile-style-card flex items-center justify-between p-3 rounded-2xl text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'is-active neu-inset-sm border-2 border-[var(--accent-primary)]'
                      : 'neu-surface-sm border border-[var(--border-color-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-current opacity-70 ml-2 flex-shrink-0">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--border-color-subtle)]">
          <button
            type="button"
            onClick={() => {
              navigate('/');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl cursor-pointer ${
              location.pathname === '/'
                ? 'neu-inset-sm text-[var(--accent-primary)]'
                : 'text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)]'
            }`}
          >
            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>

          {authStatus && (
            <button
              type="button"
              onClick={() => {
                navigate('/all-posts');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl cursor-pointer ${
                location.pathname === '/all-posts'
                  ? 'neu-inset-sm text-[var(--accent-primary)]'
                  : 'text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)]'
              }`}
            >
              <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span>All Stories</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              navigate('/saved-posts');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl cursor-pointer ${
              location.pathname === '/saved-posts'
                ? 'neu-inset-sm text-[var(--accent-primary)]'
                : 'text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)]'
            }`}
          >
            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Saved Stories</span>
          </button>

          {authStatus && (
            <button
              type="button"
              onClick={() => {
                navigate('/add-post');
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl neu-btn-primary cursor-pointer mt-2"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Write a Story</span>
              </div>
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenuDrawer;
