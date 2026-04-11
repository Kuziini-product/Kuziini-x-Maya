"use client";

import { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Umbrella,
  CreditCard,
  UserPlus,
  UserMinus,
  Plus,
  Minus,
  Save,
  LogOut,
  Clock,
  ArrowRightLeft,
  Map,
} from "lucide-react";
import type { GuestProfile, GuestMember } from "@/types";
import LoungerMapPicker from "@/components/admin/LoungerMapPicker";

interface Props {
  guest: GuestProfile;
  adminId: string;
  onClose: () => void;
  onUpdated: (guest: GuestProfile) => void;
}

export default function GuestCardModal({ guest, adminId, onClose, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [status, setStatus] = useState(guest.status);
  const [creditEnabled, setCreditEnabled] = useState(guest.creditEnabled);
  const [creditLimit, setCreditLimit] = useState(guest.creditLimit || 0);
  const [stayStart, setStayStart] = useState(guest.stayStart);
  const [stayEnd, setStayEnd] = useState(guest.stayEnd);
  const [notes, setNotes] = useState(guest.notes || "");

  // New member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newPhone, setNewPhone] = useState("+40");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // New lounger
  const [showAddLounger, setShowAddLounger] = useState(false);
  const [newLounger, setNewLounger] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);

  async function saveChanges() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          adminId,
          guestId: guest.id,
          status,
          creditEnabled,
          creditLimit: creditEnabled ? creditLimit : 0,
          stayStart,
          stayEnd,
          notes: notes.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccess("Salvat!");
      onUpdated(json.data);
      setTimeout(() => setSuccess(null), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  async function addMember() {
    if (!newPhone.trim() || newPhone.trim().length < 5) {
      setError("Telefonul membrului este obligatoriu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-member",
          adminId,
          guestId: guest.id,
          member: {
            phone: newPhone.trim(),
            name: newName.trim() || guest.name,
            email: newEmail.trim() || guest.email,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onUpdated(json.data);
      setShowAddMember(false);
      setNewPhone("+40");
      setNewName("");
      setNewEmail("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberPhone: string) {
    if (!confirm(`Stergi membrul ${memberPhone}?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-member", adminId, guestId: guest.id, phone: memberPhone }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onUpdated(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setSaving(false);
    }
  }

  async function addLounger() {
    if (!newLounger.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-lounger", adminId, guestId: guest.id, loungerId: newLounger.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onUpdated(json.data);
      setShowAddLounger(false);
      setNewLounger("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setSaving(false);
    }
  }

  async function removeLounger(lid: string) {
    if (!confirm(`Stergi sezlongul ${lid}?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-lounger", adminId, guestId: guest.id, loungerId: lid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onUpdated(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setSaving(false);
    }
  }

  async function checkout() {
    if (!confirm("Confirmi check-out-ul?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", adminId, guestId: guest.id }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdated(json.data);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full th-input border px-3 py-2 text-sm outline-none focus:border-[#C9AB81]/50";
  const labelCls = "text-[10px] font-bold text-[#C9AB81] uppercase tracking-[0.2em] mb-1 block";
  const members = guest.members || [{ phone: guest.phone, name: guest.name, email: guest.email }];
  const loungerIds = guest.loungerIds || (guest.loungerId ? [guest.loungerId] : []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="th-popup w-full sm:max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-xl border th-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 th-popup border-b th-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <p className="th-text font-bold text-lg">{guest.name}</p>
            <p className="th-text-muted text-xs">{members.length} {members.length === 1 ? "membru" : "membri"} · {loungerIds.length} {loungerIds.length === 1 ? "loc" : "locuri"}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status toggle */}
            <button
              onClick={() => setStatus(status === "active" ? "inactive" : "active")}
              className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 ${
                status === "active"
                  ? "bg-emerald-100 text-emerald-600"
                  : status === "inactive"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {status}
            </button>
            <button onClick={onClose} className="th-text-muted p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Messages */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 p-2 text-emerald-700 text-sm font-medium text-center">{success}</div>
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}

          {/* ── MEMBERS ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={labelCls}>Membri familie</p>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-1 text-[#C9AB81] text-[10px] font-bold uppercase tracking-wider"
              >
                {showAddMember ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAddMember ? "Anuleaza" : "Adauga"}
              </button>
            </div>

            <div className="space-y-1.5">
              {members.map((m, i) => (
                <div key={m.phone} className="th-card border p-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="th-text text-sm font-medium truncate">
                      {m.name} {i === 0 && <span className="text-[#C9AB81] text-[9px]">(principal)</span>}
                    </p>
                    <div className="flex items-center gap-3 text-xs th-text-muted">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>
                      {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>}
                    </div>
                  </div>
                  {i > 0 && (
                    <button onClick={() => removeMember(m.phone)} className="text-red-400 p-1 shrink-0" disabled={saving}>
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member form */}
            {showAddMember && (
              <div className="th-card border p-3 mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={inputCls} placeholder="+40..." />
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} placeholder="Nume" />
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="Email" />
                </div>
                <button onClick={addMember} disabled={saving} className="w-full bg-[#C9AB81] text-[#0A0A0A] py-2 font-bold text-xs tracking-wider uppercase disabled:opacity-50">
                  {saving ? "..." : "Adauga membru"}
                </button>
              </div>
            )}
          </div>

          {/* ── LOUNGERS ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={labelCls}>Sezlonguri alocate ({loungerIds.length})</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMapPicker(true)}
                  className="flex items-center gap-1 text-[#C9AB81] text-[10px] font-bold uppercase tracking-wider"
                >
                  <Map className="w-3 h-3" />
                  Harta
                </button>
                <button
                  onClick={() => setShowAddLounger(!showAddLounger)}
                  className="flex items-center gap-1 text-[#C9AB81] text-[10px] font-bold uppercase tracking-wider"
                >
                  {showAddLounger ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  Manual
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {loungerIds.map((lid) => (
                <div key={lid} className="flex items-center gap-1 bg-[#C9AB81]/10 border border-[#C9AB81]/20 px-2.5 py-1.5">
                  <Umbrella className="w-3 h-3 text-[#C9AB81]" />
                  <span className="text-sm font-medium th-text">{lid}</span>
                  {loungerIds.length > 1 && (
                    <button onClick={() => removeLounger(lid)} className="text-red-400 ml-1" disabled={saving}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showAddLounger && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLounger}
                  onChange={(e) => setNewLounger(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                  placeholder="Nr. sezlong (ex: B-020)"
                />
                <button onClick={addLounger} disabled={saving} className="bg-[#C9AB81] text-[#0A0A0A] px-4 font-bold text-xs tracking-wider uppercase disabled:opacity-50">
                  {saving ? "..." : "Adauga"}
                </button>
              </div>
            )}
          </div>

          {/* ── STAY PERIOD ── */}
          <div>
            <p className={labelCls}>Perioada sedere</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="th-text-faint text-[9px]">De la</label>
                <input type="date" value={stayStart} onChange={(e) => setStayStart(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="th-text-faint text-[9px]">Pana la</label>
                <input type="date" value={stayEnd} onChange={(e) => setStayEnd(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── CREDIT ── */}
          <div className="th-card border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span className="text-sm th-text font-medium">Credit</span>
              </div>
              <button
                onClick={() => setCreditEnabled(!creditEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${creditEnabled ? "bg-purple-500" : "th-tab-inactive"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${creditEnabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            {creditEnabled && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="th-text-faint text-[9px]">Limita</label>
                  <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(Number(e.target.value))} className={inputCls} min={0} step={100} />
                </div>
                <div className="th-card border p-2 text-center">
                  <p className="th-text-faint text-[9px]">Folosit</p>
                  <p className="th-text font-bold">{guest.creditUsed || 0}</p>
                </div>
                <div className="th-card border p-2 text-center">
                  <p className="th-text-faint text-[9px]">Disponibil</p>
                  <p className="text-emerald-500 font-bold">{creditLimit - (guest.creditUsed || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── NOTES ── */}
          <div>
            <p className={labelCls}>Note</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} min-h-[50px] resize-none`}
              placeholder="Observatii..."
            />
          </div>

          {/* ── HISTORY ── */}
          {guest.loungerHistory && guest.loungerHistory.length > 0 && (
            <div>
              <p className={labelCls}>Istoric locuri</p>
              <div className="space-y-1">
                {guest.loungerHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs th-text-muted">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      h.action === "assigned" ? "bg-emerald-400" :
                      h.action === "relocated_to" ? "bg-sky-400" : "bg-amber-400"
                    }`} />
                    <span className="font-medium">{h.loungerId}</span>
                    <span>{h.action === "assigned" ? "asignat" : h.action === "relocated_to" ? "mutat aici" : "plecat"}</span>
                    <span className="th-text-faint ml-auto">{h.date}</span>
                    {h.reason && <span className="th-text-faint italic">({h.reason})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration info */}
          <div className="flex items-center gap-2 text-[10px] th-text-faint">
            <Clock className="w-3 h-3" />
            Inregistrat: {new Date(guest.registeredAt).toLocaleString("ro-RO")}
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex gap-2 pt-2 border-t th-border">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Se salveaza..." : "Salveaza"}
            </button>
            {guest.status !== "checked_out" && (
              <button
                onClick={checkout}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs tracking-wider uppercase"
              >
                <LogOut className="w-4 h-4" />
                Check-out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map picker overlay */}
      {showMapPicker && (
        <LoungerMapPicker
          adminId={adminId}
          selected={loungerIds}
          count={0}
          excludeFromOccupied={loungerIds}
          onSelect={async (newIds) => {
            // Add new loungers that aren't already in the list
            for (const lid of newIds) {
              if (!loungerIds.includes(lid)) {
                await addLounger();
                // Direct API call for each new lounger
                await fetch("/api/admin/guests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "add-lounger", adminId, guestId: guest.id, loungerId: lid }),
                }).then(r => r.json()).then(json => {
                  if (json.success) onUpdated(json.data);
                });
              }
            }
            // Remove loungers that were deselected
            for (const lid of loungerIds) {
              if (!newIds.includes(lid) && loungerIds.length > 1) {
                await fetch("/api/admin/guests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "remove-lounger", adminId, guestId: guest.id, loungerId: lid }),
                }).then(r => r.json()).then(json => {
                  if (json.success) onUpdated(json.data);
                });
              }
            }
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
