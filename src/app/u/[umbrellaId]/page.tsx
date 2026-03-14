"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Spinner } from "@/components/ui";
import { PhoneModal } from "@/components/layout/PhoneModal";
import { useSessionStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Umbrella, PromoBanner } from "@/types";
import { PROMO_BANNERS } from "@/lib/mock-data";

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
  const { userSession } = useSessionStore();
  const [showPhone, setShowPhone] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["umbrella", umbrellaId],
    queryFn: () => fetchUmbrella(umbrellaId),
  });

  useEffect(() => {
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % PROMO_BANNERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isLoading && !userSession) {
      const t = setTimeout(() => setShowPhone(true), 800);
      return () => clearTimeout(t);
    }
  }, [isLoading, userSession]);

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
  const banner = PROMO_BANNERS[bannerIdx];

  return (
    <>
      {showPhone && !userSession && (
        <PhoneModal
          umbrellaId={umbrellaId}
          onClose={() => setShowPhone(false)}
        />
      )}

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

          {/* Ad / Promo space */}
          <div className="w-full max-w-sm bg-white/[0.03] border border-white/[0.06] p-4 animate-fade-in transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white tracking-wide">{banner.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{banner.subtitle}</p>
              </div>
              <span className="text-2xl">{banner.emoji}</span>
            </div>
            <div className="flex gap-1 mt-3">
              {PROMO_BANNERS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-300",
                    i === bannerIdx ? "w-6 bg-[#C9AB81]" : "w-2 bg-white/15"
                  )}
                />
              ))}
            </div>
          </div>
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

          {!userSession && (
            <button
              onClick={() => setShowPhone(true)}
              className="w-full mt-3 py-3 text-[10px] text-[#C9AB81] font-bold tracking-[0.2em] uppercase"
            >
              Identifică-te pentru a comanda →
            </button>
          )}

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
      </div>
    </>
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
