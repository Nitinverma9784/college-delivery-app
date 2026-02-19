"use client";

import { create } from "zustand";
import type { User, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<{ error: string | null }>;
}

// Helper function to convert Supabase user to app User
function convertSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};
  const role = (metadata.role as UserRole) || "hosteller";

  return {
    id: supabaseUser.id,
    name: metadata.name || supabaseUser.email?.split("@")[0] || "User",
    email: supabaseUser.email || "",
    role: role,
    avatar: metadata.avatar,
    trustScore: metadata.trustScore || 100,
    deliveries: metadata.deliveries || 0,
    rating: metadata.rating || 0,
    earnings: metadata.earnings || 0,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch profile from database to get accurate role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const appUser: User = {
        id: user.id,
        name: profileData?.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: profileData?.role || user.user_metadata?.role || "hosteller",
        avatar: profileData?.avatar || user.user_metadata?.avatar,
        trustScore: profileData?.trust_score || user.user_metadata?.trustScore || 100,
        deliveries: profileData?.deliveries || user.user_metadata?.deliveries || 0,
        rating: Number(profileData?.rating) || user.user_metadata?.rating || 0,
        earnings: Number(profileData?.earnings) || user.user_metadata?.earnings || 0,
      };

      set({ user: appUser, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Fetch profile from database to get accurate role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const appUser: User = {
        id: data.user.id,
        name: profileData?.name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
        email: data.user.email || "",
        role: profileData?.role || data.user.user_metadata?.role || "hosteller",
        avatar: profileData?.avatar || data.user.user_metadata?.avatar,
        trustScore: profileData?.trust_score || data.user.user_metadata?.trustScore || 100,
        deliveries: profileData?.deliveries || data.user.user_metadata?.deliveries || 0,
        rating: Number(profileData?.rating) || data.user.user_metadata?.rating || 0,
        earnings: Number(profileData?.earnings) || data.user.user_metadata?.earnings || 0,
      };

      set({ user: appUser, isAuthenticated: true });
      return { error: null };
    }

    return { error: "Login failed" };
  },

  signup: async (name: string, email: string, password: string, role: UserRole) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const appUser = convertSupabaseUser(data.user);
      set({ user: appUser, isAuthenticated: true });
      return { error: null };
    }

    return { error: "Signup failed" };
  },

  updateUserRole: async (role: UserRole) => {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { error: "No user logged in" };
    }

    try {
      // Update user metadata in auth.users
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          role,
        },
      });

      if (authError) {
        return { error: authError.message };
      }

      // Update role in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", currentUser.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // Continue anyway as auth metadata is updated
      }

      // Refresh user data from both auth and profile
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();

      if (updatedUser) {
        // Also fetch profile to get latest data
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", updatedUser.id)
          .single();

        const appUser: User = {
          id: updatedUser.id,
          name: profileData?.name || updatedUser.user_metadata?.name || updatedUser.email?.split("@")[0] || "User",
          email: updatedUser.email || "",
          role: profileData?.role || updatedUser.user_metadata?.role || role,
          avatar: profileData?.avatar || updatedUser.user_metadata?.avatar,
          trustScore: profileData?.trust_score || updatedUser.user_metadata?.trustScore || 100,
          deliveries: profileData?.deliveries || updatedUser.user_metadata?.deliveries || 0,
          rating: Number(profileData?.rating) || updatedUser.user_metadata?.rating || 0,
          earnings: Number(profileData?.earnings) || updatedUser.user_metadata?.earnings || 0,
        };

        set({ user: appUser });
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error updating role:", error);
      return { error: error.message || "Failed to update role" };
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
