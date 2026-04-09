"use client";
import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the event globally in case it fires before React mounts
let savedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    savedPrompt = e as BeforeInstallPromptEvent;
  });
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as unknown as { standalone: boolean }).standalone === true);
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("kuziini_install_dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // iOS detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes("macintosh") && "ontouchend" in document);
    setIsIos(isApple);

    if (isApple) {
      setShowBanner(true);
    }

    // Check if we already captured the prompt before React mounted
    if (savedPrompt) {
      setDeferredPrompt(savedPrompt);
      setShowBanner(true);
    }

    // Listen for future prompts (in case it hasn't fired yet)
    const handler = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      savedPrompt = evt;
      setDeferredPrompt(evt);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showBanner || dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        savedPrompt = null;
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem("kuziini_install_dismissed", String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999]">
      <div className="relative bg-[#1a1a1a] border border-[#C9AB81]/30 rounded-xl p-4 shadow-2xl shadow-black/60 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-[#C9AB81]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Instalează Kuziini</p>
            <p className="text-white/50 text-xs">Acces rapid de pe ecranul principal</p>
          </div>
        </div>

        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-xs tracking-[0.1em] uppercase rounded-lg"
          >
            Instalează aplicația
          </button>
        ) : isIos ? (
          <div className="mt-3 bg-white/5 rounded-lg p-3 space-y-2">
            <p className="text-white/50 text-[10px] text-center uppercase tracking-wider">Cum se instalează:</p>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
              <span>Apasă butonul</span>
              <Share className="w-4 h-4 text-[#C9AB81] shrink-0" />
              <span className="text-white/50">(jos în Safari)</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
              <span>Alege <span className="text-[#C9AB81] font-semibold">Add to Home Screen</span></span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#C9AB81] text-[#0A0A0A] flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
              <span>Apasă <span className="text-[#C9AB81] font-semibold">Add</span></span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

