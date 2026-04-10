"use client";
import { useEffect, useRef } from "react";

export function AmbientSound() {
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = document.createElement("audio");
    audio.src = "/audio/beach-ambient.mp3";
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audio.id = "ambient-audio";
    document.body.appendChild(audio);

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
      audio.remove();
    };
  }, []);

  return null;
}

