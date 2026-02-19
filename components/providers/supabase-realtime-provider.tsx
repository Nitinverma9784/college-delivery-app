"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeContextType = {
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
});

export const useRealtime = () => useContext(RealtimeContext);

export const SupabaseRealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Presence channel acts as the connection health-check – mirrors the
    // strikes-community socket.on("connect") / socket.on("disconnect") pattern
    const presenceChannel = supabase.channel("presence:app", {
      config: { presence: { key: "health" } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    setChannel(presenceChannel);

    return () => {
      supabase.removeChannel(presenceChannel);
      setIsConnected(false);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};
