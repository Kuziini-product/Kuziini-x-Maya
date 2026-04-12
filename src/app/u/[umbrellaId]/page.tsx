"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Crown, Check, X as XIcon, Users } from "lucide-react";
import { Spinner } from "@/components/ui";
import { useSessionStore, useCartStore } from "@/store";
import { cn } from "@/lib/utils";
import { ScratchX } from "@/components/ui/ScratchX";
import type { Umbrella, PromoBanner, MenuItem } from "@/types";

interface PendingJoinRequest {
  id: string;
  phone: string;
  name: string;
  requestedAt: string;
}

async function fetchUmbrella(id: string) {
  const res = await fetch(`/api/umbrella/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export default function LandingPage({
  params,
}: {
  params: { umbrellaId: string };
}) {
  const { umbrellaId } = params;
  const router = useRouter();
  const { userSession } = useSessionStore();
  const [mayaBanner, setMayaBanner] = useState<PromoBanner | null>(null);
  const [kuziiniBanner, setKuziiniBanner] = useState<PromoBanner | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingJoinRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const isOwner = userSession?.role === "owner";

  // Poll umbrella session for pending join requests (owner only)
  const fetchSessionInfo = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch(`/api/umbrella/${umbrellaId}/session`);
      const json = await res.json();
      if (json.success && json.data.hasOwner) {
        setPendingRequests(json.data.pendingRequests || []);
      }
    } catch {}
  }, [isOwner, umbrellaId]);

  useEffect(() => {
    if (!isOwner) return;
    fetchSessionInfo();
    const interval = setInterval(fetchSessionInfo, 5000);
    return () => clearInterval(interval);
  }, [isOwner, fetchSessionInfo]);

  async function handleApproveRequest(reqId: string, action: "approve" | "reject") {
    if (!userSession) return;
    setProcessing(reqId);
    try {
      const res = await fetch(`/api/umbrella/${umbrellaId}/join-requests/${reqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, callerPhone: userSession.phone }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingRequests(json.data.pendingRequests || []);
      }
    } finally {
      setProcessing(null);
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["umbrella", umbrellaId],
    queryFn: () => fetchUmbrella(umbrellaId),
  });

  // Track access on mount
  useEffect(() => {
    if (userSession?.phone) {
      fetch("/api/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "track",
          name: userSession.name || "",
          phone: userSession.phone,
          email: userSession.email || "",
          umbrellaId,
          page: `/u/${umbrellaId}`,
          accessType: "menu",
        }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [umbrellaId]);

  // Fetch banners + menu items
  useEffect(() => {
    fetch("/api/banners?category=Maya")
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data.length) setMayaBanner(j.data[0]); });
    fetch("/api/banners?category=kuziini")
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data.length) setKuziiniBanner(j.data[0]); });
    fetch(`/api/menu?umbrellaId=${umbrellaId}`)
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data?.items) setMenuItems(j.data.items); });
  }, [umbrellaId]);

  // Redirect to /scan if not authenticated via QR
  useEffect(() => {
    if (!isLoading && !userSession) {
      router.replace("/scan");
    }
  }, [isLoading, userSession, router]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-maya-dark">
        <div className="flex flex-col items-center gap-4">
          <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
            <Image src="/kuziini-logo.png" alt="Kuziini" width={80} height={80} className="rounded-xl opacity-60 invert brightness-200" />
          </a>
          <Spinner className="text-maya-gold" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-maya-dark">
        <div className="text-center">
          <span className="text-5xl">🏖️</span>
          <h1 className="text-2xl mt-4 mb-2 text-white font-bold">QR invalid</h1>
          <p className="text-white/40 text-sm">
            Această umbrelă nu a fost găsită. Verifică QR code-ul.
          </p>
        </div>
      </div>
    );
  }

  const umbrella: Umbrella = data.umbrella;

  function handleBannerClick(banner: PromoBanner) {
    // If banner has a linked menu product, add it to cart and navigate to menu with highlight
    if (banner.menuItemId) {
      const item = menuItems.find((m) => m.id === banner.menuItemId);
      if (item) {
        addItem(item, 1, "", banner.title);
        setAddedToast(banner.title);
        // Navigate to menu page with the product highlighted
        setTimeout(() => {
          router.push(`/u/${umbrellaId}/menu?highlight=${item.id}`);
        }, 600);
      }
      return;
    }
    // Fallback: open Instagram if set
    if (banner.instagramUrl) {
      window.open(banner.instagramUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <>
      <div className="min-h-dvh bg-maya-dark text-white flex flex-col">
        {/* ═══ TOP: Umbrella number + ad space ═══ */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-8 pt-6">
          {/* Umbrella icon + number - centered, prominent */}
          <div className="text-center mb-6 animate-fade-up">
            <span className="text-6xl md:text-7xl block mb-3">⛱️</span>
            <h1 className="text-6xl md:text-7xl font-bold tracking-wider text-white">
              {umbrella.number}
            </h1>
            <p className="text-maya-gold text-sm font-semibold tracking-[0.2em] uppercase mt-2">
              {umbrella.zone}
            </p>
            {userSession && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {isOwner && <Crown className="w-3.5 h-3.5 text-maya-gold" />}
                <p className="text-white/30 text-xs tracking-wide">
                  {userSession.name || userSession.phone}
                </p>
              </div>
            )}
          </div>

          {/* Pending join requests (visible only to owner) */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="w-full max-w-sm md:max-w-md mb-4 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-maya-gold" />
                <p className="text-[10px] font-bold text-maya-gold tracking-[0.2em] uppercase">
                  Cereri de alaturare ({pendingRequests.length})
                </p>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-maya-gold/5 border border-maya-gold/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{req.name || "Anonim"}</p>
                        <p className="text-white/40 text-xs">{req.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id, "reject")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 py-2 text-[10px] font-bold tracking-wider uppercase disabled:opacity-50"
                      >
                        <XIcon className="w-3 h-3" /> Refuza
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req.id, "approve")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2 text-[10px] font-bold tracking-wider uppercase disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Aproba
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maya banner */}
          {mayaBanner && (
            <div className="w-full max-w-sm md:max-w-md mb-3">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">Maya</p>
              <BannerSlide
                banner={mayaBanner}
                onClick={() => handleBannerClick(mayaBanner)}
                cartQty={mayaBanner.menuItemId ? cartItems.find((i) => i.menuItem.id === mayaBanner.menuItemId)?.quantity : undefined}
                menuItemName={mayaBanner.menuItemId ? menuItems.find((m) => m.id === mayaBanner.menuItemId)?.name : undefined}
              />
            </div>
          )}

          {/* Kuziini banner */}
          {kuziiniBanner && (
            <div className="w-full max-w-sm md:max-w-md">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">Kuziini</p>
              <BannerSlide
                banner={kuziiniBanner}
                onClick={() => handleBannerClick(kuziiniBanner)}
                cartQty={kuziiniBanner.menuItemId ? cartItems.find((i) => i.menuItem.id === kuziiniBanner.menuItemId)?.quantity : undefined}
                menuItemName={kuziiniBanner.menuItemId ? menuItems.find((m) => m.id === kuziiniBanner.menuItemId)?.name : undefined}
              />
            </div>
          )}
        </div>

        {/* ═══ BOTTOM: Branding footer ═══ */}
        <div className="px-5 pb-6 pt-6">
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/[0.04]">
            <img
              src="/Maya.png"
              alt="Maya"
              className="h-20 object-contain opacity-60"
            />
            <ScratchX className="h-12 text-maya-gold/40" />
            <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
              <img src="/kuziini-logo.png" alt="Kuziini" className="h-10 object-contain invert brightness-200" />
            </a>
          </div>
        </div>

        {/* Toast for added to cart */}
        {addedToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-3 text-sm font-bold tracking-wide shadow-lg z-50 animate-fade-in">
            ✓ {addedToast} adăugat în coș
          </div>
        )}
      </div>
    </>
  );
}

