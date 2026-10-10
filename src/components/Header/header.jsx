import { useState } from 'react';
import { Container, Logo, LogoutBtn, ThemeToggle, StyleSwitcher, MobileMenuDrawer, MobileBottomDock } from '../index';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdminUser } from '../../utils/authHelper';
import { useSavedPosts } from '../../hooks/useSavedPosts';

const Header = () => {
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
  const { savedCount } = useSavedPosts();
  const isAdmin = isAdminUser(userData);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Home',
      slug: "/",
      active: true
    },
    {
      name: "All Posts",
      slug: "/all-posts",
      active: authStatus,
    },
    {
      name: "Saved",
      slug: "/saved-posts",
      active: true,
      badge: savedCount > 0 ? savedCount : null,
      icon: (
        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    {
      name: "Write Post",
      slug: "/add-post",
      active: authStatus,
      isPrimary: true,
    },
    {
      name: "Login",
      slug: "/login",
      active: !authStatus,
    },
    {
      name: "Sign Up",
      slug: "/signup",
      active: !authStatus,
      isPrimary: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--neu-bg)]/85 backdrop-blur-md border-b border-white/60 dark:border-white/5 shadow-xs transition-colors duration-200">
      <Container>
        <nav className="flex items-center justify-between py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="transition-transform duration-200 hover:scale-[1.02]">
              <Logo width="160px" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <ul className="flex items-center gap-2">
              {navItems.map((item) =>
                item.active ? (
                  <li key={item.name}>
                    {item.isPrimary ? (
                      <button
                        onClick={() => navigate(item.slug)}
                        className="neu-btn-primary px-4 py-2 text-sm"
                      >
                        {item.slug === "/add-post" && (
                          <svg className="w-4 h-4 action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                          </svg>
                        )}
                        <span>{item.name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(item.slug)}
                        className={`nav-link inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                          location.pathname === item.slug
                            ? 'nav-link-active neu-inset-sm text-[var(--accent-primary)] font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.name}</span>
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-[var(--accent-primary)] text-white shadow-xs">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )}
                  </li>
                ) : null
              )}
            </ul>

            <div className="flex items-center gap-2.5 pl-3 ml-2 border-l border-slate-300/60 dark:border-white/10">
              <StyleSwitcher />
              <ThemeToggle />

              {authStatus && (
                <>
                  {userData?.name && (
                    <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 neu-surface-sm px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="truncate max-w-[120px]">{userData.name}</span>
                      {isAdmin && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  <LogoutBtn />
                </>
              )}
            </div>
          </div>

          {/* Mobile Top Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="neu-surface-sm p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)] cursor-pointer flex items-center justify-center transition-transform active:scale-95"
              aria-label="Open mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </Container>

      {/* Full-Featured Tactile Mobile Navigation & Aesthetics Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Native-feeling Floating Mobile Bottom Navigation Dock */}
      <MobileBottomDock
        onOpenMenu={() => setMobileMenuOpen(true)}
      />
    </header>
  );
};

export default Header;