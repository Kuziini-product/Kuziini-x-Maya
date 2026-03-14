"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  umbrellaId: string;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [qty, setQty] = useState(1);
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
    <div className="text-center py-3 border-b border-white/5 last:border-b-0">
      {/* Main row - clickable */}
      <div
        className={`cursor-pointer active:opacity-70 transition-opacity ${!item.available ? "opacity-40" : ""}`}
        onClick={() => item.available && setExpanded((e) => !e)}
      >
        {/* Item name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <h3 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">
            {item.name}
          </h3>
          {item.popular && (
            <span className="text-[#C9AB81] text-[9px] tracking-wider uppercase">★</span>
          )}
          {inCart && (
            <span className="bg-[#C9AB81] text-[#0A0A0A] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
              ×{cartItem.quantity}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-white/35 text-[11px] leading-relaxed mb-1 max-w-[300px] mx-auto">
          {item.description}
        </p>

        {/* Price */}
        <p className="text-[#C9AB81] text-sm font-bold tracking-wide">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Expanded - add to cart panel */}
      {expanded && item.available && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-fade-up max-w-[280px] mx-auto">
          {/* Quantity */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-white/20 text-white/60 flex items-center justify-center active:bg-white/10"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white text-lg font-bold w-6 text-center">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-full border border-[#C9AB81]/50 text-[#C9AB81] flex items-center justify-center active:bg-[#C9AB81]/10"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Observații..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#C9AB81]/40 resize-none mb-3"
          />

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-2.5 font-bold text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            ADAUGĂ — {formatPrice(item.price * qty)}
          </button>

          {/* Quick remove if in cart */}
          {inCart && (
            <button
              onClick={() => removeItem(item.id)}
              className="w-full mt-1.5 py-2 text-[10px] text-white/30 tracking-wider uppercase active:text-white/60 transition-colors"
            >
              ELIMINĂ DIN COȘ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
