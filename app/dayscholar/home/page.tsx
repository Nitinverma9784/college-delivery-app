"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RequestCard } from "@/components/common/request-card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRequestStore } from "@/lib/stores/request-store";

export default function DayScholarHome() {
  const user = useAuthStore((s) => s.user);
  const { requests, acceptRequest } = useRequestStore();
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeRequests = requests.filter(
    (r) =>
      r.status !== "pending" &&
      r.status !== "delivered" &&
      r.acceptedBy?.id === user?.id
  );

  const handleAccept = (id: string) => {
    setAcceptedId(id);
    setTimeout(() => {
      acceptRequest(id);
      setAcceptedId(null);
    }, 800);
  };

  return (
    <PageContainer>
      <div className="px-5 pt-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            {getGreeting()}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-foreground">
            {user?.name?.split(" ")[0] || "Day Scholar"}
          </h1>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mt-5 flex gap-3"
        >
          <div className="flex-1 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Available
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {pendingRequests.length}
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Active
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {activeRequests.length}
            </p>
          </div>
        </motion.div>

        {/* Live Requests Feed */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Live Requests
          </h2>
          <p className="text-xs text-muted-foreground">
            Accept a request to start earning
          </p>

          <div className="mt-4 space-y-3">
            <AnimatePresence>
              {pendingRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-16 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      No requests right now
                    </p>
                    <p className="text-sm text-muted-foreground">
                      New requests will appear here in real-time
                    </p>
                  </div>
                </motion.div>
              ) : (
                pendingRequests.map((req, i) => (
                  <div key={req.id} className="relative">
                    <AnimatePresence>
                      {acceptedId === req.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/90"
                        >
                          <div className="flex items-center gap-2 text-primary-foreground">
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="text-base font-semibold">
                              Accepted!
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <RequestCard
                      request={req}
                      variant="dayscholar"
                      onAccept={handleAccept}
                      index={i}
                    />
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active Deliveries */}
        {activeRequests.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Active Deliveries
            </h2>
            <div className="mt-4 space-y-3">
              {activeRequests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  variant="dayscholar"
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
