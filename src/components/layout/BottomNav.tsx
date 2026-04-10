"use client";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, Receipt, Volume2, VolumeX, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore, useSessionStore } from "@/store";

interface BottomNavProps {
  umbrellaId: string;
}

export function BottomNav({ umbrellaId }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const itemCount = useCartStore((s) => s.itemCount());
  const items = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const { userSession } = useSessionStore();
  const addOrder = useSessionStore((s) => s.addOrder);

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
  const isOnLanding = pathname === base || pathname === `${base}/`;
  const isOnMenu = pathname.startsWith(`${base}/menu`);
  const isOnCart = pathname.startsWith(`${base}/cart`);
  const isOnBill = pathname.startsWith(`${base}/bill`);

  // Track last visited section (not menu/landing) for forward button
  useEffect(() => {
    if (!isOnMenu && !isOnLanding) {
      sessionStorage.setItem(`last-section-${umbrellaId}`, pathname);
    }
  }, [pathname, isOnMenu, isOnLanding, umbrellaId]);

  // Hide nav on bill page when session is cleared (note was sent)
  if (isOnBill && !userSession) return null;

  const handleAction = useCallback(async () => {
    if (isOnLanding) {
      router.push(`${base}/menu`);
    } else if (isOnCart && itemCount > 0) {
      if (!userSession) {
        window.dispatchEvent(new CustomEvent("show-phone-modal"));
        return;
      }
      setOrdering(true);
      setOrderError(null);
      try {
        const res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            umbrellaId,
            deliveryUmbrellaId: umbrellaId,
            billingUmbrellaId: umbrellaId,
            sessionId: userSession.sessionId,
            guestPhone: userSession.phone,
            role: "owner",
            items,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        addOrder(json.data.order);
        clearCart();
        router.push(`${base}/orders`);
      } catch (e: unknown) {
        setOrderError(e instanceof Error ? e.message : "Eroare la trimiterea comenzii.");
      } finally {
        setOrdering(false);
      }
    } else if (itemCount > 0) {
      router.push(`${base}/cart`);
    } else {
      router.push(`${base}/bill`);
    }
  }, [isOnLanding, isOnCart, itemCount, userSession, umbrellaId, items, addOrder, clearCart, router, base]);

  // Determine single button state
  let actionLabel: string;
  let actionIcon: React.ReactNode;
  let actionStyle: string;

  if (isOnLanding) {
    actionLabel = "Meniu";
    actionIcon = <UtensilsCrossed className="w-4 h-4" />;
    actionStyle = "bg-[#C9AB81] text-[#0A0A0A]";
  } else if (isOnCart && itemCount > 0) {
    actionLabel = ordering ? "Se trimite..." : `Plasează · ${cartTotal} RON`;
    actionIcon = <ShoppingBag className="w-4 h-4" />;
    actionStyle = "bg-emerald-500 text-white";
  } else if (itemCount > 0) {
    actionLabel = `Finalizează (${itemCount})`;
    actionIcon = <ShoppingBag className="w-4 h-4" />;
    actionStyle = "bg-[#C9AB81] text-[#0A0A0A]";
  } else {
    actionLabel = "Solicită nota";
    actionIcon = <Receipt className="w-4 h-4" />;
    actionStyle = "bg-white/10 text-white/60";
  }

  return (
    <>
      {orderError && (
        <div className="fixed bottom-16 left-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 text-sm font-bold animate-fade-in">
          {orderError}
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/[0.06] pb-safe">
        <div className="flex items-center gap-3 px-4 pt-2 pb-2">
          {/* Speaker toggle - left */}
          <button
            onClick={toggleAudio}
            className="flex items-center justify-center w-9 h-9 text-white/30 active:text-white/50 transition-all duration-200 shrink-0"
          >
            {playing ? (
              <Volume2 className="w-5 h-5" strokeWidth={1.8} />
            ) : (
              <VolumeX className="w-5 h-5" strokeWidth={1.8} />
            )}
          </button>

          {/* Single dynamic button - centered */}
          <button
            onClick={handleAction}
            disabled={ordering}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm tracking-[0.15em] uppercase transition-all active:opacity-80 disabled:opacity-50",
              actionStyle
            )}
          >
            {actionIcon}
            {actionLabel}
          </button>

          {/* Home button - right, goes to homepage #about */}
          <Link
            href="/#about"
            className="flex items-center justify-center w-9 h-9 text-white/30 active:text-white/50 transition-all duration-200 shrink-0"
          >
            <Home className="w-5 h-5" strokeWidth={1.8} />
          </Link>
        </div>
      </nav>
    </>
  );
}
