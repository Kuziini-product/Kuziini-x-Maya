"use client";

import { useState, useEffect, useCallback } from "react";
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

interface LoungerConfig {
  id: string;
  zone: string;
}

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

  // Map picker state
  const [showMap, setShowMap] = useState(false);
  const [loungers, setLoungers] = useState<LoungerConfig[]>([]);
  const [occupiedLoungers, setOccupiedLoungers] = useState<Set<string>>(new Set());
  const [mapLoading, setMapLoading] = useState(false);

  const loadLoungers = useCallback(async () => {
    setMapLoading(true);
    try {
      const [dashRes, guestRes] = await Promise.all([
        fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId }),
        }),
        fetch("/api/admin/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list", adminId }),
        }),
      ]);
      const [dashJson, guestJson] = await Promise.all([dashRes.json(), guestRes.json()]);
      if (dashJson.success) setLoungers(dashJson.data.loungerConfig);
      if (guestJson.success) {
        const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
        const occupied = new Set<string>();
        for (const g of guestJson.data as GuestProfile[]) {
          if (g.status !== "checked_out" && g.stayStart <= today && g.stayEnd >= today && g.loungerId) {
            occupied.add(g.loungerId);
          }
        }
        setOccupiedLoungers(occupied);
      }
    } finally {
      setMapLoading(false);
    }
  }, [adminId]);

  function openMap() {
    setShowMap(true);
    loadLoungers();
  }

  function selectFromMap(id: string) {
    setLoungerId(id);
    setShowMap(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Numele si telefonul sunt obligatorii.");
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

  // Group loungers by zone for map picker
  const zoneGroups = loungers.reduce<Record<string, LoungerConfig[]>>((acc, l) => {
    if (!acc[l.zone]) acc[l.zone] = [];
    acc[l.zone].push(l);
    return acc;
  }, {});

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

        {/* Lounger - with map picker */}
        <div>
          <label className={labelCls}>Sezlong / Umbrela</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Umbrella className="absolute left-3 top-2.5 w-4 h-4 th-text-faint" />
              <input
                type="text"
                value={loungerId}
                onChange={(e) => setLoungerId(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="A-001, B-015, VIP-003..."
              />
            </div>
            <button
              type="button"
              onClick={openMap}
              className="flex items-center gap-1.5 px-4 bg-[#C9AB81] text-[#0A0A0A] font-bold text-[10px] tracking-wider uppercase"
            >
              <Map className="w-4 h-4" />
              Harta
            </button>
          </div>
          {loungerId && (
            <p className="text-emerald-500 text-[10px] mt-1 font-medium">
              Selectat: {loungerId.toUpperCase()}
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

      {/* ── MAP PICKER OVERLAY ── */}
      {showMap && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] overflow-y-auto p-4 rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="th-text font-bold text-lg">Alege sezlong</p>
              <button onClick={() => setShowMap(false)} className="th-text-muted p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-[10px] th-text-muted mb-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 inline-block" />
                Liber
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-100 border border-red-300 inline-block" />
                Ocupat
              </span>
            </div>

            {mapLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-[#C9AB81] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              Object.entries(zoneGroups).map(([zone, zLoungers]) => (
                <div key={zone} className="mb-4">
                  <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                    {zone}
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {zLoungers.map((l) => {
                      const isOccupied = occupiedLoungers.has(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => !isOccupied && selectFromMap(l.id)}
                          disabled={isOccupied}
                          className={`border p-1.5 text-center text-[9px] font-bold transition-all ${
                            isOccupied
                              ? "bg-red-50 border-red-200 text-red-300 cursor-not-allowed"
                              : loungerId === l.id
                              ? "bg-[#C9AB81]/20 border-[#C9AB81] text-[#C9AB81] ring-1 ring-[#C9AB81]"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600 active:bg-emerald-100"
                          }`}
                        >
                          {l.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
