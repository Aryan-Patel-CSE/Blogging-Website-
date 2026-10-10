import { useState } from 'react';
import { Container, Logo, LogoutBtn, ThemeToggle } from '../index';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdminUser } from '../../utils/authHelper';

const Header = () => {
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
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
                        className={`inline-block px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                          location.pathname === item.slug
                            ? 'neu-inset-sm text-[#FF6B00] dark:text-[#FF7A18]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {item.name}
                      </button>
                    )}
                  </li>
                ) : null
              )}
            </ul>

            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-slate-300/60 dark:border-white/10">
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

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            {authStatus && <LogoutBtn />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neu-surface-sm p-2 rounded-xl text-slate-600 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200/50 dark:border-white/5 space-y-1.5 animate-fadeIn bg-[var(--neu-bg)]/95">
            {userData?.name && (
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Signed in as <strong className="text-slate-800 dark:text-white">{userData.name}</strong>
                {isAdmin && (
                  <span className="ml-2 inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Admin
                  </span>
                )}
              </div>
            )}
            {navItems.map((item) =>
              item.active ? (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.slug);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    location.pathname === item.slug
                      ? 'neu-inset-sm text-[#FF6B00] dark:text-[#FF7A18]'
                      : 'text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18]'
                  }`}
                >
                  {item.name}
                </button>
              ) : null
            )}
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;