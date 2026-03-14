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
  Loader2,
} from "lucide-react";
import { Button, Card, Badge, Spinner } from "@/components/ui";
import { PhoneModal } from "@/components/layout/PhoneModal";
import { useSessionStore } from "@/store";
import { cn, formatPrice } from "@/lib/utils";
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

  // Auto-rotate promo banners
  useEffect(() => {
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % PROMO_BANNERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Prompt phone if not identified
  useEffect(() => {
    if (!isLoading && !userSession) {
      const t = setTimeout(() => setShowPhone(true), 800);
      return () => clearTimeout(t);
    }
  }, [isLoading, userSession]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-loft-gradient">
        <div className="flex flex-col items-center gap-4">
          <Image src="/kuziini-logo.jpg" alt="Kuziini" width={120} height={40} className="animate-pulse" />
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center">
          <span className="text-5xl">🏖️</span>
          <h1 className="font-display text-2xl mt-4 mb-2 text-gray-900">
            QR invalid
          </h1>
          <p className="text-gray-500 text-sm">
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

      <div className="min-h-dvh bg-loft-gradient">
        {/* Hero */}
        <div className="relative overflow-hidden px-5 pt-10 pb-8">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-100/40 blur-3xl" />
            <div className="absolute top-20 -left-10 w-48 h-48 rounded-full bg-pink-100/30 blur-2xl" />
          </div>

          {/* Branding */}
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest text-purple-500 uppercase font-body mb-1">
                Lounge &amp; Beach
              </p>
              <h1 className="font-display text-3xl font-bold text-gray-900 leading-tight">
                Kuziini <span className="text-purple-600">×</span> LOFT
              </h1>
            </div>
            <Image src="/kuziini-logo.jpg" alt="Kuziini" width={56} height={56} className="rounded-2xl shadow-lg" />
          </div>

          {/* Umbrella card */}
          <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-card border border-white/60 mb-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-body mb-1">
                  Umbrela ta
                </p>
                <h2 className="font-display text-4xl font-bold text-gray-900">
                  {umbrella.number}
                </h2>
                <p className="text-sm text-ocean-600 font-semibold mt-1">
                  {umbrella.zone}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-3xl">⛱️</span>
                {userSession && (
                  <Badge variant={userSession.role === "owner" ? "ocean" : "sand"}>
                    {userSession.role === "owner" ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Owner
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Guest
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </div>

            {userSession && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center">
                  <span className="text-xs">👋</span>
                </div>
                <p className="text-sm text-gray-600 font-body">
                  Bun venit, <span className="font-semibold text-gray-800">{userSession.phone}</span>
                </p>
              </div>
            )}
          </div>

          {/* Promo banner */}
          <div
            className={cn(
              "relative z-10 rounded-2xl p-4 bg-gradient-to-r text-white overflow-hidden animate-fade-in transition-all duration-500",
              banner.color
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold">{banner.title}</p>
                <p className="text-white/85 text-sm mt-0.5">{banner.subtitle}</p>
              </div>
              <span className="text-3xl">{banner.emoji}</span>
            </div>
            {/* Dots indicator */}
            <div className="flex gap-1 mt-3">
              {PROMO_BANNERS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === bannerIdx ? "w-6 bg-white" : "w-2 bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-6">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase font-body mb-4">
            Ce dorești?
          </p>

          <div className="grid grid-cols-2 gap-3 stagger">
            <Link href={`/u/${umbrellaId}/menu`} className="animate-fade-up">
              <ActionCard
                icon={<UtensilsCrossed className="w-6 h-6" />}
                label="Vezi meniul"
                color="bg-ocean-50 text-ocean-700 border-ocean-100"
                accent="bg-ocean-600"
              />
            </Link>

            <Link href={`/u/${umbrellaId}/cart`} className="animate-fade-up">
              <ActionCard
                icon={<ShoppingBag className="w-6 h-6" />}
                label="Coș comandă"
                color="bg-coral-50 text-coral-700 border-coral-100"
                accent="bg-coral-500"
              />
            </Link>

            <Link href={`/u/${umbrellaId}/bill`} className="animate-fade-up">
              <ActionCard
                icon={<Receipt className="w-6 h-6" />}
                label="Solicită nota"
                color="bg-sand-50 text-sand-700 border-sand-100"
                accent="bg-sand-500"
              />
            </Link>

            <ActionCard
              icon={<HelpCircle className="w-6 h-6" />}
              label="Ajutor"
              color="bg-gray-50 text-gray-600 border-gray-100"
              accent="bg-gray-400"
              onClick={() => alert("Apelează recepția la ext. 0 sau suna la +40 XXX XXX XXX")}
            />
          </div>

          {/* Quick order CTA */}
          <Link href={`/u/${umbrellaId}/menu`}>
            <div className="mt-5 bg-ocean-600 rounded-3xl p-5 text-white flex items-center justify-between shadow-lg animate-fade-up">
              <div>
                <p className="font-display text-lg font-bold">Comandă acum</p>
                <p className="text-ocean-200 text-sm mt-0.5">
                  Livrare direct la șezlong
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍹</span>
                <ChevronRight className="w-5 h-5 text-ocean-300" />
              </div>
            </div>
          </Link>

          {!userSession && (
            <button
              onClick={() => setShowPhone(true)}
              className="w-full mt-3 py-3 text-sm text-ocean-600 font-semibold font-body"
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
  color,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-3xl border p-4 flex flex-col gap-3 transition-all duration-200 active:scale-[0.97] cursor-pointer",
        color
      )}
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow", accent)}>
        {icon}
      </div>
      <p className="font-semibold text-sm font-body leading-snug">{label}</p>
    </div>
  );
}
