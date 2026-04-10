"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  X,
  UserPlus,
  ArrowRightLeft,
  Check,
  Search,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  StickyNote,
} from "lucide-react";
import type { GuestProfile, DailyConfirmation } from "@/types";

interface LoungerConfig {
  id: string;
  zone: string;
}

interface Props {
  adminId: string;
}

type PanelMode = "info" | "assign" | "checkin" | "relocate";

export default function LoungerGrid({ adminId }: Props) {
  const [loungers, setLoungers] = useState<LoungerConfig[]>([]);
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [confirmations, setConfirmations] = useState<DailyConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("info");
  const [saving, setSaving] = useState(false);

  // Assign existing guest
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // Relocate
  const [relocateTarget, setRelocateTarget] = useState("");
  const [relocateReason, setRelocateReason] = useState("");

  // Quick check-in form
  const [ciName, setCiName] = useState("");
  const [ciPhone, setCiPhone] = useState("+40");
  const [ciEmail, setCiEmail] = useState("");
  const [ciStayStart, setCiStayStart] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );
  const [ciStayEnd, setCiStayEnd] = useState(
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" })
  );
  const [ciCredit, setCiCredit] = useState(false);
  const [ciNotes, setCiNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, guestRes, dailyRes] = await Promise.all([
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
        fetch("/api/admin/guests/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", adminId }),
        }),
      ]);

      const [dashJson, guestJson, dailyJson] = await Promise.all([
        dashRes.json(),
        guestRes.json(),
        dailyRes.json(),
      ]);

      if (dashJson.success) setLoungers(dashJson.data.loungerConfig);
      if (guestJson.success) setGuests(guestJson.data);
      if (dailyJson.success) setConfirmations(dailyJson.data.confirmations || []);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
  const confirmedGuestIds = new Set(confirmations.map((c) => c.guestId));

  function getGuestForLounger(loungerId: string): GuestProfile | undefined {
    return guests.find(
      (g) =>
        g.loungerId === loungerId &&
        g.stayStart <= today &&
        g.stayEnd >= today &&
        g.status !== "checked_out"
    );
  }

  function getLoungerColor(loungerId: string): string {
    const guest = getGuestForLounger(loungerId);
    if (!guest) return "bg-gray-100 border-gray-200 text-gray-600";
    if (guest.status === "active" && confirmedGuestIds.has(guest.id)) {
      return "bg-emerald-400/15 border-emerald-400/30 text-emerald-400";
    }
    return "bg-amber-400/15 border-amber-400/30 text-amber-400";
  }

  const zones = loungers.reduce<Record<string, LoungerConfig[]>>((acc, l) => {
    if (!acc[l.zone]) acc[l.zone] = [];
    acc[l.zone].push(l);
    return acc;
  }, {});

  const selectedGuest = selected ? getGuestForLounger(selected) : null;

  // Guests that can be assigned (registered/inactive, not checked out, without a lounger today)
  const assignableGuests = guests.filter((g) => {
    if (g.status === "checked_out") return false;
    const q = searchQuery.toLowerCase();
    if (q && !g.name.toLowerCase().includes(q) && !g.phone.includes(q)) return false;
    return true;
  });

  function openLounger(id: string) {
    setSelected(id);
    setPanelMode("info");
    setError(null);
    setSuccess(null);
    setSearchQuery("");
    setSelectedGuestId(null);
    setRelocateTarget("");
    setRelocateReason("");
  }

  function closePanel() {
    setSelected(null);
    setPanelMode("info");
    setError(null);
    setSuccess(null);
    resetCheckinForm();
  }

  function resetCheckinForm() {
    setCiName("");
    setCiPhone("+40");
    setCiEmail("");
    setCiStayStart(today);
    setCiStayEnd(today);
    setCiCredit(false);
    setCiNotes("");
  }

  // Assign existing guest to this lounger
  async function assignGuest() {
    if (!selectedGuestId || !selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          adminId,
          guestId: selectedGuestId,
          loungerId: selected,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Also confirm for today
      await fetch("/api/admin/guests/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          adminId,
          guestId: selectedGuestId,
          loungerId: selected,
          method: "manual",
        }),
      });
      setSuccess("Oaspete asignat si confirmat!");
      fetchData();
      setTimeout(() => closePanel(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la asignare.");
    } finally {
      setSaving(false);
    }
  }

  // Quick check-in directly from map
  async function quickCheckin() {
    if (!ciName.trim() || !ciPhone.trim() || !selected) {
      setError("Numele si telefonul sunt obligatorii.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          adminId,
          name: ciName.trim(),
          phone: ciPhone.trim(),
          email: ciEmail.trim(),
          stayStart: ciStayStart,
          stayEnd: ciStayEnd,
          loungerId: selected,
          creditEnabled: ciCredit,
          notes: ciNotes.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Also confirm for today
      await fetch("/api/admin/guests/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          adminId,
          guestId: json.data.id,
          loungerId: selected,
          method: "manual",
        }),
      });
      setSuccess(`${ciName.trim()} - check-in pe ${selected}!`);
      fetchData();
      setTimeout(() => closePanel(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la check-in.");
    } finally {
      setSaving(false);
    }
  }

  // Relocate guest to another lounger (reason mandatory)
  async function relocateGuest() {
    if (!selectedGuest || !relocateTarget.trim()) {
      setError("Introdu numarul sezlongului destinatie.");
      return;
    }
    if (!relocateReason.trim()) {
      setError("Motivul relocarii este obligatoriu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const target = relocateTarget.trim().toUpperCase();
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "relocate",
          adminId,
          guestId: selectedGuest.id,
          newLoungerId: target,
          reason: relocateReason.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccess(`${selectedGuest.name} mutat pe ${target}!`);
      fetchData();
      setTimeout(() => closePanel(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la relocare.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-gray-100/80 border border-gray-200 px-3 py-2 text-gray-900 text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-gray-400";
  const labelCls =
    "text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1 block";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-[10px] text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-400/30 border border-emerald-400/50 inline-block" />
            Confirmat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400/30 border border-amber-400/50 inline-block" />
            Neconfirmat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 border border-gray-300 inline-block" />
            Liber
          </span>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="text-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {Object.entries(zones).map(([zone, zLoungers]) => (
        <div key={zone} className="mb-6">
          <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            {zone}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {zLoungers.map((l) => {
              const guest = getGuestForLounger(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => openLounger(l.id)}
                  className={`border p-2 text-center transition-all ${getLoungerColor(l.id)} ${
                    selected === l.id ? "ring-2 ring-[#C9AB81]" : ""
                  }`}
                >
                  <p className="text-xs font-bold">{l.id}</p>
                  {guest && (
                    <p className="text-[8px] truncate mt-0.5 opacity-70">
                      {guest.name.split(" ")[0]}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── BOTTOM PANEL ── */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 z-50 max-h-[70vh] overflow-y-auto shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-900 font-bold text-lg">
              Sezlong {selected}
            </p>
            <button onClick={closePanel} className="text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-emerald-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}

          {/* ── INFO MODE (default) ── */}
          {panelMode === "info" && !success && (
            <>
              {selectedGuest ? (
                <div className="mb-4">
                  <div className="bg-gray-100/80 border border-gray-200 p-3 mb-3">
                    <p className="text-gray-900 font-medium">{selectedGuest.name}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {selectedGuest.phone} · {selectedGuest.email || "—"}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {selectedGuest.stayStart} → {selectedGuest.stayEnd}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${
                        selectedGuest.status === "active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}>
                        {selectedGuest.status}
                      </span>
                      {selectedGuest.creditEnabled && (
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-purple-100 text-purple-600">
                          Credit ON
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Lounger history */}
                  {selectedGuest.loungerHistory && selectedGuest.loungerHistory.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 p-3 mb-3">
                      <p className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-2">
                        Istoric locuri
                      </p>
                      <div className="space-y-1.5">
                        {selectedGuest.loungerHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                h.action === "assigned" ? "bg-emerald-400" :
                                h.action === "relocated_to" ? "bg-sky-400" : "bg-amber-400"
                              }`} />
                              <span className="text-gray-700 font-medium">{h.loungerId}</span>
                              <span className="text-gray-500">
                                {h.action === "assigned" ? "asignat" :
                                 h.action === "relocated_to" ? "mutat aici" : "plecat"}
                              </span>
                            </div>
                            <span className="text-gray-400 text-[10px]">{h.date}</span>
                          </div>
                        ))}
                        {selectedGuest.loungerHistory.some(h => h.reason) && (
                          <div className="mt-1 pt-1 border-t border-gray-100">
                            {selectedGuest.loungerHistory.filter(h => h.reason).map((h, i) => (
                              <p key={i} className="text-gray-500 text-[10px] italic">
                                {h.loungerId}: {h.reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setPanelMode("relocate")}
                    className="w-full flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-xs tracking-wider uppercase"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Reloca oaspetele
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-4">Acest sezlong este liber.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPanelMode("assign")}
                      className="flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-xs tracking-wider uppercase"
                    >
                      <Search className="w-4 h-4" />
                      Asigneaza oaspete
                    </button>
                    <button
                      onClick={() => setPanelMode("checkin")}
                      className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 font-bold text-xs tracking-wider uppercase"
                    >
                      <UserPlus className="w-4 h-4" />
                      Check-in nou
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── ASSIGN MODE ── */}
          {panelMode === "assign" && !success && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setPanelMode("info")} className="text-gray-600 text-xs">&larr; Inapoi</button>
                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase">
                  Asigneaza oaspete pe {selected}
                </p>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cauta dupa nume sau telefon..."
                  className={`${inputCls} pl-9`}
                  autoFocus
                />
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1 mb-3">
                {assignableGuests.slice(0, 20).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGuestId(selectedGuestId === g.id ? null : g.id)}
                    className={`w-full text-left px-3 py-2 text-sm border transition-all ${
                      selectedGuestId === g.id
                        ? "bg-[#C9AB81]/10 border-[#C9AB81]/30"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <p className="text-gray-900 font-medium">{g.name}</p>
                    <p className="text-gray-600 text-xs">
                      {g.phone} · {g.loungerId || "fara loc"} · {g.status}
                    </p>
                  </button>
                ))}
                {assignableGuests.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-4">Niciun oaspete gasit.</p>
                )}
              </div>

              <button
                onClick={assignGuest}
                disabled={!selectedGuestId || saving}
                className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-xs tracking-wider uppercase disabled:opacity-40"
              >
                {saving ? "Se asigneaza..." : "Confirma asignare"}
              </button>
            </div>
          )}

          {/* ── CHECKIN MODE ── */}
          {panelMode === "checkin" && !success && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setPanelMode("info")} className="text-gray-600 text-xs">&larr; Inapoi</button>
                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase">
                  Check-in rapid pe {selected}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Nume *</label>
                  <input type="text" value={ciName} onChange={(e) => setCiName(e.target.value)} className={inputCls} placeholder="Ion Popescu" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Telefon *</label>
                    <input type="tel" value={ciPhone} onChange={(e) => setCiPhone(e.target.value)} className={inputCls} placeholder="+40712345678" />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={ciEmail} onChange={(e) => setCiEmail(e.target.value)} className={inputCls} placeholder="email@ex.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>De la</label>
                    <input type="date" value={ciStayStart} onChange={(e) => setCiStayStart(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Pana la</label>
                    <input type="date" value={ciStayEnd} onChange={(e) => setCiStayEnd(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gray-100/80 border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-900">Credit</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCiCredit(!ciCredit)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${ciCredit ? "bg-purple-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${ciCredit ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>

                <button
                  onClick={quickCheckin}
                  disabled={saving}
                  className="w-full bg-emerald-500 text-white py-3 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                >
                  {saving ? "Se inregistreaza..." : `Check-in pe ${selected}`}
                </button>
              </div>
            </div>
          )}

          {/* ── RELOCATE MODE ── */}
          {panelMode === "relocate" && !success && selectedGuest && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setPanelMode("info")} className="text-gray-600 text-xs">&larr; Inapoi</button>
                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase">
                  Reloca {selectedGuest.name}
                </p>
              </div>

              <p className="text-gray-600 text-xs mb-3">
                Muta de pe {selected} pe alt sezlong:
              </p>

              {/* Previous loungers - quick assign */}
              {selectedGuest.loungerHistory && selectedGuest.loungerHistory.filter(h => h.action !== "relocated_from").length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Locuri anterioare (click pentru selectie rapida)
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from(new Set(
                      selectedGuest.loungerHistory
                        .filter(h => h.action !== "relocated_from" && h.loungerId !== selected)
                        .map(h => h.loungerId)
                    )).map((lid) => {
                      const isFree = !getGuestForLounger(lid);
                      return (
                        <button
                          key={lid}
                          onClick={() => isFree && setRelocateTarget(lid)}
                          disabled={!isFree}
                          className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                            relocateTarget.toUpperCase() === lid
                              ? "bg-[#C9AB81]/20 border-[#C9AB81] text-[#C9AB81]"
                              : isFree
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                              : "bg-red-50 border-red-200 text-red-400 cursor-not-allowed line-through"
                          }`}
                        >
                          {lid} {isFree ? "" : "(ocupat)"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Sezlong destinatie *</label>
                  <input
                    type="text"
                    value={relocateTarget}
                    onChange={(e) => setRelocateTarget(e.target.value)}
                    placeholder="Nr. sezlong destinatie (ex: B-015)"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={labelCls}>Motiv relocare *</label>
                  <textarea
                    value={relocateReason}
                    onChange={(e) => setRelocateReason(e.target.value)}
                    placeholder="Motivul pentru care se face relocarea..."
                    className={`${inputCls} min-h-[60px] resize-none`}
                  />
                </div>
              </div>

              <button
                onClick={relocateGuest}
                disabled={!relocateTarget.trim() || !relocateReason.trim() || saving}
                className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-xs tracking-wider uppercase disabled:opacity-40 mt-3"
              >
                {saving ? "Se reloca..." : `Muta pe ${relocateTarget.trim().toUpperCase() || "..."}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
