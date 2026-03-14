"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, AlertCircle } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store";
import { Badge } from "@/components/ui";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  umbrellaId: string;
}

export function MenuItemCard({ item, umbrellaId }: MenuItemCardProps) {
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const { addItem, items: cartItems, updateQuantity, removeItem } = useCartStore();

  const cartItem = cartItems.find((i) => i.menuItem.id === item.id);
  const inCart = !!cartItem;

  function handleAdd() {
    addItem(item, qty, notes);
    setExpanded(false);
    setQty(1);
    setNotes("");
  }

  return (
    <div
      className={cn(
        "bg-white rounded-3xl shadow-card overflow-hidden transition-all duration-300",
        !item.available && "opacity-60",
        expanded && "shadow-card-hover"
      )}
    >
      <div
        className="flex gap-3 p-4 cursor-pointer"
        onClick={() => item.available && setExpanded((e) => !e)}
      >
        {/* Image */}
        {item.image ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
            <Image
              src={item.image}
              alt={item.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ocean-50 to-sand-100 flex items-center justify-center shrink-0">
            <span className="text-3xl">{getCategoryEmoji(item.categorySlug)}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 font-body text-sm leading-snug">
                  {item.name}
                </h3>
                {item.popular && (
                  <Badge variant="coral" className="text-[10px]">
                    Popular
                  </Badge>
                )}
                {!item.available && (
                  <Badge variant="gray" className="text-[10px]">
                    Indisponibil
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 font-body mt-0.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="font-display text-base font-bold text-ocean-700">
              {formatPrice(item.price)}
            </span>

            {inCart ? (
              <div className="flex items-center gap-2 bg-ocean-50 rounded-full px-2 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cartItem.quantity > 1
                      ? updateQuantity(item.id, cartItem.quantity - 1)
                      : removeItem(item.id);
                  }}
                  className="w-6 h-6 rounded-full bg-white text-ocean-600 flex items-center justify-center shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold text-ocean-700 w-4 text-center">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, cartItem.quantity + 1);
                  }}
                  className="w-6 h-6 rounded-full bg-ocean-600 text-white flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : item.available ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(item, 1);
                }}
                className="w-8 h-8 rounded-full bg-ocean-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded add panel */}
      {expanded && item.available && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 font-body">
              Cantitate
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-6 text-center font-body">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-full bg-ocean-600 text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            placeholder="Observații (ex: fără gheață, extra lime...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-body text-gray-700 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-ocean-200 resize-none mb-3"
          />

          <button
            onClick={handleAdd}
            className="w-full bg-ocean-600 text-white rounded-2xl py-3 font-semibold font-body flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            Adaugă în coș — {formatPrice(item.price * qty)}
          </button>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    cocktails: "🍹",
    bar: "🥂",
    beer: "🍺",
    "soft-drinks": "🥤",
    water: "💧",
    food: "🍽️",
    snacks: "🥨",
    "ice-cream": "🍦",
    restaurant: "🍴",
  };
  return map[slug] ?? "🍴";
}
