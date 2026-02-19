"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Star,
  Truck,
  IndianRupee,
  Shield,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Settings,
  Building2,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUserRole = useAuthStore((s) => s.updateUserRole);
  const { darkMode, toggleTheme } = useUIStore();
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === user?.role) return;

    setUpdatingRole(true);
    setRoleUpdateSuccess(false);

    const result = await updateUserRole(newRole);

    if (result.error) {
      console.error("Error updating role:", result.error);
      setUpdatingRole(false);
      return;
    }

    setRoleUpdateSuccess(true);
    setUpdatingRole(false);

    // Redirect to appropriate page based on new role
    setTimeout(() => {
      router.push(newRole === "hosteller" ? "/hosteller/home" : "/dayscholar/home");
    }, 1000);
  };

  if (!user) {
    return null;
  }

  const stats = [
    {
      icon: Truck,
      label: "Deliveries",
      value: user.deliveries,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: Star,
      label: "Rating",
      value: user.rating,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      icon: IndianRupee,
      label: "Earned",
      value: `${user.earnings}`,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <>
      <PageContainer>
        <div className="px-5 py-6 space-y-6">
          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-10 w-10" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">
              {user.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground capitalize">
              {user.role === "dayscholar" ? "Day Scholar" : "Hosteller"}
            </p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Trust Score: {user.trustScore}%
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    stat.color
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <h3 className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </h3>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                {darkMode ? (
                  <Moon className="h-4.5 w-4.5" />
                ) : (
                  <Sun className="h-4.5 w-4.5" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Dark Mode
                </p>
              </div>
              <div
                className={cn(
                  "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                  darkMode ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full bg-card shadow transition-transform",
                    darkMode ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </div>
            </button>

            <div className="mx-5 h-px bg-border" />

            {/* Role Selection */}
            <div className="px-5 py-4">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Your Role
              </Label>
              <RadioGroup
                value={user?.role || "hosteller"}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
                disabled={updatingRole}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="hosteller" id="hosteller" disabled={updatingRole} />
                  <Label htmlFor="hosteller" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Hosteller</div>
                      <div className="text-xs text-muted-foreground">I live on campus</div>
                    </div>
                  </Label>
                  {user?.role === "hosteller" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex items-center space-x-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="dayscholar" id="dayscholar" disabled={updatingRole} />
                  <Label htmlFor="dayscholar" className="flex items-center gap-2 cursor-pointer flex-1">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Day Scholar</div>
                      <div className="text-xs text-muted-foreground">I commute daily</div>
                    </div>
                  </Label>
                  {user?.role === "dayscholar" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </RadioGroup>
              {updatingRole && (
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Updating role...
                </p>
              )}
              {roleUpdateSuccess && (
                <p className="mt-2 text-xs text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Role updated! Redirecting...
                </p>
              )}
            </div>

            <div className="mx-5 h-px bg-border" />

            {/* Settings Link */}
            <button className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-accent">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <p className="flex-1 text-left text-sm font-medium text-foreground">
                App Settings
              </p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="mx-5 h-px bg-border" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <p className="flex-1 text-left text-sm font-medium text-destructive">
                Log Out
              </p>
            </button>
          </motion.div>
        </div>
      </PageContainer>
      <BottomNavigation />
    </>
  );
}
