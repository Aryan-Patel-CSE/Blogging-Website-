import { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import authservice from './appwrite/auth';
import { login, logout } from './store/authSlice';
import { Footer, Header, NeuLoader } from './components';
import './App.css';

const App = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;
    let loadingTimer;
    const startedAt = Date.now();
    const minimumLoadingDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 500
      : 2600;

    authservice.getCurrentUser()
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
      .finally(() => {
        const remainingDuration = Math.max(
          0,
          minimumLoadingDuration - (Date.now() - startedAt),
        );
        loadingTimer = window.setTimeout(() => {
          if (active) setLoading(false);
        }, remainingDuration);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimer);
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="welcome-splash" role="status" aria-live="polite">
        <div className="welcome-splash__content">
          <span className="welcome-splash__sr-only">Hello. Welcome to InkSpace.</span>
          <h1 className="welcome-splash__hello" aria-hidden="true">
            {'Hello'.split('').map((letter, index) => (
              <span key={`${letter}-${index}`}>{letter}</span>
            ))}
          </h1>
          <p className="welcome-splash__title">Welcome to InkSpace</p>
          <p className="welcome-splash__tagline">Stories, perspectives &amp; ideas—just for you.</p>
          <div className="mt-8">
            <NeuLoader text="Opening your space..." size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--neu-bg)] text-slate-900 dark:text-slate-100 selection:bg-[#FF6B00] selection:text-white transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default App;
