"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CreditCard, Banknote, Hotel, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { PageHeader, Button, EmptyState, Divider, Spinner } from "@/components/ui";
import { useSessionStore } from "@/store";
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
  const { userSession, orders, clearSession } = useSessionStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
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
      if (selectedMethod === "room-charge") {
        const res = await fetch("/api/bill/charge-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            umbrellaId,
            sessionId: userSession.sessionId,
            phone: userSession.phone,
            amount: total,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      } else {
        const res = await fetch("/api/bill/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            umbrellaId,
            sessionId: userSession.sessionId,
            paymentMethod: selectedMethod,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }
      setDone(true);
      // Clear session — umbrella is released
      clearSession();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la închiderea notei.");
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
          Notă închisă!
        </h2>
        <p className="text-white/40 text-sm mb-2">
          {selectedMethod === "room-charge"
            ? `Suma de ${formatPrice(total)} a fost adăugată la camera ta.`
            : `Plata de ${formatPrice(total)} confirmată. Mulțumim!`}
        </p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-2">
          <p className="text-emerald-400 text-sm font-bold tracking-wide">
            ⛱️ Șezlongul {umbrellaId} a fost eliberat
          </p>
        </div>
        <p className="text-white/30 text-sm mb-8">
          A fost o plăcere să te servim
        </p>
        <Link href={`/u/${umbrellaId}`}>
          <Button variant="secondary">Înapoi la umbrelă</Button>
        </Link>
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
          <div className="bg-white/[0.03] border border-white/[0.06] p-4 text-center">
            <p className="text-white/40 text-sm">
              Nu ai comenzi active pe această sesiune.
            </p>
          </div>
        )}

        {/* Payment methods */}
        <div>
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
                available={payOpts?.cash ?? true}
                onSelect={() => setSelectedMethod("cash")}
              />
              <PaymentOption
                icon={<CreditCard className="w-5 h-5" />}
                label="Card"
                description="Visa, Mastercard, contactless"
                value="card"
                selected={selectedMethod === "card"}
                available={payOpts?.card ?? true}
                onSelect={() => setSelectedMethod("card")}
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
                onSelect={() => setSelectedMethod("room-charge")}
              />
            </div>
          )}
        </div>

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

        <Button
          fullWidth
          size="lg"
          disabled={!selectedMethod || myOrders.length === 0}
          loading={loading}
          onClick={handleClose}
        >
          {selectedMethod
            ? `Plătesc cu ${selectedMethod === "cash" ? "Cash" : selectedMethod === "card" ? "Card" : "Room Charge"}`
            : "Selectează metoda de plată"}
        </Button>
      </div>
    </div>
  );
}

function PaymentOption({
  icon, label, description, value, selected, available, disabled, disabledReason, onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: PaymentMethod;
  selected: boolean;
  available: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  const isDisabled = disabled || !available;

  return (
    <div>
      <button
        disabled={isDisabled}
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-4 p-4 border transition-all text-left",
          selected ? "border-[#C9AB81] bg-[#C9AB81]/10" : "border-white/[0.06] bg-white/[0.03]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "w-11 h-11 flex items-center justify-center",
          selected ? "bg-[#C9AB81] text-[#0A0A0A]" : "bg-white/10 text-white/50"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm tracking-wide">{label}</p>
          <p className="text-xs text-white/30 truncate">{description}</p>
        </div>
        {selected && <CheckCircle2 className="w-5 h-5 text-[#C9AB81] shrink-0" />}
        {!selected && !isDisabled && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
      </button>
      {isDisabled && disabledReason && (
        <p className="text-xs text-red-400 mt-1 px-2">{disabledReason}</p>
      )}
    </div>
  );
}
