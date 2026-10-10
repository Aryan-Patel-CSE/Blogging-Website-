/**
 * ============================================================================
 * InkSpace Multi-Aesthetic Theme Engine (theme-switcher.js)
 * ============================================================================
 * A lightweight, dependency-free JavaScript engine providing:
 * - Two-dimensional state management: data-theme and data-style
 * - Persistent storage (localStorage) with system preference fallbacks
 * - Dynamic button / popover dropdown rendering next to theme toggles
 * - Cursor-based 3D card tilt physics engine (active only in 'interactive-3d')
 */

export const THEME_STORAGE_KEY = 'inkspace_theme';
export const STYLE_STORAGE_KEY = 'inkspace_style';

export const STYLES = [
  {
    id: 'default',
    label: 'Default',
    description: 'Neumorphic soft UI & slate tones',
    icon: '✦',
    badge: 'Classic',
  },
  {
    id: 'neo-brutalism',
    label: 'Neo-Brutalism',
    description: 'Architectural borders, flat shadows & pop colors',
    icon: '■',
    badge: 'Editorial',
  },
  {
    id: 'claymorphism',
    label: 'Claymorphism',
    description: 'Velvety 3D matte pillowy surfaces',
    icon: '☁',
    badge: 'Tactile',
  },
  {
    id: 'skeuomorphism',
    label: 'Skeuomorphism',
    description: 'Realistic metallic bevels & hardware depth',
    icon: '⚙',
    badge: 'Luxury',
  },
  {
    id: 'interactive-3d',
    label: 'Interactive 3D',
    description: 'Cursor tilt physics, glare & translateZ layers',
    icon: '❖',
    badge: 'Spatial',
  },
];

class ThemeEngine {
  constructor() {
    this.theme = this.getStoredTheme();
    this.style = this.getStoredStyle();
    this.listeners = new Set();
    this.tiltCleanup = null;
    this.activeDropdown = null;

    // Initialize root attributes
    this.applyTheme(this.theme, false);
    this.applyStyle(this.style, false);

    // Watch system color-scheme changes if no saved theme
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.handleSystemThemeChange = (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      };
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }

    // Initialize interactive 3D physics if active
    if (this.style === 'interactive-3d') {
      this.initTiltPhysics();
    }
  }

  /* --------------------------------------------------------------------------
     State & Storage
     -------------------------------------------------------------------------- */
  getStoredTheme() {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  getStoredStyle() {
    if (typeof window === 'undefined') return 'default';
    try {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY);
      const isValid = STYLES.some((s) => s.id === saved);
      return isValid ? saved : 'default';
    } catch {
      return 'default';
    }
  }

  setTheme(newTheme) {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    this.theme = newTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('ThemeEngine: Failed to save theme to localStorage', e);
    }
    this.applyTheme(newTheme, true);
    this.notify();
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setStyle(newStyle) {
    const isValid = STYLES.some((s) => s.id === newStyle);
    if (!isValid) return;
    this.style = newStyle;
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, newStyle);
    } catch (e) {
      console.warn('ThemeEngine: Failed to save style to localStorage', e);
    }
    this.applyStyle(newStyle, true);

    // Toggle 3D tilt physics based on active style
    if (newStyle === 'interactive-3d') {
      this.initTiltPhysics();
    } else {
      this.destroyTiltPhysics();
    }

    this.notify();
  }

  applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  applyStyle(style) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-style', style);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ theme: this.theme, style: this.style });
      } catch (e) {
        console.error('ThemeEngine listener error:', e);
      }
    });
  }

  /* --------------------------------------------------------------------------
     Interactive 3D Card Tilt Physics Handler
     -------------------------------------------------------------------------- */
  initTiltPhysics() {
    if (typeof window === 'undefined') return;
    this.destroyTiltPhysics(); // ensure no duplicates

    const handleMouseMove = (e) => {
      const card = e.target.closest('.neu-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (max +/- 14 degrees)
      const rotateX = -((y - centerY) / centerY) * 12;
      const rotateY = ((x - centerX) / centerX) * 12;

      // Update CSS variables for specular glare layer
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Dynamic tilt transform
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = (e) => {
      const card = e.target.closest('.neu-card');
      if (!card) return;

      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    };

    // Delegate listeners on document for dynamically rendered posts
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseLeave, { passive: true });

    this.tiltCleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseLeave);

      // Reset all cards
      document.querySelectorAll('.neu-card').forEach((card) => {
        card.style.transform = '';
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      });
    };
  }

  destroyTiltPhysics() {
    if (this.tiltCleanup) {
      this.tiltCleanup();
      this.tiltCleanup = null;
    }
  }

  /* --------------------------------------------------------------------------
     Dynamic Dropdown UI Builder (Vanilla Fallback / Auto-Mount)
     -------------------------------------------------------------------------- */
  renderSwitcherUI(containerEl) {
    if (!containerEl) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-block';

    const currentStyleObj = STYLES.find((s) => s.id === this.style) || STYLES[0];

    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'style-switcher-trigger';
    triggerBtn.setAttribute('aria-haspopup', 'true');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.innerHTML = `
      <span class="text-base leading-none">${currentStyleObj.icon}</span>
      <span class="hidden sm:inline">Style:</span>
      <span class="font-bold">${currentStyleObj.label}</span>
      <svg class="w-3.5 h-3.5 ml-0.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;

    const popover = document.createElement('div');
    popover.className = 'style-switcher-popover hidden';
    popover.role = 'menu';

    STYLES.forEach((s) => {
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = `style-switcher-item ${s.id === this.style ? 'is-active' : ''}`;
      itemBtn.role = 'menuitem';
      itemBtn.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="text-base">${s.icon}</span>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold leading-tight">${s.label}</span>
            <span class="text-[10px] opacity-60 leading-tight">${s.description}</span>
          </div>
        </div>
        <span class="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded opacity-80 border border-current">
          ${s.badge}
        </span>
      `;

      itemBtn.onclick = () => {
        this.setStyle(s.id);
        popover.classList.add('hidden');
        triggerBtn.setAttribute('aria-expanded', 'false');
        triggerBtn.innerHTML = `
          <span class="text-base leading-none">${s.icon}</span>
          <span class="hidden sm:inline">Style:</span>
          <span class="font-bold">${s.label}</span>
          <svg class="w-3.5 h-3.5 ml-0.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        `;
      };

      popover.appendChild(itemBtn);
    });

    triggerBtn.onclick = (e) => {
      e.stopPropagation();
      const isHidden = popover.classList.contains('hidden');
      popover.classList.toggle('hidden');
      triggerBtn.setAttribute('aria-expanded', String(isHidden));
    };

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        popover.classList.add('hidden');
        triggerBtn.setAttribute('aria-expanded', 'false');
      }
    });

    wrapper.appendChild(triggerBtn);
    wrapper.appendChild(popover);
    containerEl.appendChild(wrapper);

    return wrapper;
  }
}

// Global Singleton Instance
export const themeEngine = new ThemeEngine();
export default themeEngine;
