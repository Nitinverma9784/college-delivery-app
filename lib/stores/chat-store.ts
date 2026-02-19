"use client";

import { create } from "zustand";
import type { ChatMessage, ChatRoom } from "@/lib/types";
import { mockMessages, mockChatRoom } from "@/lib/mock-data";

interface ChatState {
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  setActiveRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string, senderId: string) => void;
  loadMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoom: null,
  messages: [],
  setActiveRoom: (room) => set({ activeRoom: room }),
  sendMessage: (content, senderId) => {
    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      roomId: mockChatRoom.id,
      senderId,
      type: "text",
      content,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },
  loadMessages: () => {
    set({ messages: mockMessages, activeRoom: mockChatRoom });
  },
}));