function BannerSlide({ banner, onClick, cartQty, menuItemName }: { banner: PromoBanner; onClick?: () => void; cartQty?: number; menuItemName?: string }) {
  const isClickable = !!(banner.menuItemId || banner.instagramUrl);
  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "bg-white/[0.03] border border-white/[0.06] p-4 animate-fade-in transition-all duration-500",
        isClickable && "cursor-pointer active:bg-white/[0.06]"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white tracking-wide">{banner.title}</p>
          {menuItemName && (
            <p className="text-white/40 text-xs mt-0.5">{menuItemName}</p>
          )}
          {!menuItemName && banner.subtitle && (
            <p className="text-white/40 text-xs mt-0.5">{banner.subtitle}</p>
          )}
          {banner.menuItemId && (
            <p className="text-emerald-400/60 text-[9px] mt-1 font-bold tracking-wider uppercase">
              {cartQty ? `${cartQty} în coș · + adaugă` : "+ Adaugă în coș"}
            </p>
          )}
        </div>
        {banner.image ? (
          <img src={banner.image} alt="" className="w-10 h-10 object-cover rounded shrink-0 ml-3" />
        ) : banner.emoji ? (
          <span className="text-2xl shrink-0 ml-3">{banner.emoji}</span>
        ) : null}
      </div>
    </div>
  );
}

