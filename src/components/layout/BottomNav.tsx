"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, UtensilsCrossed, Receipt, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";

interface BottomNavProps {
  umbrellaId: string;
}

export function BottomNav({ umbrellaId }: BottomNavProps) {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());

  const base = `/u/${umbrellaId}`;

  const links = [
    { href: "/", label: "K×L", icon: Sparkles, exact: true },
    { href: base, label: "Acasă", icon: Home, exact: true },
    { href: `${base}/menu`, label: "Meniu", icon: UtensilsCrossed },
    {
      href: `${base}/cart`,
      label: "Coș",
      icon: ShoppingBag,
      badge: itemCount > 0 ? itemCount : undefined,
    },
    { href: `${base}/orders`, label: "Comenzi", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06] pb-safe">
      <div className="flex items-center justify-around px-1 pt-2 pb-2">
        {links.map(({ href, label, icon: Icon, badge, exact }) => {
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
                {badge !== undefined && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#C9AB81] text-[#0A0A0A] text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
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
