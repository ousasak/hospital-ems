import { create } from 'zustand';

export type ColorPreset = 'emerald' | 'blue' | 'violet' | 'rose' | 'orange' | 'slate';

interface ThemeState {
  theme: 'light' | 'dark';
  colorPreset: ColorPreset;
  sidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setColorPreset: (preset: ColorPreset) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  themeMode: 'light' | 'dark' | 'system';
  updateThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  language: string;
  setLanguage: (lang: string) => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = (localStorage.getItem('staffstream_theme') as 'light' | 'dark') || 'light';
  const savedPreset = (localStorage.getItem('staffstream_preset') as ColorPreset) || 'emerald';
  
  // SmartHR FSM: Clean up old legacy keys that may have trapped the user in collapsed mode
  try {
    localStorage.removeItem('staffstream_sidebar_collapsed');
    localStorage.removeItem('smarthr_fsm_sidebar_collapsed');
  } catch (e) {
    // ignore
  }

  // Sidebar MUST default to EXPANDED (false) so full SmartHR navigation is visible as in reference UI
  const savedCollapsed = localStorage.getItem('smarthr_sidebar_user_collapsed') === 'true';

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (savedPreset) {
    document.documentElement.setAttribute('data-color-preset', savedPreset);
  }

  return {
    theme: savedTheme,
    colorPreset: savedPreset,
    sidebarCollapsed: savedCollapsed,
    setTheme: (theme) => {
      localStorage.setItem('staffstream_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },
    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('staffstream_theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: next };
      });
    },
    setColorPreset: (preset) => {
      localStorage.setItem('staffstream_preset', preset);
      document.documentElement.setAttribute('data-color-preset', preset);
      set({ colorPreset: preset });
    },
    toggleSidebarCollapsed: () => {
      set((state) => {
        const next = !state.sidebarCollapsed;
        localStorage.setItem('smarthr_sidebar_user_collapsed', String(next));
        return { sidebarCollapsed: next };
      });
    },
    setSidebarCollapsed: (collapsed) => {
      localStorage.setItem('smarthr_sidebar_user_collapsed', String(collapsed));
      set({ sidebarCollapsed: collapsed });
    },
    themeMode: (savedTheme as any) || 'light',
    updateThemeMode: (mode) => {
      const next = mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('staffstream_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: next, themeMode: mode });
    },
    language: localStorage.getItem('enterprise-pos-lang') || 'km',
    setLanguage: (lang) => {
      localStorage.setItem('enterprise-pos-lang', lang);
      set({ language: lang });
    },
    primaryColor: '#10b981',
    updatePrimaryColor: (color) => {
      set({ primaryColor: color });
    },
  };
});
