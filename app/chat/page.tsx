"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/page-container";
import { StatusBadge } from "@/components/common/status-badge";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryStatus } from "@/lib/types";

interface ChatRoomSummary {
  id: string;
  requestId: string;
  itemName: string;
  status: DeliveryStatus;
  partnerName: string;
  updatedAt: string;
}

export default function ChatListPage() {
  const user = useAuthStore((s) => s.user);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch all chat rooms where user is a participant
      const { data: roomData } = await supabase
        .from("chat_rooms")
        .select("*")
        .or(`created_by.eq.${user.id},accepted_by.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!roomData || roomData.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      // Batch-fetch request details
      const requestIds = roomData.map((r: any) => r.request_id);
      const { data: requests } = await supabase
        .from("delivery_requests")
        .select("id, item_name, status")
        .in("id", requestIds);

      // Batch-fetch partner profiles
      const partnerIds = roomData
        .map((r: any) => (r.created_by === user.id ? r.accepted_by : r.created_by))
        .filter(Boolean) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", partnerIds);

      const requestsMap = new Map((requests ?? []).map((r: any) => [r.id, r]));
      const profilesMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const summaries: ChatRoomSummary[] = roomData.map((r: any) => {
        const req = requestsMap.get(r.request_id);
        const partnerId = r.created_by === user.id ? r.accepted_by : r.created_by;
        const partner = profilesMap.get(partnerId);
        return {
          id: r.id,
          requestId: r.request_id,
          itemName: req?.item_name ?? "Unknown Item",
          status: (req?.status ?? "in_progress") as DeliveryStatus,
          partnerName: partner?.name ?? "Unknown User",
          updatedAt: r.updated_at,
        };
      });

      setRooms(summaries);
      setLoading(false);
    };

    fetchRooms();
  }, [user]);

  return (
    <PageContainer>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-foreground">Chats</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {user?.role === "hosteller" ? "Your active delivery chats" : "Deliveries you're handling"}
        </p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No active chats</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              {user?.role === "hosteller"
                ? "Chats appear here once a day scholar accepts your request."
                : "Accept a delivery request to start chatting."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room, i) => (
              <motion.li
                key={room.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/chat/${room.id}`} className="block">
                  <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{room.itemName}</p>
                      <p className="text-sm text-muted-foreground truncate">{room.partnerName}</p>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
