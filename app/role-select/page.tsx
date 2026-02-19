"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, GraduationCap, Package } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRole } from "@/lib/types";

const roles: {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    role: "hosteller",
    title: "Hosteller",
    description: "I live on campus and need items delivered to my hostel",
    icon: Building2,
  },
  {
    role: "dayscholar",
    title: "Day Scholar",
    description: "I commute daily and can pick up & deliver items",
    icon: GraduationCap,
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const selectRole = useAuthStore((s) => s.selectRole);

  const handleSelect = (role: UserRole) => {
    selectRole(role);
    router.push(role === "hosteller" ? "/hosteller/home" : "/dayscholar/home");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Choose your role
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select how you want to use CampusDrop
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {roles.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(r.role)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <r.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {r.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                  {r.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
