"use client";

import { useState } from "react";
import { Phone, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useSessionStore } from "@/store";
import { cn } from "@/lib/utils";

interface PhoneModalProps {
  umbrellaId: string;
  onClose: () => void;
}

export function PhoneModal({ umbrellaId, onClose }: PhoneModalProps) {
  const [phone, setPhone] = useState("+40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserSession } = useSessionStore();

  async function handleSubmit() {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 10) {
      setError("Introdu un număr de telefon valid.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ umbrellaId, phone: cleaned }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUserSession({
        phone: json.data.phone,
        role: json.data.role,
        sessionId: json.data.sessionId,
        umbrellaId: json.data.umbrellaId,
        joinedAt: json.data.joinedAt,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Eroare la înregistrare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[2rem] p-6 pb-10 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Bun venit! 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-body">
              Introdu numărul tău de telefon pentru a continua.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body mb-2 block">
            Număr de telefon
          </label>
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 border-transparent focus-within:border-ocean-300 transition-colors">
            <Phone className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900 font-body text-lg placeholder:text-gray-300"
              placeholder="+40 7XX XXX XXX"
              autoFocus
              inputMode="tel"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        {error && (
          <p className="text-coral-600 text-sm font-body mt-2">{error}</p>
        )}

        <p className="text-gray-400 text-xs font-body mt-3 mb-6 leading-relaxed">
          Numărul tău de telefon a fost înregistrat la recepție. Primul număr pe
          această umbrelă devine <strong>owner</strong>.
        </p>

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          loading={loading}
        >
          Continuă
        </Button>
      </div>
    </div>
  );
}
