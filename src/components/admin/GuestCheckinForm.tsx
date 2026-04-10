"use client";

import { useState } from "react";
import {
  UserPlus,
  Check,
  Phone,
  Mail,
  Calendar,
  Umbrella,
  CreditCard,
  StickyNote,
} from "lucide-react";
import type { GuestProfile } from "@/types";

interface Props {
  adminId: string;
  onSuccess?: (guest: GuestProfile) => void;
}

export default function GuestCheckinForm({ adminId, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [email, setEmail] = useState("");
  const [stayStart, setStayStart] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );
  const [stayEnd, setStayEnd] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );
  const [loungerId, setLoungerId] = useState("");
  const [creditEnabled, setCreditEnabled] = useState(false);
  const [creditLimit, setCreditLimit] = useState(500);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<GuestProfile | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Numele și telefonul sunt obligatorii.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          adminId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          stayStart,
          stayEnd,
          loungerId: loungerId.trim().toUpperCase(),
          creditEnabled,
          creditLimit: creditEnabled ? creditLimit : 0,
          notes: notes.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccess(json.data);
      onSuccess?.(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la check-in.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName("");
    setPhone("+40");
    setEmail("");
    setLoungerId("");
    setCreditEnabled(false);
    setNotes("");
    setSuccess(null);
    setError(null);
  }

  if (success) {
    return (
      <div className="bg-emerald-400/10 border border-emerald-400/20 p-6 text-center">
        <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-400 font-bold text-lg mb-1">Check-in reusit!</p>
        <p className="text-black/50 text-sm mb-1">{success.name}</p>
        <p className="text-black/40 text-xs mb-1">
          Sezlong: {success.loungerId || "neatribuit"} · {success.stayStart} → {success.stayEnd}
        </p>
        <p className="text-black/40 text-xs mb-4">
          Credit: {success.creditEnabled ? "DA" : "NU"}
        </p>
        <button
          onClick={reset}
          className="bg-[#C9AB81] text-[#0A0A0A] px-6 py-2.5 font-bold text-xs tracking-wider uppercase"
        >
          Check-in nou
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full bg-gray-50 border border-black/[0.06] px-3 py-2.5 text-[#1a1a1a] text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-black/30";
  const labelCls =
    "text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-black/40 text-xs mb-2">
        Inregistreaza un oaspete nou la receptie
      </p>

      {/* Name */}
      <div>
        <label className={labelCls}>Nume complet *</label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputCls} pl-9`}
            placeholder="Ion Popescu"
          />
        </div>
      </div>

      {/* Phone + Email row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Telefon *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputCls} pl-9`}
              placeholder="+40712345678"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-9`}
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>

      {/* Stay period */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>De la</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
            <input
              type="date"
              value={stayStart}
              onChange={(e) => setStayStart(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Pana la</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
            <input
              type="date"
              value={stayEnd}
              onChange={(e) => setStayEnd(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
      </div>

      {/* Lounger */}
      <div>
        <label className={labelCls}>Sezlong / Umbrela</label>
        <div className="relative">
          <Umbrella className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
          <input
            type="text"
            value={loungerId}
            onChange={(e) => setLoungerId(e.target.value)}
            className={`${inputCls} pl-9`}
            placeholder="A-01, B-07, VIP-03..."
          />
        </div>
      </div>

      {/* Credit toggle */}
      <div className="bg-gray-50 border border-black/[0.08] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-[#1a1a1a]">Plata pe credit</span>
          </div>
          <button
            type="button"
            onClick={() => setCreditEnabled(!creditEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              creditEnabled ? "bg-purple-500" : "bg-black/[0.06]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                creditEnabled ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {creditEnabled && (
          <div className="mt-3">
            <label className={labelCls}>Limita credit (RON)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              className={inputCls}
              min={0}
              step={100}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Note</label>
        <div className="relative">
          <StickyNote className="absolute left-3 top-2.5 w-4 h-4 text-black/40" />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputCls} pl-9 min-h-[60px] resize-none`}
            placeholder="Observatii speciale..."
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3.5 font-bold text-sm tracking-[0.15em] uppercase active:opacity-80 transition-opacity disabled:opacity-50"
      >
        {loading ? "Se inregistreaza..." : "Check-in oaspete"}
      </button>
    </form>
  );
}
