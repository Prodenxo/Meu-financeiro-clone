import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  initialized: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'financas-pessoais-theme';

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  initialized: false,
  toggleTheme: () => {
    set((state) => {
      const newDarkMode = !state.isDarkMode;
      // Aplicar tema ao documento
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Salvar no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDarkMode: newDarkMode }));
      return { isDarkMode: newDarkMode };
    });
  },
  initTheme: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isDark = parsed.isDarkMode || false;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ isDarkMode: isDark, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch (e) {
      console.error('Erro ao carregar tema:', e);
      set({ initialized: true });
    }
  },
}));

