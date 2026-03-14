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
  const { userSession, orders } = useSessionStore();
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la închiderea notei.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-beach-gradient flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">
          Notă închisă!
        </h2>
        <p className="text-gray-500 text-sm font-body mb-2">
          {selectedMethod === "room-charge"
            ? `Suma de ${formatPrice(total)} a fost adăugată la camera ta.`
            : `Plata de ${formatPrice(total)} confirmată. Mulțumim!`}
        </p>
        <p className="text-gray-400 text-sm font-body mb-8">
          A fost o plăcere să te servim 🌊
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
        <PageHeader title="Solicită nota" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></Link>} />
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
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Orders summary */}
        {myOrders.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-4">
            <h3 className="font-display text-base font-bold text-gray-900 mb-3">
              Sumar comenzi
            </h3>
            <div className="space-y-2">
              {myOrders.map((o) =>
                o.items.map((item, i) => (
                  <div key={`${o.id}-${i}`} className="flex justify-between text-sm font-body text-gray-700">
                    <span>{item.quantity}× {item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between font-display text-xl font-bold text-gray-900">
              <span>Total</span>
              <span className="text-ocean-700">{formatPrice(total)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-sand-50 rounded-3xl p-4 text-center">
            <p className="text-sand-700 text-sm font-body">
              Nu ai comenzi active pe această sesiune.
            </p>
          </div>
        )}

        {/* Payment methods */}
        <div>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-3">
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
          <div className="bg-ocean-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-ocean-700 uppercase tracking-wide font-body">
              Credit disponibil
            </p>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-600">Limită totală</span>
              <span className="text-gray-800 font-semibold">{formatPrice(payOpts.creditStatus.limitTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-600">Deja consumat</span>
              <span className="text-gray-800">{formatPrice(payOpts.creditStatus.limitUsed)}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-600">Disponibil rămas</span>
              <span className="text-emerald-700 font-bold">{formatPrice(payOpts.creditStatus.limitAvailable)}</span>
            </div>
            <div className="w-full bg-ocean-100 rounded-full h-2 mt-1">
              <div
                className="bg-ocean-500 h-2 rounded-full transition-all"
                style={{ width: `${(payOpts.creditStatus.limitUsed / payOpts.creditStatus.limitTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-coral-50 rounded-2xl px-4 py-3 text-coral-700 text-sm font-body">
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
          "w-full flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left",
          selected ? "border-ocean-500 bg-ocean-50" : "border-gray-100 bg-white",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center",
          selected ? "bg-ocean-600 text-white" : "bg-gray-100 text-gray-500"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 font-body text-sm">{label}</p>
          <p className="text-xs text-gray-400 font-body truncate">{description}</p>
        </div>
        {selected && <CheckCircle2 className="w-5 h-5 text-ocean-600 shrink-0" />}
        {!selected && !isDisabled && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
      </button>
      {isDisabled && disabledReason && (
        <p className="text-xs text-coral-500 font-body mt-1 px-2">{disabledReason}</p>
      )}
    </div>
  );
}
