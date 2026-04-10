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
  const { userSession, orders, clearSession, addClosedBill } = useSessionStore();
  const clearCart = useCartStore((s) => s.clearCart);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<"select" | "confirm" | "sending" | "done">("select");
  const [error, setError] = useState<string | null>(null);
  const [savedTotal, setSavedTotal] = useState(0);

  const { data: payOpts, isLoading: loadingOpts } = useQuery({
    queryKey: ["payment-options", umbrellaId],
    queryFn: () => fetchPaymentOptions(umbrellaId),
    enabled: !!userSession,
  });

  const myOrders = orders.filter(
    (o) => o.umbrellaId === umbrellaId && !["rejected", "cancelled"].includes(o.status)
  );
  const total = myOrders.reduce((s, o) => s + o.total, 0);

  function handleSelectMethod(method: PaymentMethod) {
    setSelectedMethod(method);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selectedMethod || !userSession) return;
    setStep("sending");
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
      addClosedBill({
        id: `bill-${Date.now()}`,
        umbrellaId,
        orders: myOrders,
        total,
        paymentMethod: selectedMethod!,
        closedAt: new Date().toISOString(),
      });
      setSavedTotal(total);
      clearCart();
      clearSession();
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la trimiterea notei.");
      setStep("confirm");
    }
  }

  // Confirmation step — "Ai selectat plata Cash/Card"
  if (step === "confirm" && selectedMethod) {
    const methodLabel = selectedMethod === "cash" ? "Cash" : selectedMethod === "card" ? "Card" : "Room Charge";
    const methodIcon = selectedMethod === "cash" ? <Banknote className="w-8 h-8" /> : selectedMethod === "card" ? <CreditCard className="w-8 h-8" /> : <Hotel className="w-8 h-8" />;
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 md:px-8 text-center">
        <div className="w-20 md:w-24 h-20 md:h-24 flex items-center justify-center mb-6 bg-[#C9AB81]/20 border border-[#C9AB81]/30 text-[#C9AB81] rounded-2xl">
          {methodIcon}
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">
          Ai selectat plata {methodLabel}
        </h2>
        <p className="text-white/40 text-sm mb-2">
          Total: <span className="text-[#C9AB81] font-bold">{formatPrice(total)}</span>
        </p>
        <p className="text-white/40 text-sm mb-8">
          Umbrela {umbrellaId}
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full max-w-xs md:max-w-sm bg-emerald-500 text-white py-4 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity mb-3 rounded-xl"
        >
          Confirmă și trimite nota
        </button>
        <button
          onClick={() => { setStep("select"); setSelectedMethod(null); }}
          className="text-white/40 text-xs font-bold tracking-wider uppercase py-2"
        >
          Schimbă metoda de plată
        </button>
      </div>
    );
  }

  // Sending step
  if (step === "sending") {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <Spinner className="text-[#C9AB81] mb-6" />
        <p className="text-white/40 text-sm">Se trimite nota...</p>
      </div>
    );
  }

  // Done — waiter animation
  if (step === "done") {
    const methodLabel = selectedMethod === "cash" ? "Cash" : selectedMethod === "card" ? "Card" : "Room Charge";
    const statusMsg = selectedMethod === "cash"
      ? "Un ospătar vine spre tine cu nota."
      : selectedMethod === "card"
      ? "Pregătește cardul, ospătarul vine cu POS-ul."
      : "Suma a fost adăugată pe cameră.";
    return (
      <div className="min-h-dvh bg-gradient-to-b from-white via-white/10 to-[#0A0A0A] flex flex-col items-center text-center relative">
        {/* Emojis separated with Maya logo visible between them */}
        <div className="flex-1 flex items-center justify-center w-full relative">
          <img src="/Maya.png" alt="Maya" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 object-contain pointer-events-none" />
          <div className="flex items-center justify-between w-full px-2 relative z-10">
            <span className="text-5xl animate-bounce">🏃‍♂️</span>
            <div className="relative animate-bounce" style={{ animationDelay: "0.3s" }}>
              {/* CSS Receipt */}
              <div className="w-8 bg-white rounded-t-md shadow-xl -rotate-6" style={{
                clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 8px), 92% 100%, 84% calc(100% - 6px), 76% 100%, 68% calc(100% - 6px), 60% 100%, 52% calc(100% - 6px), 44% 100%, 36% calc(100% - 6px), 28% 100%, 20% calc(100% - 6px), 12% 100%, 4% calc(100% - 6px), 0% 100%)"
              }}>
                <div className="px-1.5 pt-2 pb-3">
                  <p className="text-[4px] font-bold text-center text-gray-800 tracking-wider uppercase mb-0.5">Receipt</p>
                  <div className="w-full h-px bg-gray-300 mb-1" />
                  <img src="/kuziini-logo.png" alt="" className="h-3 object-contain mx-auto mb-1 opacity-40" />
                  <div className="space-y-0.5">
                    <div className="h-px bg-gray-200 w-3/4" />
                    <div className="h-px bg-gray-200 w-full" />
                    <div className="h-px bg-gray-200 w-2/3" />
                    <div className="h-px bg-gray-200 w-4/5" />
                  </div>
                  <div className="w-full h-px bg-gray-300 mt-1 mb-0.5" />
                  <div className="flex justify-between">
                    <span className="text-[4px] text-gray-500 font-bold">TOTAL</span>
                    <span className="text-[4px] text-gray-800 font-bold">{formatPrice(savedTotal)}</span>
                  </div>
                  {/* Barcode */}
                  <div className="flex gap-px mt-1.5 justify-center">
                    {[2,1,3,1,2,1,3,2,1,2,1,3,1,2].map((w, i) => (
                      <div key={i} className="bg-gray-800 rounded-sm" style={{ width: w * 1, height: 7 }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Payment method icon */}
              {selectedMethod === "card" && (
                <div className="absolute -bottom-2 -right-4 w-7 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-lg flex items-center justify-end pr-0.5 gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-300/80 -ml-1" />
                </div>
              )}
              {selectedMethod === "room-charge" && (
                <div className="absolute -bottom-2 -right-4 text-2xl">🔑</div>
              )}
            </div>
          </div>
        </div>

        {/* Details card with status message as title */}
        <div className="w-full max-w-xs md:max-w-sm mb-6 px-6 md:px-8">
          <div className="bg-white/[0.03] border border-white/[0.06] px-6 py-4 rounded-2xl">
            <p className="text-white font-bold text-sm tracking-wide mb-3">
              {statusMsg}
            </p>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/40">Total</span>
              <span className="text-[#C9AB81] font-bold">{formatPrice(savedTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/40">Plată</span>
              <span className="text-white font-bold">{methodLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Umbrela</span>
              <span className="text-white font-bold">{umbrellaId}</span>
            </div>
          </div>
        </div>

        {/* Message + actions */}
        <p className="text-white/40 text-xs mb-4 tracking-wide">
          Până ajunge ospătarul poți vizita
        </p>
        <div className="flex items-center gap-3 mb-6 w-full max-w-xs md:max-w-sm">
          <a
            href="https://www.instagram.com/kuziiniconceptstore/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center border border-[#C9AB81]/30 py-3 px-8 rounded-xl text-[#C9AB81] font-bold text-xs tracking-[0.15em] uppercase active:bg-[#C9AB81]/10 transition-colors"
          >
            Kuziini
          </a>
          <button
            onClick={() => router.push("/#about")}
            className="flex-1 flex items-center justify-center border border-[#C9AB81]/30 py-3 px-8 rounded-xl text-[#C9AB81] font-bold text-xs tracking-[0.15em] uppercase active:bg-[#C9AB81]/10 transition-colors"
          >
            Acasă
          </button>
        </div>

        {/* Kuziini logo → Instagram */}
        <a
          href="https://www.instagram.com/kuziiniconceptstore/"
          target="_blank"
          rel="noopener noreferrer"
          className="animate-pulse mb-8"
        >
          <img src="/kuziini-logo.png" alt="Kuziini" className="h-16 object-contain invert brightness-200 opacity-70 active:opacity-100 transition-all hover:scale-105" />
        </a>

        {/* Nota a fost transmisă - at the very bottom */}
        <p className="text-white/30 text-sm mb-6">
          Nota ta a fost transmisă ✨
        </p>
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

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl mx-auto">
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
                description="Plată în numerar"
                available={payOpts?.cash ?? true}
                onSelect={() => handleSelectMethod("cash")}
              />
              <PaymentOption
                icon={<CreditCard className="w-5 h-5" />}
                label="Card"
                description="Visa, Mastercard, contactless"
                available={payOpts?.card ?? true}
                onSelect={() => handleSelectMethod("card")}
              />
              <PaymentOption
                icon={<Hotel className="w-5 h-5" />}
                label="Room Charge"
                description={
                  payOpts?.creditStatus
                    ? `Camera ${payOpts.creditStatus.roomNumber} · Disponibil: ${formatPrice(payOpts.creditStatus.limitAvailable)}`
                    : "Adaugă pe cameră"
                }
                available={payOpts?.roomCharge ?? false}
                disabled={
                  !payOpts?.roomCharge ||
                  (payOpts.creditStatus ? total > payOpts.creditStatus.limitAvailable : false)
                }
                disabledReason={
                  !payOpts?.roomCharge
                    ? "Room charge indisponibil"
                    : payOpts.creditStatus && total > payOpts.creditStatus.limitAvailable
                    ? `Limită depășită. Disponibil: ${formatPrice(payOpts.creditStatus.limitAvailable)}`
                    : undefined
                }
                onSelect={() => handleSelectMethod("room-charge")}
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
  icon, label, description, available, disabled, disabledReason, onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
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
          "w-full flex items-center gap-4 p-4 border transition-all text-left active:bg-white/[0.06]",
          "border-white/[0.06] bg-white/[0.03]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="w-11 h-11 flex items-center justify-center bg-white/10 text-white/50">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm tracking-wide">{label}</p>
          <p className="text-xs text-white/30 truncate">{description}</p>
        </div>
        {!isDisabled && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
      </button>
      {isDisabled && disabledReason && (
        <p className="text-xs text-red-400 mt-1 px-2">{disabledReason}</p>
      )}
    </div>
  );
}
