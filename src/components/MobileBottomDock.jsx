import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSavedPosts } from '../hooks/useSavedPosts';
import { useTheme } from '../context/ThemeContext';

const MobileBottomDock = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authStatus = useSelector((state) => state.auth.status);
  const { savedCount } = useSavedPosts();
  const { style, styles } = useTheme();

  const currentStyleObj = styles.find((s) => s.id === style) || styles[0];

  const dockItems = [
    {
      id: 'home',
      name: 'Home',
      slug: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'explore',
      name: 'Explore',
      slug: authStatus ? '/all-posts' : '/login',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      id: 'write',
      name: 'Write',
      slug: authStatus ? '/add-post' : '/login',
      isPrimaryAction: true,
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'saved',
      name: 'Saved',
      slug: '/saved-posts',
      badge: savedCount > 0 ? savedCount : null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    {
      id: 'menu',
      name: 'Styles',
      action: onOpenMenu,
      icon: (
        <span className="text-lg leading-none">{currentStyleObj.icon}</span>
      ),
    },
  ];

  return (
    <nav
      className="mobile-bottom-dock md:hidden fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-md mx-auto"
      aria-label="Mobile Navigation Dock"
    >
      <div className="mobile-bottom-dock__inner flex items-center justify-around px-2 py-1.5 rounded-full">
        {dockItems.map((item) => {
          const isActive = item.slug ? location.pathname === item.slug : false;

          if (item.isPrimaryAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.slug)}
                aria-label="Write a story"
                className="mobile-dock-fab -mt-5 flex flex-col items-center justify-center p-3 rounded-full neu-btn-primary shadow-lg cursor-pointer transform active:scale-95 transition-transform"
              >
                {item.icon}
                <span className="sr-only">Write</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.slug) {
                  navigate(item.slug);
                }
              }}
              className={`mobile-dock-btn relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[54px] rounded-2xl cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'mobile-dock-btn--active text-[var(--accent-primary)] font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-[var(--accent-primary)] text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium leading-none truncate max-w-[52px]">
                {item.name}
              </span>
              {isActive && (
                <span className="mobile-dock-indicator absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomDock;
