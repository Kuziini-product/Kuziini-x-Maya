"use client";

import { useState } from "react";
import { Phone, User, X } from "lucide-react";
import { useSessionStore } from "@/store";

interface PhoneModalProps {
  umbrellaId: string;
  onClose: () => void;
}

export function PhoneModal({ umbrellaId, onClose }: PhoneModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserSession } = useSessionStore();

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Introdu numele tău.");
      return;
    }
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
        body: JSON.stringify({ umbrellaId, phone: cleaned, name: trimmedName }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUserSession({
        phone: json.data.phone,
        name: trimmedName,
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet - dark LOFT style */}
      <div className="relative w-full max-w-lg bg-[#141414] border-t border-[#C9AB81]/30 p-6 pb-10 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Bun venit
            </h2>
            <p className="text-white/40 text-xs mt-1 tracking-wide">
              Introdu datele tale pentru a comanda
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 active:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name field */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
            Nume
          </label>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
            <User className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
              placeholder="Numele tău"
              autoFocus
            />
          </div>
        </div>

        {/* Phone field */}
        <div className="mb-2">
          <label className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2 block">
            Telefon
          </label>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 focus-within:border-[#C9AB81]/50 transition-colors">
            <Phone className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/20"
              placeholder="+40 7XX XXX XXX"
              inputMode="tel"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}

        <p className="text-white/20 text-[10px] mt-3 mb-6 leading-relaxed">
          Numărul tău de telefon a fost înregistrat la recepție. Primul număr pe
          această umbrelă devine owner.
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loading ? "Se procesează..." : "CONTINUĂ"}
        </button>
      </div>
    </div>
  );
}
