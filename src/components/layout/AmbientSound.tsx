"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AmbientSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let mounted = true;

    const tryPlay = () => {
      if (!mounted || started) return;
      if (!audio) {
        audio = document.createElement("audio");
        audio.src = "/audio/beach-ambient.mp3";
        audio.loop = true;
        audio.volume = 0.3;
        audio.preload = "auto";
        audio.setAttribute("playsinline", "true");
        audioRef.current = audio;
      }
      const p = audio.play();
      if (p) {
        p.then(() => {
          if (!mounted) return;
          setStarted(true);
          setPlaying(true);
        }).catch(() => {
          // Not allowed yet, will retry on next interaction
        });
      }
    };

    // Try on every click/touch until it works
    const handler = () => tryPlay();
    document.addEventListener("click", handler, true);
    document.addEventListener("touchstart", handler, { passive: true, capture: true });

    return () => {
      mounted = false;
      document.removeEventListener("click", handler, true);
      document.removeEventListener("touchstart", handler);
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [started]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  if (!started) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className="fixed top-4 right-4 z-[9998] w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
      aria-label={playing ? "Oprește sunetul" : "Pornește sunetul"}
    >
      {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}
