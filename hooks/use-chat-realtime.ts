"use client";

import { useEffect } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";

type ChatRealtimeProps = {
  queryKey: string;
  roomId: string;
};

export const useChatRealtime = ({ queryKey, roomId }: ChatRealtimeProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();

    // "join-channel" equivalent: subscribe to the room's messages table
    const channel = supabase
      .channel(`chat:${roomId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const newMessage: ChatMessage = {
            id: row.id,
            roomId: row.room_id,
            senderId: row.sender_id,
            type: row.type,
            content: row.content,
            imageUrl: row.image_url || undefined,
            location: row.location || undefined,
            price: row.price ? Number(row.price) : undefined,
            timestamp: row.created_at,
          };

          // Mirrors strikes-community socket.on(addKey, ...) handler:
          // prepend the new message to the first page of the infinite query cache
          queryClient.setQueryData(
            [queryKey],
            (
              oldData:
                | InfiniteData<{ items: ChatMessage[]; nextCursor: string | null }>
                | undefined,
            ) => {
              if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                return {
                  pages: [{ items: [newMessage], nextCursor: null }],
                  pageParams: [undefined],
                };
              }

              // Deduplicate (message may already be in cache from optimistic update)
              const firstPage = oldData.pages[0];
              if (firstPage.items.some((m) => m.id === newMessage.id)) {
                return oldData;
              }

              return {
                ...oldData,
                pages: [
                  { ...firstPage, items: [newMessage, ...firstPage.items] },
                  ...oldData.pages.slice(1),
                ],
              };
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          // Mirrors strikes-community socket.on(updateKey, ...) handler
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const updatedMessage: ChatMessage = {
            id: row.id,
            roomId: row.room_id,
            senderId: row.sender_id,
            type: row.type,
            content: row.content,
            imageUrl: row.image_url || undefined,
            location: row.location || undefined,
            price: row.price ? Number(row.price) : undefined,
            timestamp: row.created_at,
          };

          queryClient.setQueryData(
            [queryKey],
            (
              oldData:
                | InfiniteData<{ items: ChatMessage[]; nextCursor: string | null }>
                | undefined,
            ) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.id === updatedMessage.id ? updatedMessage : item,
                  ),
                })),
              };
            },
          );
        },
      )
      .subscribe();

    // "leave-channel" equivalent: cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryKey, queryClient]);
};
