"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Button, EmptyState, Divider } from "@/components/ui";
import { useCartStore, useSessionStore } from "@/store";
import { formatPrice } from "@/lib/utils";
import { PhoneModal } from "@/components/layout/PhoneModal";
import type { CartItem } from "@/types";

export default function CartPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const { userSession, addOrder } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [ownerApproval, setOwnerApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalNotes, setGlobalNotes] = useState("");

  const totalAmount = total();

  async function handleOrder() {
    if (!userSession) {
      setShowPhone(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umbrellaId,
          sessionId: userSession.sessionId,
          guestPhone: userSession.phone,
          role: userSession.role,
          items,
          ownerApprovalRequired: userSession.role === "guest" && ownerApproval,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      addOrder(json.data.order);
      clearCart();
      router.push(`/u/${umbrellaId}/orders`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la trimiterea comenzii.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Coș"
          back={
            <Link href={`/u/${umbrellaId}/menu`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
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
          title="Coș"
          subtitle={`${items.length} ${items.length === 1 ? "produs" : "produse"}`}
          back={
            <Link href={`/u/${umbrellaId}/menu`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
          }
          right={
            <button onClick={clearCart} className="text-xs text-coral-500 font-semibold font-body">
              Golește
            </button>
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
          <div className="bg-white rounded-3xl p-4 shadow-card">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body block mb-2">
              Observații generale
            </label>
            <textarea
              rows={2}
              placeholder="Alergii, preferințe sau alte mențiuni..."
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-body text-gray-700 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-ocean-200 resize-none"
            />
          </div>

          {/* Guest option */}
          {userSession?.role === "guest" && (
            <div className="bg-sand-50 border border-sand-200 rounded-3xl p-4">
              <p className="text-sm font-semibold text-sand-800 font-body mb-3">
                🤝 Cum vrei să trimiți comanda?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setOwnerApproval(false)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    !ownerApproval
                      ? "border-ocean-400 bg-ocean-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <span className="text-lg">🧾</span>
                  <div>
                    <p className="text-sm font-semibold font-body text-gray-900">
                      Notă separată
                    </p>
                    <p className="text-xs text-gray-500">Plătești independent</p>
                  </div>
                </button>
                <button
                  onClick={() => setOwnerApproval(true)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    ownerApproval
                      ? "border-ocean-400 bg-ocean-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <span className="text-lg">👑</span>
                  <div>
                    <p className="text-sm font-semibold font-body text-gray-900">
                      Atașează la nota owner-ului
                    </p>
                    <p className="text-xs text-gray-500">
                      Owner-ul trebuie să aprobe
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-3xl p-4 shadow-card">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500 font-body">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-body">
                <span>Livrare la șezlong</span>
                <span className="text-emerald-600 font-semibold">Gratuit</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-display text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-ocean-700">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Umbrella */}
          <div className="flex items-center justify-between bg-ocean-50 rounded-2xl px-4 py-3">
            <span className="text-sm text-ocean-700 font-body font-semibold">
              ⛱️ Umbrela {umbrellaId}
            </span>
            {userSession && (
              <span className="text-xs text-ocean-500 font-body">
                {userSession.phone}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-coral-50 rounded-2xl px-4 py-3 text-coral-700 text-sm font-body">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleOrder}
            loading={loading}
            icon={<ShoppingBag className="w-5 h-5" />}
          >
            {ownerApproval && userSession?.role === "guest"
              ? "Trimite cerere owner"
              : "Plasează comanda"}
          </Button>
        </div>
      </div>
    </>
  );
}

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  onUpdateQty: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-card flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 font-body text-sm leading-tight">
          {item.menuItem.name}
        </p>
        {item.notes && (
          <p className="text-xs text-gray-400 font-body mt-0.5">{item.notes}</p>
        )}
        <p className="text-ocean-600 font-bold font-body text-sm mt-1">
          {formatPrice(item.menuItem.price * item.quantity)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
        >
          {item.quantity === 1 ? (
            <Trash2 className="w-3.5 h-3.5 text-coral-500" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>
        <span className="text-base font-bold text-gray-900 w-5 text-center font-body">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-ocean-600 flex items-center justify-center text-white"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
