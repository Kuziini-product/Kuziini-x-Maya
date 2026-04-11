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
  Map,
  X,
} from "lucide-react";
import type { GuestProfile } from "@/types";
import LoungerMapPicker from "@/components/admin/LoungerMapPicker";

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
  const [extraMembers, setExtraMembers] = useState<{phone: string; name: string; email: string}[]>([]);
  const [loungerCount, setLoungerCount] = useState(1);
  const [selectedLoungers, setSelectedLoungers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<GuestProfile | null>(null);
  const [showMap, setShowMap] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Numele si telefonul sunt obligatorii.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allMembers = [
        { phone: phone.trim(), name: name.trim(), email: email.trim() },
        ...extraMembers.filter(m => m.phone.trim()),
      ];
      const mainLounger = loungerId.trim().toUpperCase();
      // Use map-selected loungers if available, otherwise just the typed one
      const selectedLoungerIds = selectedLoungers.length > 0
        ? selectedLoungers
        : mainLounger ? [mainLounger] : [];
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
          loungerId: mainLounger,
          creditEnabled,
          creditLimit: creditEnabled ? creditLimit : 0,
          notes: notes.trim(),
          members: allMembers,
          loungerIds: selectedLoungerIds,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Also confirm for today
      if (json.data.loungerId) {
        await fetch("/api/admin/guests/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm",
            adminId,
            guestId: json.data.id,
            loungerId: json.data.loungerId,
            method: "manual",
          }),
        });
      }
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
    setExtraMembers([]);
    setLoungerCount(1);
    setSelectedLoungers([]);
    setSuccess(null);
    setError(null);
  }

  if (success) {
    return (
      <div className="bg-emerald-400/10 border border-emerald-400/20 p-6 text-center">
        <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-emerald-400 font-bold text-lg mb-1">Check-in reusit!</p>
        <p className="th-text-secondary text-sm mb-1">{success.name}</p>
        <p className="th-text-muted text-xs mb-1">
          Sezlong: {success.loungerId || "neatribuit"} · {success.stayStart} → {success.stayEnd}
        </p>
        <p className="th-text-muted text-xs mb-4">
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
    "w-full th-input border px-3 py-2.5 text-sm outline-none focus:border-[#C9AB81]/50";
  const labelCls =
    "text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1.5 block";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="th-text-muted text-xs mb-2">
          Inregistreaza un oaspete nou la receptie
        </p>

        {/* Name */}
        <div>
          <label className={labelCls}>Nume complet *</label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
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
              <Phone className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
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
              <Mail className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
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

        {/* Extra members */}
        <div>
          <label className={labelCls}>Membri aditionali</label>
          {extraMembers.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
              <input
                type="tel"
                value={m.phone}
                onChange={(e) => {
                  const arr = [...extraMembers];
                  arr[i] = { ...arr[i], phone: e.target.value };
                  setExtraMembers(arr);
                }}
                className={inputCls}
                placeholder="Telefon"
              />
              <input
                type="text"
                value={m.name}
                onChange={(e) => {
                  const arr = [...extraMembers];
                  arr[i] = { ...arr[i], name: e.target.value };
                  setExtraMembers(arr);
                }}
                className={inputCls}
                placeholder="Nume"
              />
              <input
                type="email"
                value={m.email}
                onChange={(e) => {
                  const arr = [...extraMembers];
                  arr[i] = { ...arr[i], email: e.target.value };
                  setExtraMembers(arr);
                }}
                className={inputCls}
                placeholder="Email"
              />
              <button
                type="button"
                onClick={() => setExtraMembers(extraMembers.filter((_, j) => j !== i))}
                className="th-text-muted px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setExtraMembers([...extraMembers, { phone: "", name: "", email: "" }])}
            className="text-[#C9AB81] text-xs font-bold tracking-wider uppercase"
          >
            + Adauga membru
          </button>
        </div>

        {/* Stay period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>De la</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
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
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
              <input
                type="date"
                value={stayEnd}
                onChange={(e) => setStayEnd(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
        </div>

        {/* Lounger selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Sezlonguri</label>
            <div className="flex items-center gap-2">
              <label className="th-text-faint text-[9px]">Cate locuri:</label>
              <input
                type="number"
                value={loungerCount}
                onChange={(e) => setLoungerCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                min={1}
                max={10}
                className="th-input border px-2 py-1 text-xs w-14 text-center outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Umbrella className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
              <input
                type="text"
                value={loungerId}
                onChange={(e) => setLoungerId(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Introdu manual sau alege din harta..."
              />
            </div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex items-center gap-1.5 px-4 bg-[#C9AB81] text-[#0A0A0A] font-bold text-[10px] tracking-wider uppercase"
            >
              <Map className="w-4 h-4" />
              Harta
            </button>
          </div>

          {/* Show selected loungers */}
          {selectedLoungers.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {selectedLoungers.map((lid) => (
                <span key={lid} className="flex items-center gap-1 bg-[#C9AB81]/10 border border-[#C9AB81]/20 px-2 py-0.5 text-[10px] font-bold text-[#C9AB81]">
                  {lid}
                  <button type="button" onClick={() => setSelectedLoungers(selectedLoungers.filter(l => l !== lid))} className="text-red-400">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {selectedLoungers.length === 0 && loungerId && (
            <p className="text-emerald-500 text-[10px] mt-1 font-medium">
              Manual: {loungerId.toUpperCase()}
            </p>
          )}
        </div>

        {/* Credit toggle */}
        <div className="th-card border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className="text-sm th-text">Plata pe credit</span>
            </div>
            <button
              type="button"
              onClick={() => setCreditEnabled(!creditEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                creditEnabled ? "bg-purple-500" : "th-tab-inactive"
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
            <StickyNote className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
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

      {/* ── MAP PICKER ── */}
      {showMap && (
        <LoungerMapPicker
          adminId={adminId}
          selected={selectedLoungers}
          count={loungerCount}
          onSelect={(ids) => {
            setSelectedLoungers(ids);
            if (ids.length > 0) setLoungerId(ids[0]);
          }}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}
