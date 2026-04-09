"use client";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Auto-refresh when app becomes visible (returning from background)
    let lastHidden = 0;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHidden = Date.now();
      } else if (document.visibilityState === "visible" && lastHidden > 0) {
        // Refresh if was hidden for more than 30 seconds
        if (Date.now() - lastHidden > 30_000) {
          window.location.reload();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return null;
}

