"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((s) => s.darkMode);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      useUIStore.setState({ darkMode: true });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}
