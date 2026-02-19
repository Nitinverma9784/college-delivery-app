"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PlusCircle, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";

const hostellerNav = [
  { href: "/hosteller/home", icon: Home, label: "Home" },
  { href: "/hosteller/request", icon: PlusCircle, label: "Request" },
  { href: "/chat", icon: MessageCircle, label: "Chats" },
  { href: "/profile", icon: User, label: "Profile" },
];

const dayscholarNav = [
  { href: "/dayscholar/home", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chats" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const navItems = user?.role === "dayscholar" ? dayscholarNav : hostellerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
