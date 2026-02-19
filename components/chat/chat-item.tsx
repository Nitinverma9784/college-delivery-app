"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, Check, X, IndianRupee, Info, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface ChatItemProps {
  message: ChatMessage;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const ChatItem = ({ message, isOwn, senderName, senderAvatar }: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditing(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setEditValue(message.content);
  }, [message.content]);

  const handleEdit = async () => {
    if (!editValue.trim() || editValue === message.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const supabase = createClient();
    await supabase
      .from("chat_messages")
      .update({ content: editValue, updated_at: new Date().toISOString() })
      .eq("id", message.id);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const supabase = createClient();
    // Soft-delete: set content to "[deleted]" and mark deleted
    await supabase
      .from("chat_messages")
      .update({ content: "[This message was deleted]", deleted: true })
      .eq("id", message.id);
  };

  // ── system message ────────────────────────────────────────────────
  if (message.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-1.5 py-1"
      >
        <Info className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{message.content}</span>
      </motion.div>
    );
  }

  // ── price confirmation message ────────────────────────────────────
  if (message.type === "price_confirmation") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
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
          <p className="mt-1 text-xs text-muted-foreground">{message.content}</p>
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

  // ── image message ─────────────────────────────────────────────────
  if (message.type === "image") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[240px] overflow-hidden rounded-2xl",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground",
          )}
        >
          {message.imageUrl ? (
            <img
              src={message.imageUrl}
              alt={message.content}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {message.content && (
            <p className="px-3 py-2 text-xs">{message.content}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // ── text message ──────────────────────────────────────────────────
  const isDeleted = (message as any).deleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex gap-2 px-4 py-1",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
          {senderName?.charAt(0) || "?"}
        </div>
      )}

      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {!isOwn && senderName && (
          <span className="mb-0.5 text-xs font-medium text-muted-foreground px-1">
            {senderName}
          </span>
        )}

        {/* Edit mode */}
        {isEditing && isOwn ? (
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className="bg-transparent text-sm outline-none w-48"
            />
            <button onClick={handleEdit} disabled={isSaving} className="text-primary">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setIsEditing(false)} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "max-w-[75vw] rounded-2xl px-4 py-2.5",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border text-foreground rounded-bl-md",
              isDeleted && "opacity-60 italic",
            )}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            <p
              className={cn(
                "mt-1 text-[10px]",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {(message as any).updated_at &&
                (message as any).updated_at !== message.timestamp && (
                  <span className="ml-1">(edited)</span>
                )}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons (own messages only, on hover) — mirrors strikes-community ChatItem edit/delete */}
      {isOwn && !isDeleted && !isEditing && (
        <div
          className={cn(
            "absolute top-0 hidden group-hover:flex items-center gap-1 bg-card border border-border rounded-lg px-1 py-0.5 shadow-sm",
            isOwn ? "right-14" : "left-14",
          )}
        >
          <button
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive p-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ChatItem;
