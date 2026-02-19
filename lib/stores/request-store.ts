"use client";

import { create } from "zustand";
import type { DeliveryRequest, UrgencyLevel } from "@/lib/types";
import { mockRequests, mockUser, mockDayScholar } from "@/lib/mock-data";

interface CreateRequestInput {
  itemName: string;
  quantity: number;
  estimatedPrice: number;
  urgency: UrgencyLevel;
  notes?: string;
  imageUrl?: string;
}

interface RequestState {
  requests: DeliveryRequest[];
  createRequest: (input: CreateRequestInput) => void;
  acceptRequest: (requestId: string) => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  requests: mockRequests,
  createRequest: (input) => {
    const newRequest: DeliveryRequest = {
      id: `r${Date.now()}`,
      ...input,
      status: "pending",
      hostelBlock: "Block A",
      createdBy: mockUser,
      createdAt: new Date().toISOString(),
      reward: Math.round(input.estimatedPrice * 0.15) + 10,
    };
    set((state) => ({ requests: [newRequest, ...state.requests] }));
  },
  acceptRequest: (requestId) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, status: "in_progress" as const, acceptedBy: mockDayScholar }
          : r
      ),
    }));
  },
}));
