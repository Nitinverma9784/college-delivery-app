"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Send, Loader2, Smile } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MessageType } from "@/lib/types";

interface ChatInputProps {
  roomId: string;
  currentUserId: string;
  placeholder?: string;
  onMessageSent?: () => void;
}

const formSchema = z.object({
  content: z.string().min(1),
});

const ChatInput = ({
  roomId,
  currentUserId,
  placeholder = "Type a message...",
  onMessageSent,
}: ChatInputProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  });

  const isLoading = form.formState.isSubmitting;

  // Mirrors strikes-community ChatInput onSubmit — send message then reset form
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const supabase = createClient();

    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: currentUserId,
      type: "text" as MessageType,
      content: values.content.trim(),
    });

    if (!error) {
      form.reset();
      onMessageSent?.();
    } else {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="sticky bottom-0 border-t border-border bg-card px-4 py-3 safe-area-bottom"
    >
      <div className="relative flex items-center gap-x-3 bg-background rounded-2xl border border-border px-2 py-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/20">
        {/* Attachment stub — mirrors the Plus button in strikes-community */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground"
          aria-label="Attach file"
        >
          <Plus className="h-4 w-4 transition-transform hover:rotate-90" />
        </button>

        <input
          type="text"
          autoComplete="off"
          disabled={isLoading}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          {...form.register("content")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              form.handleSubmit(onSubmit)();
            }
          }}
        />

        {/* Send button — shown only when there's content, mirrors strikes-community pattern */}
        {form.watch("content")?.trim() && (
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all active:scale-90"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default ChatInput;
