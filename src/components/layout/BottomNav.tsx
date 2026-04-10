"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Receipt, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  umbrellaId: string;
}

export function BottomNav({ umbrellaId }: BottomNavProps) {
  const pathname = usePathname();

  const base = `/u/${umbrellaId}`;

  const links = [
    { href: "/", label: "K×L", icon: Sparkles, exact: true },
    { href: `${base}/menu`, label: "Meniu", icon: UtensilsCrossed },
    { href: `${base}/bill`, label: "Nota", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06] pb-safe">
      <div className="flex items-center justify-around px-1 pt-2 pb-2">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);
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

