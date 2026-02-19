"use client";

import { create } from "zustand";
import type { DeliveryRequest, UrgencyLevel, User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CreateRequestInput {
  itemName: string;
  quantity: number;
  estimatedPrice: number;
  urgency: UrgencyLevel;
  notes?: string;
  imageUrl?: string;
  hostelBlock: string;
}

interface RequestState {
  requests: DeliveryRequest[];
  isLoading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  createRequest: (input: CreateRequestInput) => Promise<{ error: string | null }>;
  acceptRequest: (requestId: string) => Promise<{ error: string | null }>;
  updateRequestStatus: (requestId: string, status: DeliveryStatus) => Promise<{ error: string | null }>;
  fetchRequests: () => Promise<void>;
  subscribeToRequests: () => void;
  unsubscribeFromRequests: () => void;
}

// Helper function to convert database row to DeliveryRequest
function convertToDeliveryRequest(row: any, creatorProfile: any, acceptorProfile: any): DeliveryRequest {
  const creator: User = {
    id: creatorProfile.id,
    name: creatorProfile.name,
    email: creatorProfile.email,
    role: creatorProfile.role,
    avatar: creatorProfile.avatar,
    trustScore: creatorProfile.trust_score || 100,
    deliveries: creatorProfile.deliveries || 0,
    rating: Number(creatorProfile.rating) || 0,
    earnings: Number(creatorProfile.earnings) || 0,
  };

  const acceptor: User | undefined = acceptorProfile ? {
    id: acceptorProfile.id,
    name: acceptorProfile.name,
    email: acceptorProfile.email,
    role: acceptorProfile.role,
    avatar: acceptorProfile.avatar,
    trustScore: acceptorProfile.trust_score || 100,
    deliveries: acceptorProfile.deliveries || 0,
    rating: Number(acceptorProfile.rating) || 0,
    earnings: Number(acceptorProfile.earnings) || 0,
  } : undefined;

  return {
    id: row.id,
    itemName: row.item_name,
    quantity: row.quantity,
    estimatedPrice: Number(row.estimated_price),
    urgency: row.urgency,
    notes: row.notes || undefined,
    imageUrl: row.image_url || undefined,
    status: row.status,
    hostelBlock: row.hostel_block,
    createdBy: creator,
    acceptedBy: acceptor,
    createdAt: row.created_at,
    reward: Number(row.reward),
  };
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  channel: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();

    try {
      // Fetch requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("delivery_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        set({ requests: [], isLoading: false });
        return;
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      requestsData.forEach((req: any) => {
        if (req.created_by) userIds.add(req.created_by);
        if (req.accepted_by) userIds.add(req.accepted_by);
      });

      // Fetch all profiles at once
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) throw profilesError;

      // Create a map of profiles by ID
      const profilesMap = new Map();
      (profilesData || []).forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });

      // Convert to app format
      const requests: DeliveryRequest[] = requestsData.map((row: any) => {
        const creatorProfile = profilesMap.get(row.created_by);
        const acceptorProfile = row.accepted_by ? profilesMap.get(row.accepted_by) : null;
        
        return convertToDeliveryRequest(
          row,
          creatorProfile,
          acceptorProfile
        );
      });

      set({ requests, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  subscribeToRequests: () => {
    const supabase = createClient();
    const channel = supabase
      .channel("delivery_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_requests",
        },
        async (payload) => {
          // Refetch requests when changes occur
          await get().fetchRequests();
        }
      )
      .subscribe();

    set({ channel });
  },

  unsubscribeFromRequests: () => {
    const { channel } = get();
    if (channel) {
      const supabase = createClient();
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },

  createRequest: async (input) => {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Calculate reward
    const reward = Math.round(input.estimatedPrice * 0.15) + 10;

    try {
      const { data, error } = await supabase
        .from("delivery_requests")
        .insert({
          item_name: input.itemName,
          quantity: input.quantity,
          estimated_price: input.estimatedPrice,
          urgency: input.urgency,
          notes: input.notes || null,
          image_url: input.imageUrl || null,
          hostel_block: input.hostelBlock,
          reward: reward,
          created_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Refetch requests to get the new one with user data
      await get().fetchRequests();

      return { error: null };
    } catch (error: any) {
      console.error("Error creating request:", error);
      return { error: error.message };
    }
  },

  acceptRequest: async (requestId: string) => {
    const supabase = createClient();
    
    // Get current user (dayscholar who is accepting)
    const { data: { user: dayscholar } } = await supabase.auth.getUser();
    if (!dayscholar) {
      return { error: "Not authenticated" };
    }

    try {
      // First get the request to get the hosteller (created_by)
      const { data: requestData, error: fetchError } = await supabase
        .from("delivery_requests")
        .select("created_by, item_name")
        .eq("id", requestId)
        .eq("status", "pending")
        .single();

      if (fetchError || !requestData) {
        return { error: "Request not found or already accepted" };
      }

      const hostellerId = requestData.created_by;

      // Update request: set accepted_by (dayscholar) and status
      const { error: updateError } = await supabase
        .from("delivery_requests")
        .update({
          accepted_by: dayscholar.id,
          status: "in_progress",
        })
        .eq("id", requestId)
        .eq("status", "pending");

      if (updateError) throw updateError;

      // Create chat room between hosteller and dayscholar
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from("chat_rooms")
        .insert({
          request_id: requestId,
          created_by: hostellerId,      // Hosteller who made the request
          accepted_by: dayscholar.id,   // Dayscholar who accepted
        })
        .select("id")
        .single();

      // If room already exists (from trigger or duplicate), fetch it
      let roomId = chatRoom?.id;
      if (chatRoomError) {
        if (chatRoomError.code === "23505") {
          // Unique violation - room already exists, fetch it
          const { data: existingRoom } = await supabase
            .from("chat_rooms")
            .select("id")
            .eq("request_id", requestId)
            .single();
          roomId = existingRoom?.id;
        } else {
          console.error("Error creating chat room:", chatRoomError);
        }
      }

      // Add system message when chat room is created
      if (roomId) {
        await supabase.from("chat_messages").insert({
          room_id: roomId,
          sender_id: dayscholar.id,
          type: "system",
          content: "A day scholar accepted your delivery request. You can now chat to coordinate the delivery.",
        });
      }

      // Refetch requests to get updated data
      await get().fetchRequests();

      return { error: null };
    } catch (error: any) {
      console.error("Error accepting request:", error);
      return { error: error.message };
    }
  },

  updateRequestStatus: async (requestId: string, status: DeliveryStatus) => {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    try {
      // Verify user has permission to update this request
      const { data: requestData, error: fetchError } = await supabase
        .from("delivery_requests")
        .select("created_by, accepted_by")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Only creator or acceptor can update status
      if (requestData.created_by !== user.id && requestData.accepted_by !== user.id) {
        return { error: "Not authorized to update this request" };
      }

      // Update status
      const { error: updateError } = await supabase
        .from("delivery_requests")
        .update({ status })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Also update chat room status if it exists
      await supabase
        .from("chat_rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("request_id", requestId);

      // Refetch requests to get updated data
      await get().fetchRequests();

      return { error: null };
    } catch (error: any) {
      console.error("Error updating request status:", error);
      return { error: error.message };
    }
  },
}));
