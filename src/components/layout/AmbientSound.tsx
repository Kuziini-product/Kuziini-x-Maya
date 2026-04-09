"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AmbientSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const startedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const audio = document.createElement("audio");
    audio.src = "/audio/beach-ambient.mp3";
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    // Show the button immediately so users can tap to unmute
    setVisible(true);

    const tryPlay = () => {
      if (startedRef.current) return;
      audio.play().then(() => {
        startedRef.current = true;
        setPlaying(true);
        // Remove listeners after success
        document.removeEventListener("click", tryPlay, true);
        document.removeEventListener("touchstart", tryPlay, true);
      }).catch(() => {
        // Browser blocked autoplay, will retry on next interaction
      });
    };

    // Try autoplay immediately (works on some desktop browsers)
    tryPlay();

    // Also listen for first interaction as fallback
    document.addEventListener("click", tryPlay, true);
    document.addEventListener("touchstart", tryPlay, true);

    return () => {
      document.removeEventListener("click", tryPlay, true);
      document.removeEventListener("touchstart", tryPlay, true);
      audio.pause();
      audio.src = "";
    };
  }, []);

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

  if (!visible) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className="fixed top-4 left-4 z-[9998] w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
      aria-label={playing ? "Oprește sunetul" : "Pornește sunetul"}
    >
      {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}

