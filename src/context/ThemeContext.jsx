import { createContext, useContext, useEffect, useState } from 'react';
import themeEngine, { STYLES, THEME_STORAGE_KEY, UNIFIED_STYLE_ID } from '../utils/theme-switcher';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  style: UNIFIED_STYLE_ID,
  setStyle: () => {},
  styles: STYLES,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Always use the unified Skeuomorphism Interactive 3D master theme
  const style = UNIFIED_STYLE_ID;

  // Synchronize Theme & Root Data Attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-style', UNIFIED_STYLE_ID);

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }, [theme]);

  // Permanently maintain Interactive 3D Tilt Physics
  useEffect(() => {
    themeEngine.initTiltPhysics();
    return () => {
      themeEngine.destroyTiltPhysics();
    };
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    themeEngine.setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setStyle = () => {
    // Style is locked to Skeuomorphism Interactive 3D
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, style, setStyle, styles: STYLES }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
