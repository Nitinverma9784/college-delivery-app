"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  IndianRupee,
  Info,
  Video,
  Phone,
  PhoneOff,
} from "lucide-react";
import { GlassHeader } from "@/components/layout/glass-header";
import { PageContainer } from "@/components/layout/page-container";
import { DeliveryProgressPill } from "@/components/common/delivery-progress";
import { useChatStore } from "@/lib/stores/chat-store";
import { useRequestStore } from "@/lib/stores/request-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { quickReplies } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useWebRTC } from "@/hooks/use-webrtc";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const {
    activeRoom,
    messages,
    isLoading,
    loadRoom,
    loadMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { updateRequestStatus } = useRequestStore();
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get other user ID for WebRTC
  const otherUserId = activeRoom?.participants?.find((id) => id !== user?.id) || "";

  // WebRTC hook
  const {
    localVideoRef,
    remoteVideoRef,
    isCallActive,
    isCallIncoming,
    isCallOutgoing,
    startCall,
    answerCall,
    endCall,
  } = useWebRTC(activeRoom?.id || "", user?.id || "", otherUserId);

  // Load room and messages when roomId changes
  useEffect(() => {
    if (roomId) {
      loadRoom(roomId);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [roomId, loadRoom]);

  // Subscribe to messages when room is loaded
  useEffect(() => {
    if (activeRoom?.id) {
      loadMessages(activeRoom.id);
      subscribeToMessages(activeRoom.id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [activeRoom?.id, loadMessages, subscribeToMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activeRoom) return;
    await sendMessage(input.trim());
    setInput("");
  };

  const handleQuickReply = async (reply: string) => {
    if (!user || !activeRoom) return;
    await sendMessage(reply);
  };

  const handleMarkDelivered = async () => {
    if (!activeRoom || !user) return;

    // Only dayscholar (acceptor) can mark as delivered
    if (user.role !== "dayscholar") return;

    setMarkingDelivered(true);
    const result = await updateRequestStatus(activeRoom.requestId, "delivered");

    if (result.error) {
      console.error("Error marking as delivered:", result.error);
      setMarkingDelivered(false);
      return;
    }

    // Send system message
    await sendMessage("Order marked as delivered", "system");
    setMarkingDelivered(false);
  };

  return (
    <PageContainer bottomNav={false} className="flex flex-col !min-h-screen">
      <GlassHeader
        title={activeRoom?.itemName || "Chat"}
        subtitle={activeRoom ? `Request #${activeRoom.requestId}` : undefined}
        showBack
        rightAction={
          activeRoom && (
            <div className="flex items-center gap-2">
              <DeliveryProgressPill status={activeRoom.status} />
            </div>
          )
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : !activeRoom ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-center font-medium text-foreground">
              Chat room not found
            </p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {user?.role === "hosteller" 
                ? "Wait for a day scholar to accept your request"
                : "This request hasn't been accepted yet"}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mark as Delivered Button - Only for dayscholar when status is not delivered */}
      {user?.role === "dayscholar" && 
       activeRoom && 
       activeRoom.status !== "delivered" && 
       activeRoom.status !== "pending" && (
        <div className="border-t border-border bg-card px-4 py-3">
          <Button
            onClick={handleMarkDelivered}
            disabled={markingDelivered}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {markingDelivered ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Marking as delivered...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Mark as Delivered
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Quick Reply Chips */}
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

      {/* Video Call UI */}
      {(showVideoCall || isCallActive) && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex h-full flex-col">
            {/* Remote Video */}
            <div className="relative flex-1 bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {/* Local Video (Picture-in-Picture) */}
              {localVideoRef.current?.srcObject && (
                <div className="absolute bottom-4 right-4 w-32 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {/* Call Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <Button
                  onClick={() => {
                    endCall();
                    setShowVideoCall(false);
                  }}
                  className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Notification */}
      {isCallIncoming && !showVideoCall && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Incoming Call</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeRoom?.itemName}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  answerCall();
                  setShowVideoCall(true);
                }}
                className="flex-1 bg-primary"
              >
                Answer
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Call Notification */}
      {isCallOutgoing && !showVideoCall && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card p-6 shadow-lg text-center">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold">Calling...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeRoom?.itemName}
            </p>
            <Button
              onClick={endCall}
              variant="destructive"
              className="mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Send image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Send location"
          >
            <MapPin className="h-5 w-5" />
          </button>
          {activeRoom && activeRoom.participants?.length === 2 && (
            <button
              onClick={() => {
                startCall();
                setShowVideoCall(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
              aria-label="Start video call"
              disabled={isCallActive || isCallOutgoing || isCallIncoming}
            >
              <Video className="h-5 w-5" />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="h-10 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </PageContainer>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  if (message.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-1.5 py-1"
      >
        <Info className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{message.content}</span>
      </motion.div>
    );
  }

  if (message.type === "price_confirmation") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-[280px]"
      >
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <IndianRupee className="h-3 w-3" />
            Price Confirmation
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            <IndianRupee className="inline h-5 w-5" />
            {message.price}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {message.content}
          </p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground">
              Confirm
            </button>
            <button className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground">
              Negotiate
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (message.type === "image") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[240px] overflow-hidden rounded-2xl",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          )}
        >
          <div className="flex h-32 items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="px-3 py-2 text-xs">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
