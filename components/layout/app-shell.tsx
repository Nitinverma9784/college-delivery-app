"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      useUIStore.setState({ darkMode: true });
    }
  }, []);

  return <>{children}</>;
}
