import { defineStore } from 'pinia';

type Theme = 'light' | 'dark';

interface AppState {
  sidebarCollapsed: boolean;
  theme: Theme;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    theme: (localStorage.getItem('theme') as Theme) || 'light',
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    setTheme(theme: Theme) {
      this.theme = theme;
      localStorage.setItem('theme', theme);
    },
  },
});
