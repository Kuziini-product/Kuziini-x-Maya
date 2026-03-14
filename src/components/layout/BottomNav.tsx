"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, UtensilsCrossed, Receipt, Home } from "lucide-react";
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
    { href: base, label: "Acasă", icon: Home },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {links.map(({ href, label, icon: Icon, badge }) => {
          const active =
            href === base ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 relative",
                active
                  ? "text-ocean-600"
                  : "text-gray-400 hover:text-gray-600"
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
                  <span className="absolute -top-1.5 -right-1.5 bg-coral-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold font-body",
                  active ? "text-ocean-600" : "text-gray-400"
                )}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-ocean-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
