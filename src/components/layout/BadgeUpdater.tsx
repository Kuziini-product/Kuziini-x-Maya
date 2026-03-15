"use client";

import { useEffect } from "react";

export function BadgeUpdater() {
  useEffect(() => {
    // Only run in standalone/PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (!isStandalone) return;

    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    if (!nav.setAppBadge) return;

    async function updateBadge() {
      try {
        const res = await fetch("/api/access-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getUnread" }),
        });
        const json = await res.json();
        if (json.success && json.unread > 0) {
          await nav.setAppBadge?.(json.unread);
        } else {
          await nav.clearAppBadge?.();
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
