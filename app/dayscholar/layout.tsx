"use client";

import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function DayScholarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNavigation />
    </>
  );
}
