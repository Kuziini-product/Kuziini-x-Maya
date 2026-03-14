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
  Crown,
  Users,
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
          <Image src="/kuziini-logo.png" alt="Kuziini" width={80} height={80} className="rounded-xl opacity-60 invert brightness-200" />
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
          <h1 className="text-2xl mt-4 mb-2 text-white font-bold">
            QR invalid
          </h1>
          <p className="text-white/40 text-sm">
            Această umbrelă nu a fost găsită. Verifică QR code-ul sau adresează-te
            recepției.
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

      <div className="min-h-dvh bg-[#0A0A0A] text-white">
        {/* Header */}
        <div className="px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#C9AB81] uppercase mb-1">
                Lounge &amp; Beach
              </p>
              <h1 className="text-2xl font-bold tracking-wide">
                Kuziini <span className="text-[#C9AB81]">×</span> LOFT
              </h1>
            </div>
            <Image src="/kuziini-logo.png" alt="Kuziini" width={48} height={48} className="rounded-xl border border-white/10 invert brightness-200" />
          </div>

          {/* Umbrella card */}
          <div className="bg-white/[0.04] border border-white/[0.08] p-5 mb-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1">
                  Umbrela ta
                </p>
                <h2 className="text-4xl font-bold text-white tracking-wide">
                  {umbrella.number}
                </h2>
                <p className="text-sm text-[#C9AB81] font-semibold mt-1 tracking-wide">
                  {umbrella.zone}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-3xl">⛱️</span>
                {userSession && (
                  <span className={cn(
                    "text-[9px] font-bold tracking-wider uppercase px-2 py-1 border",
                    userSession.role === "owner"
                      ? "border-[#C9AB81]/50 text-[#C9AB81]"
                      : "border-white/20 text-white/50"
                  )}>
                    {userSession.role === "owner" ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Owner
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Guest
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {userSession && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#C9AB81]/10 flex items-center justify-center">
                  <span className="text-xs">👋</span>
                </div>
                <p className="text-sm text-white/50">
                  Bun venit, <span className="font-semibold text-white/80">{userSession.name || userSession.phone}</span>
                </p>
              </div>
            )}
          </div>

          {/* Promo banner */}
          <div className="bg-white/[0.04] border border-white/[0.06] p-4 overflow-hidden animate-fade-in transition-all duration-500">
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

        {/* Action buttons */}
        <div className="px-5 pb-8">
          <p className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-4">
            Ce dorești?
          </p>

          <div className="grid grid-cols-2 gap-2 stagger">
            <Link href={`/u/${umbrellaId}/menu`} className="animate-fade-up">
              <ActionCard
                icon={<UtensilsCrossed className="w-5 h-5" />}
                label="Vezi meniul"
                accent
              />
            </Link>
            <Link href={`/u/${umbrellaId}/cart`} className="animate-fade-up">
              <ActionCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Coș comandă"
              />
            </Link>
            <Link href={`/u/${umbrellaId}/bill`} className="animate-fade-up">
              <ActionCard
                icon={<Receipt className="w-5 h-5" />}
                label="Solicită nota"
              />
            </Link>
            <ActionCard
              icon={<HelpCircle className="w-5 h-5" />}
              label="Ajutor"
              onClick={() => alert("Apelează recepția la ext. 0 sau suna la +40 756 385 638")}
            />
          </div>

          {/* Quick order CTA */}
          <Link href={`/u/${umbrellaId}/menu`}>
            <div className="mt-4 bg-[#C9AB81] p-5 text-[#0A0A0A] flex items-center justify-between active:opacity-80 transition-opacity animate-fade-up">
              <div>
                <p className="font-bold text-base tracking-wide">Comandă acum</p>
                <p className="text-[#0A0A0A]/60 text-xs mt-0.5 tracking-wide">
                  Livrare direct la șezlong
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🍹</span>
                <ChevronRight className="w-5 h-5 text-[#0A0A0A]/50" />
              </div>
            </div>
          </Link>

          {!userSession && (
            <button
              onClick={() => setShowPhone(true)}
              className="w-full mt-3 py-3 text-xs text-[#C9AB81] font-bold tracking-[0.15em] uppercase"
            >
              Identifică-te pentru a comanda →
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function ActionCard({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border p-4 flex flex-col gap-3 transition-all active:bg-white/[0.06] cursor-pointer",
        accent
          ? "bg-white/[0.04] border-[#C9AB81]/20"
          : "bg-white/[0.02] border-white/[0.06]"
      )}
    >
      <div className={cn(
        "w-9 h-9 flex items-center justify-center",
        accent ? "bg-[#C9AB81] text-[#0A0A0A]" : "bg-white/10 text-white/60"
      )}>
        {icon}
      </div>
      <p className="font-bold text-xs tracking-wide">{label}</p>
    </div>
  );
}
