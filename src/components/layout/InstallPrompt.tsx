"use client";
import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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
      ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("kuziini_install_dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // iOS detection — covers iPhone, iPad, iPod
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua) || (ua.includes("macintosh") && "ontouchend" in document);
    setIsIos(isApple);

    if (isApple) {
      // On iOS, always show the banner with instructions
      setShowBanner(true);
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
          <div className="mt-3 bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
              <span>Apasă</span>
              <Share className="w-4 h-4 text-[#C9AB81]" />
              <span>apoi</span>
              <span className="text-[#C9AB81] font-semibold">&quot;Add to Home Screen&quot;</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
