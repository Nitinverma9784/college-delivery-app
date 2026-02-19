"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, IndianRupee, Clock, MapPin, User } from "lucide-react";
import { GlassHeader } from "@/components/layout/glass-header";
import { PageContainer } from "@/components/layout/page-container";
import { DeliveryTimeline } from "@/components/common/delivery-progress";
import { UrgencyBadge } from "@/components/common/status-badge";
import { useRequestStore } from "@/lib/stores/request-store";

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const requests = useRequestStore((s) => s.requests);
  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <PageContainer>
        <GlassHeader title="Order Details" showBack />
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-24">
          <p className="text-lg font-semibold text-foreground">
            Order not found
          </p>
          <Link
            href="/hosteller/home"
            className="text-sm font-medium text-primary"
          >
            Go back home
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <GlassHeader
        title="Order Details"
        showBack
        rightAction={
          request.acceptedBy && (
            <Link
              href={`/chat/${request.id}`}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Link>
          )
        }
      />

      <div className="space-y-6 px-5 py-5">
        {/* Item Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {request.itemName}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <UrgencyBadge urgency={request.urgency} />
                <span className="text-xs text-muted-foreground">
                  Qty: {request.quantity}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-lg font-bold text-primary">
              <IndianRupee className="h-4 w-4" />
              {request.estimatedPrice}
            </div>
          </div>

          {request.notes && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {request.notes}
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {request.hostelBlock}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(request.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              Reward: {request.reward}
            </span>
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Delivery Status
          </h3>
          <DeliveryTimeline status={request.status} />
        </motion.div>

        {/* Delivery Person */}
        {request.acceptedBy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Delivery Person
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {request.acceptedBy.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rating: {request.acceptedBy.rating} | {request.acceptedBy.deliveries} deliveries
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}
