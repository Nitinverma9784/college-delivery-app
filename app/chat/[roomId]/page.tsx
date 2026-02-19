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
} from "lucide-react";
import { GlassHeader } from "@/components/layout/glass-header";
import { PageContainer } from "@/components/layout/page-container";
import { DeliveryProgressPill } from "@/components/common/delivery-progress";
import { useChatStore } from "@/lib/stores/chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { quickReplies } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { activeRoom, messages, loadMessages, sendMessage } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(input.trim(), user.id);
    setInput("");
  };

  const handleQuickReply = (reply: string) => {
    if (!user) return;
    sendMessage(reply, user.id);
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
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

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
