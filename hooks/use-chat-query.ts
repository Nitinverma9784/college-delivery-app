
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRealtime } from "@/components/providers/supabase-realtime-provider";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";

const PAGE_SIZE = 15;

interface ChatQueryProps {
  queryKey: string;
  roomId: string;
}

export const useChatQuery = ({ queryKey, roomId }: ChatQueryProps) => {
  const { isConnected } = useRealtime();

  const fetchMessages = async ({
    pageParam,
  }: {
    pageParam: string | undefined;
  }) => {
    const supabase = createClient();

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false }) // newest first for reverse rendering
      .limit(PAGE_SIZE);

    // Cursor: load messages older than the cursor timestamp
    if (pageParam) {
      query = query.lt("created_at", pageParam);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items: ChatMessage[] = (data || []).map((row: any) => ({
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      type: row.type,
      content: row.content,
      imageUrl: row.image_url || undefined,
      location: row.location || undefined,
      price: row.price ? Number(row.price) : undefined,
      timestamp: row.created_at,
    }));

    // Next cursor = the oldest item's timestamp (for loading earlier messages)
    const nextCursor =
      items.length === PAGE_SIZE ? items[items.length - 1].timestamp : null;

    return { items, nextCursor };
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [queryKey],
      queryFn: fetchMessages,
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      // When Supabase Realtime disconnects, fall back to polling every second
      // — mirrors the strikes-community pattern: refetchInterval: isConnected ? false : 1000
      refetchInterval: isConnected ? false : 1000,
    });

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, status };
};
