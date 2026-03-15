"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Banknote, Hotel, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState, Divider, Spinner } from "@/components/ui";
import { useSessionStore, useCartStore } from "@/store";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PaymentOptions, PaymentMethod } from "@/types";

async function fetchPaymentOptions(umbrellaId: string) {
  const res = await fetch(`/api/payment-options?umbrellaId=${umbrellaId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as PaymentOptions;
}

export default function BillPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const router = useRouter();
  const { userSession, orders, clearSession } = useSessionStore();
  const clearCart = useCartStore((s) => s.clearCart);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: payOpts, isLoading: loadingOpts } = useQuery({
    queryKey: ["payment-options", umbrellaId],
    queryFn: () => fetchPaymentOptions(umbrellaId),
    enabled: !!userSession,
  });

  const myOrders = orders.filter(
    (o) => o.umbrellaId === umbrellaId && !["rejected", "cancelled"].includes(o.status)
  );
  const total = myOrders.reduce((s, o) => s + o.total, 0);

  async function handleClose() {
    if (!selectedMethod || !userSession) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bill/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umbrellaId,
          sessionId: userSession.sessionId,
          paymentMethod: selectedMethod,
          amount: total,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Auto-logout: clear session + cart, then show success
      clearCart();
      clearSession();
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la trimiterea notei.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 flex items-center justify-center mb-6 bg-emerald-500/20 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-wide">
          Nota a fost încasată!
        </h2>
        <p className="text-white/40 text-sm mb-4">
          {selectedMethod === "room-charge"
            ? `Suma de ${formatPrice(total)} a fost adăugată la camera ta.`
            : `Total plătit: ${formatPrice(total)} · ${selectedMethod === "cash" ? "Cash" : "Card"}`}
        </p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 mb-2">
          <p className="text-emerald-400 text-sm font-bold tracking-wide mb-1">
            Plata a fost confirmată
          </p>
          <p className="text-white/30 text-xs">
            Umbrela {umbrellaId} · Sesiunea se va închide automat
          </p>
        </div>
        <p className="text-white/30 text-sm mb-8">
          Mulțumim că ai ales LOFT
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-[#C9AB81] text-[#0A0A0A] px-6 py-3 font-bold text-sm tracking-[0.1em] uppercase"
        >
          Înapoi la pagina principală
        </button>
      </div>
    );
  }

  if (!userSession) {
    return (
      <div>
        <PageHeader title="Solicită nota" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10"><ArrowLeft className="w-4 h-4 text-white/70" /></Link>} />
        <EmptyState icon="🔐" title="Identificare necesară" description="Identifică-te pentru a solicita nota." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Solicită nota"
        subtitle={`Umbrela ${umbrellaId}`}
        back={
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Orders summary */}
        {myOrders.length > 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] p-4">
            <h3 className="text-[#C9AB81] text-xs font-bold tracking-[0.2em] uppercase mb-3">
              Sumar comenzi
            </h3>
            <div className="space-y-2">
              {myOrders.map((o) =>
                o.items.map((item, i) => (
                  <div key={`${o.id}-${i}`} className="flex justify-between text-sm text-white/60">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between text-xl font-bold text-white">
              <span>Total</span>
              <span className="text-[#C9AB81]">{formatPrice(total)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-400 font-bold text-sm mb-1">
              Nu ai produse în comandă!
            </p>
            <p className="text-white/40 text-xs mb-4">
              Adaugă produse din meniu înainte de a solicita nota.
            </p>
            <Link
              href={`/u/${umbrellaId}`}
              className="inline-flex items-center gap-2 bg-[#C9AB81] text-[#0A0A0A] px-5 py-2.5 font-bold text-xs tracking-[0.1em] uppercase"
            >
              Înapoi la meniu
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Payment methods - only show when there are orders */}
        {myOrders.length > 0 && <div>
          <h3 className="text-[#C9AB81] text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Metodă de plată
          </h3>

          {loadingOpts ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              <PaymentOption
                icon={<Banknote className="w-5 h-5" />}
                label="Cash"
                description="Plată în numerar la livrare"
                value="cash"
                selected={selectedMethod === "cash"}
                confirming={selectedMethod === "cash" && confirming}
                loading={selectedMethod === "cash" && loading}
                available={payOpts?.cash ?? true}
                onSelect={() => {
                  if (selectedMethod === "cash" && confirming) {
                    handleClose();
                  } else {
                    setSelectedMethod("cash");
                    setConfirming(true);
                  }
                }}
              />
              <PaymentOption
                icon={<CreditCard className="w-5 h-5" />}
                label="Card"
                description="Visa, Mastercard, contactless"
                value="card"
                selected={selectedMethod === "card"}
                confirming={selectedMethod === "card" && confirming}
                loading={selectedMethod === "card" && loading}
                available={payOpts?.card ?? true}
                onSelect={() => {
                  if (selectedMethod === "card" && confirming) {
                    handleClose();
                  } else {
                    setSelectedMethod("card");
                    setConfirming(true);
                  }
                }}
              />
              <PaymentOption
                icon={<Hotel className="w-5 h-5" />}
                label="Room Charge"
                description={
                  payOpts?.creditStatus
                    ? `Camera ${payOpts.creditStatus.roomNumber} · Disponibil: ${formatPrice(payOpts.creditStatus.limitAvailable)}`
                    : "Adaugă pe cameră"
                }
                value="room-charge"
                selected={selectedMethod === "room-charge"}
                confirming={selectedMethod === "room-charge" && confirming}
                loading={selectedMethod === "room-charge" && loading}
                available={payOpts?.roomCharge ?? false}
                disabled={
                  !payOpts?.roomCharge ||
                  (payOpts.creditStatus ? total > payOpts.creditStatus.limitAvailable : false)
                }
                disabledReason={
                  !payOpts?.roomCharge
                    ? "Room charge indisponibil pentru această sesiune"
                    : payOpts.creditStatus && total > payOpts.creditStatus.limitAvailable
                    ? `Limită depășită. Disponibil: ${formatPrice(payOpts.creditStatus.limitAvailable)}`
                    : undefined
                }
                onSelect={() => {
                  if (selectedMethod === "room-charge" && confirming) {
                    handleClose();
                  } else {
                    setSelectedMethod("room-charge");
                    setConfirming(true);
                  }
                }}
              />
            </div>
          )}
        </div>}

        {/* Credit info */}
        {payOpts?.creditStatus?.eligible && (
          <div className="bg-[#C9AB81]/10 border border-[#C9AB81]/20 p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em]">
              Credit disponibil
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Limită totală</span>
              <span className="text-white font-bold">{formatPrice(payOpts.creditStatus.limitTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Deja consumat</span>
              <span className="text-white/60">{formatPrice(payOpts.creditStatus.limitUsed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Disponibil rămas</span>
              <span className="text-emerald-400 font-bold">{formatPrice(payOpts.creditStatus.limitAvailable)}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 mt-1">
              <div
                className="bg-[#C9AB81] h-1.5 transition-all"
                style={{ width: `${(payOpts.creditStatus.limitUsed / payOpts.creditStatus.limitTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

{/* Button removed - payment confirms directly on method selection */}
      </div>
    </div>
  );
}

function PaymentOption({
  icon, label, description, selected, available, confirming, loading: isLoading, disabled, disabledReason, onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: PaymentMethod;
  selected: boolean;
  available: boolean;
  confirming?: boolean;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  const isDisabled = (disabled || !available) && !confirming;
  const isConfirming = selected && confirming;

  return (
    <div>
      <button
        disabled={isDisabled || isLoading}
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-4 p-4 border transition-all text-left",
          isConfirming
            ? "border-emerald-500 bg-emerald-500/15 animate-pulse-subtle"
            : selected
            ? "border-[#C9AB81] bg-[#C9AB81]/10"
            : "border-white/[0.06] bg-white/[0.03]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "w-11 h-11 flex items-center justify-center transition-colors",
          isConfirming
            ? "bg-emerald-500 text-white"
            : selected
            ? "bg-[#C9AB81] text-[#0A0A0A]"
            : "bg-white/10 text-white/50"
        )}>
          {isLoading ? <Spinner /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          {isConfirming ? (
            <>
              <p className="font-bold text-emerald-400 text-sm tracking-wide">
                Confirmă plata cu {label}?
              </p>
              <p className="text-xs text-emerald-400/60">
                Apasă din nou pentru a confirma
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-white text-sm tracking-wide">{label}</p>
              <p className="text-xs text-white/30 truncate">{description}</p>
            </>
          )}
        </div>
        {isConfirming && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
        {selected && !isConfirming && <CheckCircle2 className="w-5 h-5 text-[#C9AB81] shrink-0" />}
        {!selected && !isDisabled && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
      </button>
      {isDisabled && disabledReason && (
        <p className="text-xs text-red-400 mt-1 px-2">{disabledReason}</p>
      )}
    </div>
  );
}
