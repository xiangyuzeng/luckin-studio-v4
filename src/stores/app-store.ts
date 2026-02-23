import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'cn';

interface AppState {
  sidebarOpen: boolean;
  locale: Locale;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      locale: 'en',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'luckin-app-store',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
