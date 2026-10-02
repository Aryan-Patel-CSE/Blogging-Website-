import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative p-2 rounded-xl transition-all duration-300 cursor-pointer border flex items-center justify-center ${
        isDark
          ? 'bg-[#2E073F] border-[#7A1CAC] text-[#EBD3F8] hover:bg-[#3b0d52] hover:text-white shadow-sm shadow-[#AD49E1]/20'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-[#EBD3F8]/30 hover:border-[#AD49E1]/40 hover:text-[#7A1CAC] shadow-xs'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        // Sun icon for dark mode (click to go to light)
        <svg
          className="w-5 h-5 transition-transform duration-300 hover:rotate-45 text-[#AD49E1]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for light mode (click to go to dark)
        <svg
          className="w-5 h-5 transition-transform duration-300 hover:-rotate-12 text-[#7A1CAC]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
