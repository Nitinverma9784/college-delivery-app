"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Package, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RequestCard } from "@/components/common/request-card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRequestStore } from "@/lib/stores/request-store";

export default function HostellerHome() {
  const user = useAuthStore((s) => s.user);
  const { requests, fetchRequests, subscribeToRequests, unsubscribeFromRequests, isLoading } = useRequestStore();

  // Fetch requests and subscribe to real-time updates
  useEffect(() => {
    fetchRequests();
    subscribeToRequests();

    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromRequests();
    };
  }, [fetchRequests, subscribeToRequests, unsubscribeFromRequests]);

  const myRequests = requests.filter(
    (r) => r.createdBy.id === user?.id
  );

  const greeting = getGreeting();

  return (
    <PageContainer>
      <div className="px-5 pt-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="mt-0.5 text-2xl font-bold text-foreground">
            {user?.name?.split(" ")[0] || "Hosteller"}
          </h1>
        </motion.div>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link href="/hosteller/request">
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Request an Item</h2>
                <p className="text-sm text-primary-foreground/80">
                  Get anything delivered to your hostel
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* AI Suggestions Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI Suggestions</span>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {["Maggi Noodles", "Phone Charger", "Cold Coffee", "Notebook"].map(
              (item) => (
                <Link
                  key={item}
                  href={`/hosteller/request?item=${encodeURIComponent(item)}`}
                  className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {item}
                </Link>
              )
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Orders
            </h2>
            <span className="text-xs text-muted-foreground">
              {myRequests.length} orders
            </span>
          </div>

          {isLoading && myRequests.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first delivery request
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {myRequests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  variant="hosteller"
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Active Chats - Show requests that have been accepted */}
        {myRequests.filter((r) => r.acceptedBy).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Active Chats
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Requests accepted by day scholars
            </p>
            <div className="mt-4 space-y-3">
              {myRequests
                .filter((r) => r.acceptedBy && r.status !== "delivered")
                .map((req, i) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    variant="hosteller"
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
