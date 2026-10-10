import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`neu-theme-toggle ${isDark ? 'is-dark' : ''} ${className}`}
    >
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      
      {/* Background track icons / stars */}
      <span className="absolute left-1.5 flex items-center justify-center pointer-events-none opacity-40 dark:opacity-0 transition-opacity duration-300">
        <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3" />
        </svg>
      </span>
      <span className="absolute right-1.5 flex items-center justify-center pointer-events-none opacity-0 dark:opacity-40 transition-opacity duration-300">
        <svg className="w-2.5 h-2.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2l1.5 4.5L16 8l-3.5 3L13.5 16 10 13.5 6.5 16 7.5 11 4 8l4.5-1.5z" />
        </svg>
      </span>

      {/* Sliding and rotating thumb */}
      <span className="neu-theme-toggle__thumb">
        {isDark ? (
          <svg
            className="neu-theme-toggle__icon neu-theme-toggle__icon--moon text-[var(--accent-primary)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.3 4.9c.4-.2.6-.7.5-1.1-.1-.4-.6-.7-1-.6-5.8.8-10 6-9.6 11.9.4 5.7 5.1 10.2 10.8 10.2 5.5 0 10.2-4.1 10.7-9.6.1-.4-.2-.9-.6-1-.4-.1-.9 0-1.1.4-1.9 2.5-5 3.8-8.2 3.3-3.9-.6-7-3.9-7.4-7.8-.5-4.1 2.3-7.8 5.9-8.7z" />
          </svg>
        ) : (
          <svg
            className="neu-theme-toggle__icon neu-theme-toggle__icon--sun text-[var(--accent-primary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="4" strokeWidth="2.5" fill="currentColor" fillOpacity="0.2" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41"
            />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
