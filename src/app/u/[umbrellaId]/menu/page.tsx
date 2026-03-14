"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Spinner, EmptyState, PageHeader } from "@/components/ui";
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

export default function MenuPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const itemCount = useCartStore((s) => s.itemCount());
  const catBarRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["menu", umbrellaId],
    queryFn: () => fetchMenu(umbrellaId),
  });

  const categories = data?.categories ?? [];
  const allItems = data?.items ?? [];

  const filteredItems = allItems.filter((item) => {
    const matchCat = activeCategory ? item.categorySlug === activeCategory : true;
    const matchSearch = search
      ? item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  // Group by category for display
  const grouped = categories
    .filter((c) =>
      filteredItems.some((i) => i.categorySlug === c.slug)
    )
    .map((c) => ({
      category: c,
      items: filteredItems.filter((i) => i.categorySlug === c.slug),
    }));

  function scrollCatIntoView(slug: string) {
    const el = catBarRef.current?.querySelector(`[data-cat="${slug}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div>
      <PageHeader
        title="Meniu"
        subtitle="Kuziini × LOFT Lounge"
        back={
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
        }
        right={
          itemCount > 0 ? (
            <Link href={`/u/${umbrellaId}/cart`} className="relative w-9 h-9 rounded-full bg-ocean-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            </Link>
          ) : null
        }
      />

      {/* Search */}
      <div className="px-4 py-3 bg-cream sticky top-[57px] z-20">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Caută în meniu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-body text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div
          ref={catBarRef}
          className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide sticky top-[113px] z-20 bg-cream"
        >
          <button
            data-cat="all"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-semibold font-body transition-all",
              activeCategory === null
                ? "bg-ocean-600 text-white"
                : "bg-gray-100 text-gray-600"
            )}
          >
            Toate
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              data-cat={c.slug}
              onClick={() => {
                setActiveCategory(c.slug === activeCategory ? null : c.slug);
                scrollCatIntoView(c.slug);
              }}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-semibold font-body transition-all flex items-center gap-1.5",
                activeCategory === c.slug
                  ? "bg-ocean-600 text-white"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!isLoading && grouped.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Niciun produs găsit"
            description="Încearcă altă căutare sau altă categorie."
          />
        )}

        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <section key={category.slug}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{category.icon}</span>
                <h2 className="font-display text-xl font-bold text-gray-900">
                  {category.name}
                </h2>
                <span className="text-xs text-gray-400 font-body">
                  ({items.length})
                </span>
              </div>
              <div className="grid gap-3">
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
  );
}
