"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryRequest } from "@/lib/types";
import { StatusBadge, UrgencyBadge } from "./status-badge";

interface RequestCardProps {
  request: DeliveryRequest;
  variant?: "hosteller" | "dayscholar";
  onAccept?: (id: string) => void;
  index?: number;
}

export function RequestCard({
  request,
  variant = "hosteller",
  onAccept,
  index = 0,
}: RequestCardProps) {
  const timeAgo = getTimeAgo(request.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {request.itemName}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <UrgencyBadge urgency={request.urgency} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
          <IndianRupee className="h-3.5 w-3.5" />
          {request.reward}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {variant === "dayscholar" && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {request.hostelBlock}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo}
        </span>
        <span>Qty: {request.quantity}</span>
        <span className="flex items-center gap-0.5">
          <IndianRupee className="h-3 w-3" />
          {request.estimatedPrice}
        </span>
      </div>

      {request.notes && (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {request.notes}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {variant === "hosteller" && (
          <Link
            href={`/hosteller/orders/${request.id}`}
            className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-center text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            View Details
          </Link>
        )}
        {variant === "dayscholar" && request.status === "pending" && onAccept && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAccept(request.id)}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Accept Request
          </motion.button>
        )}
        {variant === "dayscholar" && request.status !== "pending" && (
          <Link
            href={`/chat/${request.id}`}
            className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-center text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            Open Chat
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
