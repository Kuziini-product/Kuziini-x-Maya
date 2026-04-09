"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store";

export function OnlinePing() {
  const { userSession } = useSessionStore();

  useEffect(() => {
    if (!userSession?.phone) return;

    function ping() {
      fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ping", phone: userSession!.phone }),
      }).catch(() => {});
    }

    // Ping immediately
    ping();

    // Ping every 60 seconds
    const interval = setInterval(ping, 60_000);

    return () => clearInterval(interval);
  }, [userSession?.phone]);

  return null;
}

