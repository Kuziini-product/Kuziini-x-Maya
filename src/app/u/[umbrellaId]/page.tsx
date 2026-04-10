"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Plus, ShoppingBag } from "lucide-react";
import { Spinner } from "@/components/ui";
import { useSessionStore, useCartStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Umbrella, PromoBanner, MenuItem } from "@/types";

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
  const [mayaBanners, setMayaBanners] = useState<PromoBanner[]>([]);
  const [kuziiniBanners, setKuziiniBanners] = useState<PromoBanner[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState<"Maya" | "kuziini" | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

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
      .then((j) => { if (j.success && j.data.length) setMayaBanners(j.data); });
    fetch("/api/banners?category=kuziini")
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data.length) setKuziiniBanners(j.data); });
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
      <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
            <Image src="/kuziini-logo.png" alt="Kuziini" width={80} height={80} className="rounded-xl opacity-60 invert brightness-200" />
          </a>
          <Spinner className="text-[#C9AB81]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-[#0A0A0A]">
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
  const mayaBanner = mayaBanners[0] || null;
  const kuziiniBanner = kuziiniBanners[0] || null;
  const drawerBanners = openDrawer === "Maya" ? mayaBanners : openDrawer === "kuziini" ? kuziiniBanners : [];

  function handleAddFromBanner(banner: PromoBanner) {
    if (banner.menuItemId) {
      const item = menuItems.find((m) => m.id === banner.menuItemId);
      if (item) {
        addItem(item, 1, "", banner.title);
        setAddedToast(banner.title);
        setTimeout(() => setAddedToast(null), 2500);
      }
    } else if (banner.instagramUrl) {
      window.open(banner.instagramUrl, "_blank", "noopener,noreferrer");
    }
  }

  function getCartQty(banner: PromoBanner) {
    if (!banner.menuItemId) return 0;
    return cartItems.find((i) => i.menuItem.id === banner.menuItemId)?.quantity || 0;
  }

  function getMenuItemName(banner: PromoBanner) {
    if (!banner.menuItemId) return undefined;
    return menuItems.find((m) => m.id === banner.menuItemId)?.name;
  }

  function getMenuItemPrice(banner: PromoBanner) {
    if (!banner.menuItemId) return undefined;
    return menuItems.find((m) => m.id === banner.menuItemId)?.price;
  }

  return (
    <>
      <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col">
        {/* ═══ TOP: Umbrella number + ad space ═══ */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 pt-6">
          {/* Umbrella icon + number - centered, prominent */}
          <div className="text-center mb-6 animate-fade-up">
            <span className="text-6xl block mb-3">⛱️</span>
            <h1 className="text-6xl font-bold tracking-wider text-white">
              {umbrella.number}
            </h1>
            <p className="text-[#C9AB81] text-sm font-semibold tracking-[0.2em] uppercase mt-2">
              {umbrella.zone}
            </p>
            {userSession && (
              <p className="text-white/30 text-xs mt-3 tracking-wide">
                {userSession.name || userSession.phone}
              </p>
            )}
          </div>

          {/* Maya banner card — click opens drawer */}
          {mayaBanner && (
            <div className="w-full max-w-sm mb-3">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">Maya</p>
              <div
                onClick={() => setOpenDrawer("Maya")}
                className="bg-white/[0.03] border border-white/[0.06] overflow-hidden cursor-pointer active:bg-white/[0.06] transition-all animate-fade-in"
              >
                {mayaBanner.image && (
                  <img src={mayaBanner.image} alt="" className="w-full h-28 object-cover" />
                )}
                <div className="p-4">
                  <p className="text-sm font-bold text-white tracking-wide">{mayaBanner.title}</p>
                  {mayaBanner.subtitle && (
                    <p className="text-white/40 text-xs mt-0.5">{mayaBanner.subtitle}</p>
                  )}
                  <p className="text-[#C9AB81]/60 text-[9px] mt-1.5 font-bold tracking-wider uppercase">
                    Vezi {mayaBanners.length} oferte
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kuziini banner card — click opens drawer */}
          {kuziiniBanner && (
            <div className="w-full max-w-sm">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">Kuziini</p>
              <div
                onClick={() => setOpenDrawer("kuziini")}
                className="bg-white/[0.03] border border-white/[0.06] overflow-hidden cursor-pointer active:bg-white/[0.06] transition-all animate-fade-in"
              >
                {kuziiniBanner.image && (
                  <img src={kuziiniBanner.image} alt="" className="w-full h-28 object-cover" />
                )}
                <div className="p-4">
                  <p className="text-sm font-bold text-white tracking-wide">{kuziiniBanner.title}</p>
                  {kuziiniBanner.subtitle && (
                    <p className="text-white/40 text-xs mt-0.5">{kuziiniBanner.subtitle}</p>
                  )}
                  <p className="text-[#C9AB81]/60 text-[9px] mt-1.5 font-bold tracking-wider uppercase">
                    Vezi {kuziiniBanners.length} oferte
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ BOTTOM: Branding footer ═══ */}
        <div className="px-5 pb-6 pt-6">
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/[0.04]">
            <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
              <img src="/kuziini-logo.png" alt="Kuziini" className="h-10 object-contain invert brightness-200" />
            </a>
            <span className="text-[#C9AB81]/40 text-lg font-bold">×</span>
            <img
              src="/Maya.png"
              alt="Maya"
              className="h-10 object-contain opacity-60"
            />
          </div>
        </div>

        {/* Toast for added to cart */}
        {addedToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-3 text-sm font-bold tracking-wide shadow-lg z-50 animate-fade-in">
            ✓ {addedToast} adăugat în coș
          </div>
        )}
      </div>

      {/* ═══ Offers Drawer ═══ */}
      {openDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpenDrawer(null)} />

          {/* Drawer panel */}
          <div className="relative mt-auto bg-[#0A0A0A] border-t border-white/[0.08] max-h-[85dvh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold text-[#C9AB81] tracking-[0.2em] uppercase">
                  {openDrawer === "Maya" ? "Oferte Maya" : "Oferte Kuziini"}
                </p>
                <p className="text-white/30 text-[10px] mt-0.5">
                  Apasă pe o ofertă pentru a o adăuga în coș
                </p>
              </div>
              <button
                onClick={() => setOpenDrawer(null)}
                className="w-9 h-9 flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Offers list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {drawerBanners.map((banner) => {
                const itemName = getMenuItemName(banner);
                const itemPrice = getMenuItemPrice(banner);
                const qty = getCartQty(banner);
                return (
                  <div
                    key={banner.id}
                    className={cn(
                      "border overflow-hidden transition-all",
                      qty > 0
                        ? "bg-emerald-500/[0.08] border-emerald-500/20"
                        : "bg-white/[0.03] border-white/[0.06]"
                    )}
                  >
                    {banner.image && (
                      <img src={banner.image} alt="" className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm tracking-wide">
                            {banner.title}
                          </p>
                          {itemName && (
                            <p className="text-white/40 text-xs mt-0.5">{itemName}</p>
                          )}
                          {!itemName && banner.subtitle && (
                            <p className="text-white/40 text-xs mt-0.5">{banner.subtitle}</p>
                          )}
                          {itemPrice != null && (
                            <p className="text-[#C9AB81] font-bold text-sm mt-1">
                              {itemPrice} RON
                            </p>
                          )}
                        </div>
                        {!banner.emoji && !banner.image && (
                          <ShoppingBag className="w-5 h-5 text-white/20 shrink-0 mt-1" />
                        )}
                        {banner.emoji && !banner.image && (
                          <span className="text-2xl shrink-0">{banner.emoji}</span>
                        )}
                      </div>

                      {/* Add to cart button */}
                      {banner.menuItemId && (
                        <button
                          onClick={() => handleAddFromBanner(banner)}
                          className={cn(
                            "w-full mt-3 flex items-center justify-center gap-2 py-2.5 font-bold text-xs tracking-wider uppercase transition-all active:scale-[0.98]",
                            qty > 0
                              ? "bg-emerald-500 text-white"
                              : "bg-[#C9AB81] text-[#0A0A0A]"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {qty > 0 ? `${qty} în coș · adaugă încă` : "Adaugă în coș"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

