"use client";

import { create } from "zustand";
import type { ChatMessage, ChatRoom, MessageType, DeliveryStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatState {
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  setActiveRoom: (room: ChatRoom | null) => void;
  loadRoom: (requestId: string) => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (content: string, type?: MessageType) => Promise<{ error: string | null }>;
  subscribeToMessages: (roomId: string) => void;
  unsubscribeFromMessages: () => void;
}

// Helper to convert database row to ChatMessage
function convertToChatMessage(row: any): ChatMessage {
  return {
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
}

// Helper to convert database row to ChatRoom
function convertToChatRoom(row: any, requestData: any): ChatRoom {
  return {
    id: row.id,
    requestId: row.request_id,
    participants: [row.created_by, row.accepted_by],
    itemName: requestData?.item_name || "Unknown Item",
    status: requestData?.status || "pending",
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeRoom: null,
  messages: [],
  isLoading: false,
  error: null,
  channel: null,

  setActiveRoom: (room) => set({ activeRoom: room }),

  loadRoom: async (requestId: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      // Fetch chat room by request_id
      const { data: roomData, error: roomError } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("request_id", requestId)
        .single();

      if (roomError && roomError.code !== "PGRST116") {
        // PGRST116 = not found, which is okay - room will be created when request is accepted
        throw roomError;
      }

      if (roomData) {
        // Fetch request data for room info
        const { data: requestData } = await supabase
          .from("delivery_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        const chatRoom = convertToChatRoom(roomData, requestData);
        set({ activeRoom: chatRoom, isLoading: false });
      } else {
        // Room doesn't exist yet - set active room to null but don't error
        set({ activeRoom: null, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error loading room:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  loadMessages: async (roomId: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const messages: ChatMessage[] = (messagesData || []).map(convertToChatMessage);
      set({ messages, isLoading: false });
    } catch (error: any) {
      console.error("Error loading messages:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (content: string, type: MessageType = "text") => {
    const supabase = createClient();
    const { activeRoom } = get();

    if (!activeRoom) {
      return { error: "No active chat room" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoom.id,
          sender_id: user.id,
          type,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state immediately
      const newMessage = convertToChatMessage(data);
      set((state) => ({ messages: [...state.messages, newMessage] }));

      return { error: null };
    } catch (error: any) {
      console.error("Error sending message:", error);
      return { error: error.message };
    }
  },

  subscribeToMessages: (roomId: string) => {
    const supabase = createClient();
    
    // Unsubscribe from previous channel
    get().unsubscribeFromMessages();

    const channel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = convertToChatMessage(payload.new);
            set((state) => {
              // Avoid duplicates
              if (state.messages.some((m) => m.id === newMessage.id)) {
                return state;
              }
              return { messages: [...state.messages, newMessage] };
            });
          }
        }
      )
      .subscribe();

    set({ channel });
  },

  unsubscribeFromMessages: () => {
    const { channel } = get();
    if (channel) {
      const supabase = createClient();
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));
