"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ScratchX } from "@/components/ui/ScratchX";
import { Spinner } from "@/components/ui";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { useCartStore, useSessionStore } from "@/store";
import { cn } from "@/lib/utils";
import { PhoneModal } from "@/components/layout/PhoneModal";
import type { MenuItem, MenuCategory } from "@/types";

async function fetchMenu(umbrellaId: string) {
  const res = await fetch(`/api/menu?umbrellaId=${umbrellaId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as { categories: MenuCategory[]; items: MenuItem[] };
}

const MENU_TABS = [
  { id: "food", label: "FOOD MENU", slugs: ["starters", "pasta", "pizza", "sea", "land", "sides", "desserts"] },
  { id: "bar", label: "BAR MENU", slugs: ["cocktails", "shots"] },
  { id: "drinks", label: "DRINKS", slugs: ["beer", "energy-drinks", "soft-drinks", "water"] },
  { id: "wine", label: "WINE LIST", slugs: ["wine"] },
];

export default function MenuPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const [activeTab, setActiveTab] = useState("food");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastVisited, setLastVisited] = useState<string | null>(null);
  const cartItems = useCartStore((s) => s.items);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const { userSession } = useSessionStore();
  const [showPhone, setShowPhone] = useState(false);

  // Listen for phone modal request from BottomNav
  useEffect(() => {
    const handler = () => setShowPhone(true);
    window.addEventListener("show-phone-modal", handler);
    return () => window.removeEventListener("show-phone-modal", handler);
  }, []);

  // Check if user has visited a section before (stored when navigating away)
  useEffect(() => {
    const saved = sessionStorage.getItem(`last-section-${umbrellaId}`);
    if (saved) setLastVisited(saved);
  }, [umbrellaId]);

  const { data, isLoading } = useQuery({
    queryKey: ["menu", umbrellaId],
    queryFn: () => fetchMenu(umbrellaId),
  });

  const categories = data?.categories ?? [];
  const allItems = data?.items ?? [];

  const currentTab = MENU_TABS.find((t) => t.id === activeTab)!;
  const tabCategories = categories.filter((c) => currentTab.slugs.includes(c.slug));

  const filteredItems = allItems.filter((item) => {
    const matchTab = currentTab.slugs.includes(item.categorySlug);
    const matchSearch = search
      ? item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchTab && matchSearch;
  });

  const grouped = tabCategories
    .filter((c) => filteredItems.some((i) => i.categorySlug === c.slug))
    .map((c) => ({
      category: c,
      items: filteredItems.filter((i) => i.categorySlug === c.slug),
    }));

  return (
    <>
    {showPhone && !userSession && (
      <PhoneModal umbrellaId={umbrellaId} onClose={() => setShowPhone(false)} />
    )}
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-3xl mx-auto">
          <Link
            href={`/u/${umbrellaId}`}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>

          <div className="flex items-center gap-2">
            <img src="/Maya.png" alt="Maya" className="h-12 object-contain" />
            <ScratchX className="h-2.5 text-white/20" />
            <img src="/kuziini-logo.png" alt="Kuziini" className="h-6 object-contain invert brightness-200" />
          </div>

          <div className="flex items-center gap-2">
            {lastVisited ? (
              <Link
                href={lastVisited}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              >
                <ArrowRight className="w-4 h-4 text-white/70" />
              </Link>
            ) : (
              <div className="w-9 h-9 shrink-0" />
            )}
          </div>
        </div>

      </div>

      {/* Menu Tabs - LOFT style */}
      <div className="flex justify-center gap-2 md:gap-3 px-4 md:px-6 pb-8 max-w-3xl mx-auto">
        {MENU_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}
            className={cn(
              "px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase border transition-all duration-300",
              activeTab === tab.id
                ? "bg-white text-[#0A0A0A] border-white"
                : "bg-transparent text-white border-white/40 active:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 md:px-6 pb-32 max-w-3xl mx-auto">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="text-[#C9AB81]" />
          </div>
        )}

        {!isLoading && grouped.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-white/40 text-sm">Niciun produs găsit</p>
          </div>
        )}

        <div className="space-y-10">
          {grouped.map(({ category, items }) => (
            <section key={category.slug} className="text-center">
              {/* Category header - LOFT gold style */}
              <div className="mb-6">
                <h2 className="text-[#C9AB81] text-lg font-bold tracking-[0.25em] uppercase">
                  {category.name}
                </h2>
                <div className="w-12 h-px bg-[#C9AB81]/40 mx-auto mt-2" />
              </div>

              {/* Items */}
              <div className="space-y-1">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    umbrellaId={umbrellaId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

    </div>
    </>
  );
}
