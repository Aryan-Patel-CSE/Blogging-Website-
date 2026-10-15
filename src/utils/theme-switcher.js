/**
 * ============================================================================
 * InkSpace Master Theme Engine (theme-switcher.js)
 * ============================================================================
 * Unified single-aesthetic engine combining:
 * - Skeuomorphism: Machined metallic bevels, specular edges & physical depth
 * - Interactive 3D: Cursor tilt physics, specular glare tracking & parallax layers
 * - Light/Dark theme color-scheme synchronization with localStorage persistence
 * - Zero external dependencies
 */

export const THEME_STORAGE_KEY = 'inkspace_theme';
export const STYLE_STORAGE_KEY = 'inkspace_style';
export const UNIFIED_STYLE_ID = 'skeuomorphic-3d';

export const STYLES = [
  {
    id: UNIFIED_STYLE_ID,
    label: 'Skeuomorphism Interactive 3D',
    description: 'Machined metallic bevels, tactile depth & interactive 3D tilt physics',
    icon: '❖',
    badge: 'Master Theme',
  },
];

class ThemeEngine {
  constructor() {
    this.theme = this.getStoredTheme();
    this.style = UNIFIED_STYLE_ID;
    this.listeners = new Set();
    this.tiltCleanup = null;

    // Apply baseline attributes immediately
    this.applyTheme(this.theme);
    this.applyStyle(this.style);

    // Watch system color-scheme changes if user hasn't explicitly set a preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.handleSystemThemeChange = (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      };
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }

    // Interactive 3D Tilt Physics is always active for the unified style
    this.initTiltPhysics();
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
    return UNIFIED_STYLE_ID;
  }

  setTheme(newTheme) {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    this.theme = newTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('ThemeEngine: Failed to save theme to localStorage', e);
    }
    this.applyTheme(newTheme);
    this.notify();
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setStyle() {
    // Keep unified style permanent
    this.style = UNIFIED_STYLE_ID;
    this.applyStyle(UNIFIED_STYLE_ID);
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
     Interactive 3D Card Tilt Physics Handler (Mouse + Mobile Touch & Gyroscope)
     -------------------------------------------------------------------------- */
  initTiltPhysics() {
    if (typeof window === 'undefined') return;
    this.destroyTiltPhysics(); // ensure no duplicate listeners

    let activeTouchCard = null;

    const handleMouseMove = (e) => {
      const card = e.target.closest('.neu-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (max +/- 11 degrees for smooth tactile realism)
      const rotateX = -((y - centerY) / centerY) * 11;
      const rotateY = ((x - centerX) / centerX) * 11;

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

    // Mobile Touch Physics Compensation: Tilt card dynamically to finger contact point
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = element ? element.closest('.neu-card') : null;
      if (!card) return;

      activeTouchCard = card;
      const rect = card.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -((y - centerY) / centerY) * 9;
      const rotateY = ((x - centerX) / centerX) * 9;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px) scale3d(1.015, 1.015, 1.015)`;
    };

    const handleTouchMove = (e) => {
      if (!activeTouchCard) return;
      const touch = e.touches[0];
      if (!touch) return;

      const rect = activeTouchCard.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -((y - centerY) / centerY) * 9;
      const rotateY = ((x - centerX) / centerX) * 9;

      activeTouchCard.style.setProperty('--mouse-x', `${x}px`);
      activeTouchCard.style.setProperty('--mouse-y', `${y}px`);
      activeTouchCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px) scale3d(1.015, 1.015, 1.015)`;
    };

    const handleTouchEnd = () => {
      if (!activeTouchCard) return;
      activeTouchCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      activeTouchCard.style.setProperty('--mouse-x', '50%');
      activeTouchCard.style.setProperty('--mouse-y', '50%');
      activeTouchCard = null;
    };

    // Mobile Gyroscope / Device Orientation Tilt Compensation
    const handleDeviceOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;
      // Clamp gamma (-45 to 45) and beta (-45 to 45) to subtle tilt ranges
      const tiltY = Math.max(-7, Math.min(7, (e.gamma / 45) * 7));
      const tiltX = Math.max(-7, Math.min(7, ((e.beta - 45) / 45) * 7));

      document.documentElement.style.setProperty('--mobile-gyro-x', `${tiltY.toFixed(2)}deg`);
      document.documentElement.style.setProperty('--mobile-gyro-y', `${tiltX.toFixed(2)}deg`);
    };

    // Delegate listeners on document
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseLeave, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    this.tiltCleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }

      document.documentElement.style.removeProperty('--mobile-gyro-x');
      document.documentElement.style.removeProperty('--mobile-gyro-y');

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
}

// Global Singleton Instance
export const themeEngine = new ThemeEngine();
export default themeEngine;
