"use client";

import { create } from "zustand";
import type { User, UserRole } from "@/lib/types";
import { mockUser, mockDayScholar } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  selectRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (_email: string, _password: string) => {
    // Mock login - simulate API call
    set({ user: mockUser, isAuthenticated: true });
  },
  signup: (name: string, email: string, _password: string) => {
    const newUser: User = {
      ...mockUser,
      name,
      email,
      role: "hosteller",
    };
    set({ user: newUser, isAuthenticated: true });
  },
  selectRole: (role: UserRole) => {
    set((state) => {
      if (!state.user) return state;
      const baseUser = role === "dayscholar" ? mockDayScholar : mockUser;
      return {
        user: { ...baseUser, name: state.user.name, email: state.user.email, role },
      };
    });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
