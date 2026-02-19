"use client";

// Refactored to use strikes-community chat architecture:
//   ChatHeader    — adapted from strikes-community chat-header.tsx
//   ChatMessages  — strikes-community infinite scroll + React Query + Realtime
//   ChatInput     — adapted from strikes-community chat-input.tsx (react-hook-form/zod)

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Phone, PhoneOff } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";

import { useRequestStore } from "@/lib/stores/request-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { quickReplies } from "@/lib/mock-data";
import { useWebRTC } from "@/hooks/use-webrtc";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryStatus } from "@/lib/types";

// ─── Local types ──────────────────────────────────────────────────────────────
interface ChatRoom {
  id: string;
  requestId: string;
  participants: string[];
  itemName: string;
  status: DeliveryStatus;
  createdBy: string;
  acceptedBy: string | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { updateRequestStatus } = useRequestStore();
  const user = useAuthStore((s) => s.user);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomNotAccepted, setRoomNotAccepted] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const otherUserId = room?.participants?.find((id) => id !== user?.id) ?? "";

  const {
    localVideoRef,
    remoteVideoRef,
    isCallActive,
    isCallIncoming,
    isCallOutgoing,
    startCall,
    answerCall,
    endCall,
  } = useWebRTC(room?.id ?? "", user?.id ?? "", otherUserId);

  // Load chat room.
  // roomId may be:
  //   (a) chat_rooms.id           — from /chat list page
  //   (b) delivery_requests.id    — from request-card "View Chat" or dayscholar after accept
  useEffect(() => {
    if (!roomId) return;
    setRoomNotAccepted(false);

    const load = async () => {
      setLoadingRoom(true);
      const supabase = createClient();

      // ── 1. Try chat_rooms.id ──────────────────────────────────────
      const { data: byId } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      // ── 2. Try chat_rooms.request_id ─────────────────────────────
      let roomRow =
        byId ??
        (
          await supabase
            .from("chat_rooms")
            .select("*")
            .eq("request_id", roomId)
            .maybeSingle()
        ).data;

      // ── 3. Room not found — check delivery_requests directly ─────
      if (!roomRow) {
        const { data: deliveryReq } = await supabase
          .from("delivery_requests")
          .select("id, item_name, status, created_by, accepted_by")
          .eq("id", roomId)
          .maybeSingle();

        if (deliveryReq) {
          if (!deliveryReq.accepted_by) {
            // Request exists but hasn't been accepted yet
            setRoomNotAccepted(true);
            setLoadingRoom(false);
            return;
          }

          // Request is accepted — create chat room on-the-fly
          const { data: newRoom, error: insertErr } = await supabase
            .from("chat_rooms")
            .insert({
              request_id: deliveryReq.id,
              created_by: deliveryReq.created_by,
              accepted_by: deliveryReq.accepted_by,
            })
            .select()
            .single();

          if (!insertErr && newRoom) {
            // Insert welcome system message
            await supabase.from("chat_messages").insert({
              room_id: newRoom.id,
              sender_id: deliveryReq.accepted_by,
              type: "system",
              content: "Chat started. Your order is being processed! 🛍️",
            });
            roomRow = newRoom;
          } else if (insertErr?.code === "23505") {
            // Race condition — row was just created, re-fetch it
            const { data: existingRoom } = await supabase
              .from("chat_rooms")
              .select("*")
              .eq("request_id", deliveryReq.id)
              .maybeSingle();
            roomRow = existingRoom ?? null;
          }
        }
      }

      // ── 4. Build room state ───────────────────────────────────────
      if (roomRow) {
        const { data: req } = await supabase
          .from("delivery_requests")
          .select("item_name, status")
          .eq("id", roomRow.request_id)
          .maybeSingle();
        setRoom({
          id: roomRow.id,
          requestId: roomRow.request_id,
          participants: [roomRow.created_by, roomRow.accepted_by].filter(
            Boolean,
          ) as string[],
          itemName: req?.item_name ?? "Unknown Item",
          status: (req?.status ?? "pending") as DeliveryStatus,
          createdBy: roomRow.created_by,
          acceptedBy: roomRow.accepted_by ?? null,
        });
      }
      setLoadingRoom(false);
    };
    load();
  }, [roomId]);

  const handleQuickReply = async (reply: string) => {
    if (!user || !room) return;
    const supabase = createClient();
    await supabase
      .from("chat_messages")
      .insert({ room_id: room.id, sender_id: user.id, type: "text", content: reply });
  };

  const handleMarkDelivered = async () => {
    if (!room || !user || user.role !== "dayscholar") return;
    setMarkingDelivered(true);
    const result = await updateRequestStatus(room.requestId, "delivered");
    if (!result.error) {
      const supabase = createClient();
      await supabase.from("chat_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        type: "system",
        content: "Order marked as delivered ✓",
      });
    }
    setMarkingDelivered(false);
  };

  return (
    <PageContainer bottomNav={false} className="flex flex-col !min-h-screen">

      {/* Header — adapted from strikes-community ChatHeader */}
      <ChatHeader
        itemName={room?.itemName ?? "Chat"}
        requestId={room?.requestId}
        status={room?.status}
        onStartCall={
          room?.participants?.length === 2
            ? () => { startCall(); setShowVideoCall(true); }
            : undefined
        }
        callDisabled={isCallActive || isCallOutgoing || isCallIncoming}
        backHref="/"
      />

      {/* Messages — full strikes-community modular architecture */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {loadingRoom ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !room ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-medium text-foreground">
              {roomNotAccepted ? "Waiting for acceptance" : "Chat room not found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {roomNotAccepted
                ? "A day scholar hasn't accepted your request yet. Check back soon!"
                : user?.role === "hosteller"
                ? "This chat doesn't exist. Go back and open a chat from an accepted request."
                : "This request hasn't been accepted yet."}
            </p>
          </div>
        ) : (
          // ChatMessages owns: useChatQuery (infinite scroll) +
          //                     useChatRealtime (live updates) +
          //                     useChatScroll (auto-scroll / load-more)
          <ChatMessages
            roomId={room.id}
            currentUserId={user?.id ?? ""}
            itemName={room.itemName}
          />
        )}
      </div>

      {/* Mark as Delivered */}
      {user?.role === "dayscholar" &&
        room &&
        room.status !== "delivered" &&
        room.status !== "pending" && (
          <div className="border-t border-border bg-card px-4 py-3">
            <Button
              onClick={handleMarkDelivered}
              disabled={markingDelivered}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {markingDelivered ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Marking as delivered...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Mark as Delivered
                </span>
              )}
            </Button>
          </div>
        )}

      {/* Quick Reply Chips */}
      {room && (
        <div className="border-t border-border bg-card/50 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input — adapted from strikes-community ChatInput (react-hook-form + zod) */}
      {room && (
        <ChatInput
          roomId={room.id}
          currentUserId={user?.id ?? ""}
          placeholder={`Message about ${room.itemName}…`}
        />
      )}

      {/* Video Call Overlay */}
      {(showVideoCall || isCallActive) && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex h-full flex-col">
            <div className="relative flex-1 bg-black">
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              {localVideoRef.current?.srcObject && (
                <div className="absolute bottom-4 right-4 w-32 overflow-hidden rounded-lg border-2 border-white shadow-lg">
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                </div>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Button
                  onClick={() => { endCall(); setShowVideoCall(false); }}
                  className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 p-0"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call */}
      <AnimatePresence>
        {isCallIncoming && !showVideoCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          >
            <div className="rounded-2xl bg-card p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Incoming Call</h3>
              <p className="mt-1 text-sm text-muted-foreground">{room?.itemName}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => { answerCall(); setShowVideoCall(true); }} className="flex-1">Answer</Button>
                <Button onClick={endCall} variant="destructive" className="flex-1">Decline</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing Call */}
      <AnimatePresence>
        {isCallOutgoing && !showVideoCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          >
            <div className="rounded-2xl bg-card p-6 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-8 w-8 animate-pulse text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Calling...</h3>
              <p className="mt-1 text-sm text-muted-foreground">{room?.itemName}</p>
              <Button onClick={endCall} variant="destructive" className="mt-4">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
