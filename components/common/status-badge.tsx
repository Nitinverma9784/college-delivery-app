import { cn } from "@/lib/utils";
import type { DeliveryStatus, UrgencyLevel } from "@/lib/types";

const statusConfig: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  buying: {
    label: "Buying",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  on_the_way: {
    label: "On the Way",
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  delivered: {
    label: "Delivered",
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
};

const urgencyConfig: Record<
  UrgencyLevel,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  high: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const config = urgencyConfig[urgency];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
