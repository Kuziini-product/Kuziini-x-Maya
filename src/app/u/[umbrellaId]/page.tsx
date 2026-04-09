"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
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
  const [mayaIdx, setmayaIdx] = useState(0);
  const [kuziiniIdx, setKuziiniIdx] = useState(0);
  const [mayaBanners, setmayaBanners] = useState<PromoBanner[]>([]);
  const [kuziiniBanners, setKuziiniBanners] = useState<PromoBanner[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

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
      .then((j) => { if (j.success && j.data.length) setmayaBanners(j.data); });
    fetch("/api/banners?category=kuziini")
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data.length) setKuziiniBanners(j.data); });
    fetch(`/api/menu?umbrellaId=${umbrellaId}`)
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data?.items) setMenuItems(j.data.items); });
  }, [umbrellaId]);

  // Auto-rotate Maya banners
  useEffect(() => {
    if (mayaBanners.length <= 1) return;
    const t = setInterval(() => {
      setmayaIdx((i) => (i + 1) % mayaBanners.length);
    }, 4000);
    return () => clearInterval(t);
  }, [mayaBanners.length]);

  // Auto-rotate Kuziini banners
  useEffect(() => {
    if (kuziiniBanners.length <= 1) return;
    const t = setInterval(() => {
      setKuziiniIdx((i) => (i + 1) % kuziiniBanners.length);
    }, 4000);
    return () => clearInterval(t);
  }, [kuziiniBanners.length]);

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
  const mayaBanner = mayaBanners[mayaIdx] || null;
  const kuziiniBanner = kuziiniBanners[kuziiniIdx] || null;

  function handleBannerClick(banner: PromoBanner) {
    // Kuziini banners: open Instagram
    if (banner.instagramUrl) {
      window.open(banner.instagramUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // Maya banners: add menu item to cart
    if (banner.menuItemId) {
      const item = menuItems.find((m) => m.id === banner.menuItemId);
      if (item) {
        addItem(item, 1);
        setAddedToast(item.name);
        setTimeout(() => setAddedToast(null), 2500);
      }
    }
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

          {/* Maya banners */}
          {mayaBanner && (
            <div className="w-full max-w-sm mb-3">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">LOFT</p>
              <BannerSlide banner={mayaBanner} onClick={() => handleBannerClick(mayaBanner)} />
              {mayaBanners.length > 1 && (
                <div className="flex gap-1 mt-2">
                  {mayaBanners.map((_: PromoBanner, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "h-0.5 rounded-full transition-all duration-300",
                        i === mayaIdx ? "w-6 bg-[#C9AB81]" : "w-2 bg-white/15"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kuziini Banners */}
          {kuziiniBanner && (
            <div className="w-full max-w-sm">
              <p className="text-[10px] font-bold text-white/20 tracking-[0.2em] uppercase mb-2">Kuziini</p>
              <BannerSlide banner={kuziiniBanner} onClick={() => handleBannerClick(kuziiniBanner)} />
              {kuziiniBanners.length > 1 && (
                <div className="flex gap-1 mt-2">
                  {kuziiniBanners.map((_: PromoBanner, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "h-0.5 rounded-full transition-all duration-300",
                        i === kuziiniIdx ? "w-6 bg-[#C9AB81]" : "w-2 bg-white/15"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ BOTTOM: Action buttons grouped at bottom ═══ */}
        <div className="px-5 pb-6 pt-6">
          {/* Quick order CTA - main action */}
          <Link href={`/u/${umbrellaId}/menu`}>
            <div className="bg-[#C9AB81] p-4 text-[#0A0A0A] flex items-center justify-between active:opacity-80 transition-opacity mb-3">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-5 h-5" />
                <div>
                  <p className="font-bold text-sm tracking-wide">Comandă acum</p>
                  <p className="text-[#0A0A0A]/50 text-[10px] tracking-wide">
                    Livrare direct la șezlong
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0A0A0A]/40" />
            </div>
          </Link>

          {/* Secondary actions - 3 columns */}
          <div className="grid grid-cols-3 gap-2">
            <Link href={`/u/${umbrellaId}/cart`}>
              <ActionCard icon={<ShoppingBag className="w-4 h-4" />} label="Coș" />
            </Link>
            <Link href={`/u/${umbrellaId}/bill`}>
              <ActionCard icon={<Receipt className="w-4 h-4" />} label="Nota" />
            </Link>
            <ActionCard
              icon={<HelpCircle className="w-4 h-4" />}
              label="Ajutor"
              onClick={() => alert("Apelează recepția la ext. 0 sau suna la +40 756 385 638")}
            />
          </div>

          {/* Branding footer */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
            <a href="https://www.instagram.com/kuziiniconceptstore/" target="_blank" rel="noopener noreferrer">
              <img src="/kuziini-logo.png" alt="Kuziini" className="h-8 object-contain invert brightness-200" />
            </a>
            <span className="text-[#C9AB81]/40 text-lg font-bold">×</span>
            <img
              src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
              alt="LOFT"
              className="h-8 object-contain opacity-60"
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
    </>
  );
}

function BannerSlide({ banner, onClick }: { banner: PromoBanner; onClick?: () => void }) {
  const isClickable = !!(banner.instagramUrl || banner.menuItemId);
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
          {banner.subtitle && (
            <p className="text-white/40 text-xs mt-0.5">{banner.subtitle}</p>
          )}
          {banner.menuItemId && (
            <p className="text-emerald-400/60 text-[9px] mt-1 font-bold tracking-wider uppercase">
              Apasă pentru a adăuga în coș
            </p>
          )}
          {banner.instagramUrl && (
            <p className="text-pink-400/60 text-[9px] mt-1 font-bold tracking-wider uppercase">
              Deschide pe Instagram
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

function ActionCard({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col items-center gap-2 transition-all active:bg-white/[0.06] cursor-pointer"
    >
      <div className="w-8 h-8 flex items-center justify-center bg-white/10 text-white/50">
        {icon}
      </div>
      <p className="font-bold text-[10px] tracking-wider text-white/60 uppercase">{label}</p>
    </div>
  );
}
