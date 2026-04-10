"use client";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Force update: unregister old SW, then register fresh
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).then(() => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    // Auto-refresh when app becomes visible (returning from background)
    let lastHidden = 0;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHidden = Date.now();
      } else if (document.visibilityState === "visible" && lastHidden > 0) {
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
