import { useState } from 'react';

import { Container, Logo, LogoutBtn, ThemeToggle } from '../index';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Header = () => {
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
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
    <header className='sticky top-0 z-50 bg-white/85 dark:bg-[#190325]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#7A1CAC]/30 transition-colors duration-200'>
      <Container>
        <nav className='flex items-center justify-between py-3.5'>
          {/* Logo */}
          <div className='flex items-center gap-6'>
            <Link to='/' className="transition-transform duration-200 hover:scale-[1.02]">
              <Logo width='160px' />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-2'>
            <ul className='flex items-center gap-1.5'>
              {navItems.map((item) =>
                item.active ? (
                  <li key={item.name}>
                    {item.isPrimary ? (
                      <button
                        onClick={() => navigate(item.slug)}
                        className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#7A1CAC] hover:bg-[#AD49E1] active:bg-[#2E073F] rounded-xl shadow-xs transition-all duration-200 cursor-pointer shadow-sm shadow-[#7A1CAC]/20'
                      >
                        {item.slug === "/add-post" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                        )}
                        {item.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(item.slug)}
                        className={`inline-block px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                          location.pathname === item.slug
                            ? 'text-[#7A1CAC] bg-[#EBD3F8]/60 dark:text-[#EBD3F8] dark:bg-[#7A1CAC]/40 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-[#7A1CAC] dark:hover:text-[#EBD3F8] hover:bg-[#EBD3F8]/30 dark:hover:bg-[#2E073F]/70'
                        }`}
                      >
                        {item.name}
                      </button>
                    )}
                  </li>
                ) : null
              )}
            </ul>

            <div className="flex items-center gap-2.5 pl-2 ml-2 border-l border-slate-200 dark:border-[#7A1CAC]/40">
              <ThemeToggle />

              {authStatus && (
                <>
                  {userData?.name && (
                    <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#EBD3F8] bg-slate-100 dark:bg-[#2E073F] px-3 py-1.5 rounded-full border border-transparent dark:border-[#7A1CAC]/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="truncate max-w-[120px]">{userData.name}</span>
                    </div>
                  )}
                  <LogoutBtn />
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className='flex items-center gap-2 md:hidden'>
            <ThemeToggle />
            {authStatus && <LogoutBtn />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='p-2 rounded-xl text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E073F] transition-colors cursor-pointer'
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
          <div className='md:hidden py-3 border-t border-slate-200 dark:border-[#7A1CAC]/30 space-y-1.5 animate-fadeIn bg-white/95 dark:bg-[#190325]/95'>
            {userData?.name && (
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[#EBD3F8]/70">
                Signed in as <strong className="text-slate-800 dark:text-white">{userData.name}</strong>
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
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    location.pathname === item.slug
                      ? 'text-[#7A1CAC] bg-[#EBD3F8]/60 dark:text-[#EBD3F8] dark:bg-[#7A1CAC]/40 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2E073F]'
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