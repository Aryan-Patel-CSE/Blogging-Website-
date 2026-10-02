import { useState, useEffect } from 'react';

import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import authservice from './appwrite/auth';
import { login, logout } from './store/authSlice';
import { Header, Footer, Logo } from './components';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [darkTheme, setDarkTheme] = useState(
    () => window.localStorage.getItem('theme') === 'dark',
  );
  const dispatch = useDispatch();

  useEffect(() => {
    document.documentElement.dataset.theme = darkTheme ? 'dark' : 'light';
    window.localStorage.setItem('theme', darkTheme ? 'dark' : 'light');
  }, [darkTheme]);

  useEffect(() => {
    authservice
      .getCurrentUser()
      .then((userData) => {
        if (userData) {
          dispatch(login(userData));
        } else {
          dispatch(logout());
        }
      })
      .catch((error) => {
        console.error('App :: getCurrentUser :: error', error);
        dispatch(logout());
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Logo width="180px" />
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mt-2"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading InkSpace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header
        darkTheme={darkTheme}
        onToggleTheme={() => setDarkTheme((currentTheme) => !currentTheme)}
      />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default App;
