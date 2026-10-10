import { createContext, useContext, useEffect, useState } from 'react';
import themeEngine, { STYLES, THEME_STORAGE_KEY, STYLE_STORAGE_KEY } from '../utils/theme-switcher';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  style: 'default',
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

  const [style, setStyleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY);
      const isValid = STYLES.some((s) => s.id === saved);
      return isValid ? saved : 'default';
    } catch {
      return 'default';
    }
  });

  // Synchronize Theme & Data Attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
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

  // Synchronize Style & Data Attributes & 3D Tilt Physics
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-style', style);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, style);
    } catch (e) {
      console.warn('Could not save style to localStorage', e);
    }

    if (style === 'interactive-3d') {
      themeEngine.initTiltPhysics();
    } else {
      themeEngine.destroyTiltPhysics();
    }

    return () => {
      themeEngine.destroyTiltPhysics();
    };
  }, [style]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    themeEngine.setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setStyle = (newStyle) => {
    setStyleState(newStyle);
    themeEngine.setStyle(newStyle);
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
