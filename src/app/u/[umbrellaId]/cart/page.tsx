"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { PageHeader, Button, EmptyState, Divider } from "@/components/ui";
import { useCartStore, useSessionStore } from "@/store";
import { formatPrice } from "@/lib/utils";
import { PhoneModal } from "@/components/layout/PhoneModal";
import type { CartItem } from "@/types";

export default function CartPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const { userSession } = useSessionStore();
  const [showPhone, setShowPhone] = useState(false);
  const [globalNotes, setGlobalNotes] = useState("");

  const totalAmount = total();

  // Listen for phone modal request from BottomNav
  useEffect(() => {
    const handler = () => setShowPhone(true);
    window.addEventListener("show-phone-modal", handler);
    return () => window.removeEventListener("show-phone-modal", handler);
  }, []);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Coș"
          back={
            <Link href={`/u/${umbrellaId}/menu`} className="w-9 h-9 flex items-center justify-center bg-white/10">
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </Link>
          }
        />
        <EmptyState
          icon="🛒"
          title="Coșul este gol"
          description="Adaugă produse din meniu pentru a plasa o comandă."
          action={
            <Link href={`/u/${umbrellaId}/menu`}>
              <Button icon={<ShoppingBag className="w-4 h-4" />}>
                Vezi meniul
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      {showPhone && !userSession && (
        <PhoneModal umbrellaId={umbrellaId} onClose={() => setShowPhone(false)} />
      )}

      <div>
        <PageHeader
          title="Comanda ta"
          back={
            <Link href={`/u/${umbrellaId}/menu`} className="w-9 h-9 flex items-center justify-center bg-white/10">
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </Link>
          }
          right={
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white font-bold tracking-[0.15em] uppercase border border-white/20 bg-white/[0.06] px-3 py-1.5">
                Coș ({items.length})
              </span>
              <Link href={`/u/${umbrellaId}/menu`} className="text-[10px] text-[#C9AB81] font-bold tracking-[0.15em] uppercase border border-[#C9AB81]/30 px-3 py-1.5 active:bg-[#C9AB81]/10 transition-colors">
                Continuă
              </Link>
              <button onClick={clearCart} className="text-[10px] text-red-400 font-bold tracking-[0.15em] uppercase border border-red-400/30 px-3 py-1.5 active:bg-red-400/10 transition-colors">
                Golește
              </button>
            </div>
          }
        />

        <div className="px-4 py-4 space-y-3">
          {/* Items */}
          {items.map((item) => (
            <CartItemRow
              key={item.menuItem.id}
              item={item}
              onUpdateQty={(q) => updateQuantity(item.menuItem.id, q)}
              onRemove={() => removeItem(item.menuItem.id)}
            />
          ))}

          {/* Notes */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-4">
            <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] block mb-2">
              Observații generale
            </label>
            <textarea
              rows={2}
              placeholder="Alergii, preferințe sau alte mențiuni..."
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              className="w-full bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#C9AB81]/30 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/40">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/40">
                <span>Livrare la șezlong</span>
                <span className="text-emerald-400 font-bold">Gratuit</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span className="text-[#C9AB81]">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-[#C9AB81]/10 border border-[#C9AB81]/20 px-4 py-3">
            <span className="text-sm text-[#C9AB81] font-bold tracking-wide">
              📍 Livrare: Umbrela {umbrellaId}
            </span>
          </div>

        </div>
      </div>
    </>
  );
}

function CartItemRow({
  item,
  onUpdateQty,
}: {
  item: CartItem;
  onUpdateQty: (q: number) => void;
  onRemove: () => void;
}) {
  const isPromo = !!item.promoLabel;
  return (
    <div className={`p-4 flex items-center gap-3 ${
      isPromo
        ? "bg-emerald-500/[0.08] border border-emerald-500/20"
        : "bg-white/[0.03] border border-white/[0.06]"
    }`}>
      <div className="flex-1 min-w-0">
        {isPromo && (
          <p className="text-emerald-400 text-[9px] font-bold tracking-[0.15em] uppercase mb-1">
            {item.promoLabel}
          </p>
        )}
        <p className="font-bold text-white text-sm tracking-wide uppercase">
          {item.menuItem.name}
        </p>
        {item.notes && (
          <p className="text-xs text-white/30 mt-0.5">{item.notes}</p>
        )}
        <p className={`font-bold text-sm mt-1 ${isPromo ? "text-emerald-400" : "text-[#C9AB81]"}`}>
          {formatPrice(item.menuItem.price * item.quantity)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="w-8 h-8 flex items-center justify-center bg-white/10 text-white/60"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>
        <span className="text-base font-bold text-white w-5 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className={`w-8 h-8 flex items-center justify-center ${
            isPromo ? "bg-emerald-500 text-white" : "bg-[#C9AB81] text-[#0A0A0A]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
