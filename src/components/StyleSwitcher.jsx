import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { STYLES } from '../utils/theme-switcher';

const StyleSwitcher = ({ className = '' }) => {
  const { style, setStyle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeStyleObj = STYLES.find((s) => s.id === style) || STYLES[0];

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectStyle = (newStyleId) => {
    setStyle(newStyleId);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current Design Style: ${activeStyleObj.label}. Click to switch.`}
        className="style-switcher-trigger"
        title="Change Design Aesthetic"
      >
        <span className="text-sm leading-none opacity-90">{activeStyleObj.icon}</span>
        <span className="hidden sm:inline font-medium text-xs opacity-80">Style:</span>
        <span className="font-bold text-xs truncate max-w-[90px] sm:max-w-none">
          {activeStyleObj.label}
        </span>
        <svg
          className={`w-3 h-3 ml-0.5 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="style-switcher-popover"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-2.5 py-1.5 mb-1.5 border-b border-[var(--border-color-subtle)] flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
              Select Design System
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent-primary)]">
              5 Aesthetics
            </span>
          </div>

          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-0.5">
            {STYLES.map((item) => {
              const isSelected = item.id === style;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectStyle(item.id)}
                  role="menuitem"
                  className={`style-switcher-item ${isSelected ? 'is-active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none w-5 text-center flex-shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        {item.label}
                        {isSelected && (
                          <svg className="w-3 h-3 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[10.5px] opacity-65 leading-tight line-clamp-1">
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded opacity-80 border border-current flex-shrink-0 ml-1">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSwitcher;
