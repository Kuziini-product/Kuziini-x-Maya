"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogOut,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Umbrella,
} from "lucide-react";
import type { GuestProfile, GuestStatus } from "@/types";
import GuestCardModal from "@/components/admin/GuestCardModal";

interface Props {
  adminId: string;
}

type Filter = "all" | GuestStatus | "unconfirmed";

export default function GuestList({ adminId }: Props) {
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestProfile | null>(null);

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", adminId }),
      });
      const json = await res.json();
      if (json.success) setGuests(json.data);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filtered = guests.filter((g) => {
    if (filter !== "all" && filter !== "unconfirmed" && g.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !g.name.toLowerCase().includes(q) &&
        !g.phone.includes(q) &&
        !g.loungerId.toLowerCase().includes(q) &&
        !g.members?.some(m => m.name.toLowerCase().includes(q) || m.phone.includes(q)) &&
        !g.loungerIds?.some(lid => lid.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  async function toggleCredit(guest: GuestProfile) {
    setUpdating(guest.id);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          adminId,
          guestId: guest.id,
          creditEnabled: !guest.creditEnabled,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? json.data : g))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  async function checkout(guestId: string) {
    if (!confirm("Confirmi check-out-ul acestui oaspete?")) return;
    setUpdating(guestId);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", adminId, guestId }),
      });
      const json = await res.json();
      if (json.success) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? json.data : g))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const statusBadge = (status: GuestStatus) => {
    const map: Record<GuestStatus, { bg: string; text: string; label: string }> = {
      pending_validation: { bg: "bg-orange-400/20", text: "text-orange-400", label: "Pending" },
      active: { bg: "bg-emerald-400/20", text: "text-emerald-400", label: "Activ" },
      registered: { bg: "bg-amber-400/20", text: "text-amber-400", label: "Inregistrat" },
      inactive: { bg: "th-tab-inactive", text: "th-text-secondary", label: "Inactiv" },
      checked_out: { bg: "bg-red-400/20", text: "text-red-400", label: "Check-out" },
    };
    const s = map[status];
    return (
      <span className={`${s.bg} ${s.text} text-[10px] font-bold tracking-wider uppercase px-2 py-0.5`}>
        {s.label}
      </span>
    );
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Toti" },
    { key: "active", label: "Activi" },
    { key: "registered", label: "Inregistrati" },
    { key: "inactive", label: "Inactivi" },
    { key: "checked_out", label: "Check-out" },
  ];

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 w-4 h-4 th-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cauta dupa nume, telefon sau sezlong..."
          className="w-full th-input border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#C9AB81]/50"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all ${
              filter === f.key
                ? "bg-[#C9AB81] text-[#0A0A0A]"
                : "th-tab-inactive th-text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="th-text-muted text-xs mb-3">
        {filtered.length} oaspeti{" "}
        <button onClick={() => { setLoading(true); fetchGuests(); }} className="text-[#C9AB81]">
          <RefreshCw className={`w-3 h-3 inline ${loading ? "animate-spin" : ""}`} />
        </button>
      </p>

      {loading && guests.length === 0 ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-5 h-5 th-text-muted animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="th-text-faint text-sm text-center py-10">
          Niciun oaspete gasit.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="th-card border overflow-hidden"
            >
              {/* Summary row */}
              <button
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="th-text text-sm font-medium truncate">
                      {g.name}
                    </p>
                    <p className="th-text-muted text-xs">
                      {g.loungerId || "—"} · {g.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.creditEnabled && (
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  {(g.members?.length || 1) > 1 && <span className="text-[10px] th-text-faint">{g.members?.length} pers</span>}
                  {(g.loungerIds?.length || 1) > 1 && <span className="text-[10px] th-text-faint">{g.loungerIds?.length} loc</span>}
                  {statusBadge(g.status)}
                  {expanded === g.id ? (
                    <ChevronUp className="w-4 h-4 th-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 th-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expanded === g.id && (
                <div className="px-4 pb-4 border-t th-border pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 th-text-secondary">
                      <Phone className="w-3 h-3" /> {g.phone}
                    </div>
                    <div className="flex items-center gap-1.5 th-text-secondary">
                      <Mail className="w-3 h-3" /> {g.email || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 th-text-secondary">
                      <Calendar className="w-3 h-3" /> {g.stayStart} → {g.stayEnd}
                    </div>
                    <div className="flex items-center gap-1.5 th-text-secondary">
                      <Umbrella className="w-3 h-3" /> {(g.loungerIds || [g.loungerId]).join(", ") || "neatribuit"}
                    </div>
                  </div>

                  {g.notes && (
                    <p className="th-text-muted text-xs italic">{g.notes}</p>
                  )}

                  {/* Lounger history */}
                  {g.loungerHistory && g.loungerHistory.length > 0 && (
                    <div className="th-card border th-border p-2 mt-1">
                      <p className="text-[10px] font-bold text-[#C9AB81] uppercase tracking-wider mb-1">
                        Istoric locuri
                      </p>
                      {g.loungerHistory.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] th-text-muted">
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
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => toggleCredit(g)}
                      disabled={updating === g.id}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold tracking-wider uppercase border ${
                        g.creditEnabled
                          ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                          : "th-tab-inactive th-border th-text-muted"
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      Credit: {g.creditEnabled ? "ON" : "OFF"}
                    </button>

                    <button
                      onClick={() => setEditingGuest(g)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold tracking-wider uppercase bg-[#C9AB81]/10 border border-[#C9AB81]/20 text-[#C9AB81]"
                    >
                      Edit card
                    </button>

                    {g.status !== "checked_out" && (
                      <button
                        onClick={() => checkout(g.id)}
                        disabled={updating === g.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-bold tracking-wider uppercase bg-red-500/10 border border-red-500/20 text-red-400"
                      >
                        <LogOut className="w-3 h-3" />
                        Check-out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingGuest && (
        <GuestCardModal
          guest={editingGuest}
          adminId={adminId}
          onClose={() => setEditingGuest(null)}
          onUpdated={(g) => { setEditingGuest(g); fetchGuests(); }}
        />
      )}
    </div>
  );
}
