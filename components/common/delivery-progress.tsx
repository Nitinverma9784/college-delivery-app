"use client";

import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/lib/types";
import { Clock, ShoppingBag, Truck, CheckCircle2, Package } from "lucide-react";

const steps: { status: DeliveryStatus; icon: React.ElementType; label: string }[] = [
  { status: "pending", icon: Clock, label: "Pending" },
  { status: "in_progress", icon: Package, label: "Accepted" },
  { status: "buying", icon: ShoppingBag, label: "Buying" },
  { status: "on_the_way", icon: Truck, label: "On the Way" },
  { status: "delivered", icon: CheckCircle2, label: "Delivered" },
];

const statusOrder: DeliveryStatus[] = [
  "pending",
  "in_progress",
  "buying",
  "on_the_way",
  "delivered",
];

export function DeliveryProgressPill({ status }: { status: DeliveryStatus }) {
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        return (
          <div key={step.status} className="flex items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <step.icon className="h-3.5 w-3.5" />
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 rounded-full transition-colors",
                  idx < currentIdx ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DeliveryTimeline({ status }: { status: DeliveryStatus }) {
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-8 w-0.5 transition-colors",
                    idx < currentIdx ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            <div className="flex flex-col justify-center pb-8 last:pb-0">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
