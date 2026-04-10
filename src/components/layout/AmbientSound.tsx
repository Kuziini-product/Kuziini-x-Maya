"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function AmbientSound() {
  const startedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const audio = document.createElement("audio");
    audio.src = "/audio/beach-ambient.mp3";
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");

    setVisible(true);

    const tryPlay = () => {
      if (startedRef.current) return;
      audio.play().then(() => {
        startedRef.current = true;
        document.removeEventListener("click", tryPlay, true);
        document.removeEventListener("touchstart", tryPlay, true);
      }).catch(() => {});
    };

    tryPlay();
    document.addEventListener("click", tryPlay, true);
    document.addEventListener("touchstart", tryPlay, true);

    return () => {
      document.removeEventListener("click", tryPlay, true);
      document.removeEventListener("touchstart", tryPlay, true);
      audio.pause();
      audio.src = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-[9998] w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
      aria-label="Pagina principală"
    >
      <Sparkles className="w-4 h-4" />
    </Link>
  );
}

