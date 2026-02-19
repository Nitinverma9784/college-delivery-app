"use client";

import { create } from "zustand";

interface UIState {
  darkMode: boolean;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  darkMode: false,
  toggleTheme: () => {
    set((state) => {
      const next = !state.darkMode;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }
      return { darkMode: next };
    });
  },
}));
