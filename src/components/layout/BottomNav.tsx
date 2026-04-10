"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  umbrellaId: string;
}

export function BottomNav({ umbrellaId }: BottomNavProps) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const findAudio = () => {
      const el = document.getElementById("ambient-audio") as HTMLAudioElement | null;
      if (el) {
        audioRef.current = el;
        setPlaying(!el.paused);
        el.addEventListener("play", () => setPlaying(true));
        el.addEventListener("pause", () => setPlaying(false));
      }
    };
    findAudio();
    // Retry after a short delay in case AmbientSound mounts later
    const t = setTimeout(findAudio, 1000);
    return () => clearTimeout(t);
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const base = `/u/${umbrellaId}`;

  const links = [
    { href: `${base}/menu`, label: "Meniu", icon: UtensilsCrossed },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06] pb-safe">
      <div className="relative flex items-center justify-center px-1 pt-2 pb-2">
        {/* Speaker toggle - pinned left */}
        <button
          onClick={toggleAudio}
          className="absolute left-4 flex items-center justify-center w-9 h-9 text-white/30 active:text-white/50 transition-all duration-200"
        >
          {playing ? (
            <Volume2 className="w-5 h-5" strokeWidth={1.8} />
          ) : (
            <VolumeX className="w-5 h-5" strokeWidth={1.8} />
          )}
        </button>

        {/* Menu link - always centered */}
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 transition-all duration-200 relative",
                active
                  ? "text-[#C9AB81]"
                  : "text-white/30 active:text-white/50"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wider uppercase",
                  active ? "text-[#C9AB81]" : "text-white/30"
                )}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C9AB81] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

