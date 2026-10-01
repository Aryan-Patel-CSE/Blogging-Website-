import { useState } from 'react';

import { Container, Logo, LogoutBtn } from '../index';
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
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all'>
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
                        className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-200 cursor-pointer'
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
                            ? 'text-indigo-600 bg-indigo-50/80 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        {item.name}
                      </button>
                    )}
                  </li>
                ) : null
              )}
            </ul>

            {authStatus && (
              <div className="flex items-center gap-3 pl-2 ml-2 border-l border-slate-200">
                {userData?.name && (
                  <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="truncate max-w-[120px]">{userData.name}</span>
                  </div>
                )}
                <LogoutBtn />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='flex items-center gap-2 md:hidden'>
            {authStatus && <LogoutBtn />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer'
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
          <div className='md:hidden py-3 border-t border-slate-200 space-y-1.5 animate-fadeIn'>
            {userData?.name && (
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500">
                Signed in as <strong className="text-slate-800">{userData.name}</strong>
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
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
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