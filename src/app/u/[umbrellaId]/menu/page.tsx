"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { useCartStore } from "@/store";
import { cn } from "@/lib/utils";
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
  const itemCount = useCartStore((s) => s.itemCount());


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
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={`/u/${umbrellaId}`}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>

          <div className="text-center">
            <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-[#C9AB81]">
              LOFT
            </h1>
            <p className="text-[10px] text-white/40 tracking-widest uppercase">
              Mamaia
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Search className="w-4 h-4 text-white/70" />
            </button>
            {itemCount > 0 && (
              <Link
                href={`/u/${umbrellaId}/cart`}
                className="relative w-9 h-9 rounded-full bg-[#C9AB81] flex items-center justify-center"
              >
                <ShoppingBag className="w-4 h-4 text-[#0A0A0A]" />
                <span className="absolute -top-1 -right-1 bg-white text-[#0A0A0A] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="px-4 pb-3 animate-fade-up">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Caută în meniu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Kuziini × LOFT Logos */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src="/kuziini-logo.png"
            alt="Kuziini"
            className="h-12 object-contain invert brightness-200"
          />
          <span className="text-[#C9AB81] text-xl font-bold">×</span>
          <img
            src="https://loftlounge.ro/wp-content/uploads/2025/07/LOFT-White-Transparent-LOGO-1024x330.png"
            alt="LOFT"
            className="h-10 object-contain"
          />
        </div>
        <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase">
          The best restaurant is a club, and the best club is a restaurant
        </p>
      </div>

      {/* Menu Tabs - LOFT style */}
      <div className="flex justify-center gap-2 px-4 pb-8">
        {MENU_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}
            className={cn(
              "px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all duration-300",
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
      <div className="px-5 pb-32">
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

      {/* Floating cart button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-slide-up">
          <Link
            href={`/u/${umbrellaId}/cart`}
            className="flex items-center justify-center gap-3 w-full bg-[#C9AB81] text-[#0A0A0A] py-4 rounded-none font-bold text-sm tracking-[0.15em] uppercase active:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" />
            VEZI COȘUL ({itemCount})
          </Link>
        </div>
      )}
    </div>
  );
}
