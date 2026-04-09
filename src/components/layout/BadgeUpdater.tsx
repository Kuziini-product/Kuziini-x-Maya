"use client";

import { useEffect } from "react";

export function BadgeUpdater() {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    async function updateBadge() {
      try {
        const res = await fetch("/api/access-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getUnread" }),
        });
        const json = await res.json();
        if (json.success && json.unread > 0) {
          // Update page title with notification count
          const baseTitle = "Kuziini x LOFT";
          document.title = `(${json.unread}) ${baseTitle}`;
          // Try native badge API (works in Chrome desktop + PWA)
          nav.setAppBadge?.(json.unread).catch(() => {});
        } else {
          document.title = "Kuziini x LOFT";
          nav.clearAppBadge?.().catch(() => {});
        }
      } catch {
        // ignore
      }
    }

    // Update immediately
    updateBadge();

    // Poll every 30 seconds
    const interval = setInterval(updateBadge, 30_000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

