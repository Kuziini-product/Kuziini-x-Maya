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
        !g.loungerId.toLowerCase().includes(q)
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
      active: { bg: "bg-emerald-400/20", text: "text-emerald-400", label: "Activ" },
      registered: { bg: "bg-amber-400/20", text: "text-amber-400", label: "Inregistrat" },
      inactive: { bg: "bg-white/10", text: "text-white/50", label: "Inactiv" },
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
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cauta dupa nume, telefon sau sezlong..."
          className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#C9AB81]/50 placeholder:text-white/20"
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
                : "bg-white/[0.06] text-white/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-white/30 text-xs mb-3">
        {filtered.length} oaspeti{" "}
        <button onClick={() => { setLoading(true); fetchGuests(); }} className="text-[#C9AB81]">
          <RefreshCw className={`w-3 h-3 inline ${loading ? "animate-spin" : ""}`} />
        </button>
      </p>

      {loading && guests.length === 0 ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-white/20 text-sm text-center py-10">
          Niciun oaspete gasit.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white/[0.03] border border-white/[0.06] overflow-hidden"
            >
              {/* Summary row */}
              <button
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {g.name}
                    </p>
                    <p className="text-white/40 text-xs">
                      {g.loungerId || "—"} · {g.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.creditEnabled && (
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  {statusBadge(g.status)}
                  {expanded === g.id ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expanded === g.id && (
                <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Phone className="w-3 h-3" /> {g.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Mail className="w-3 h-3" /> {g.email || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Calendar className="w-3 h-3" /> {g.stayStart} → {g.stayEnd}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Umbrella className="w-3 h-3" /> {g.loungerId || "neatribuit"}
                    </div>
                  </div>

                  {g.notes && (
                    <p className="text-white/30 text-xs italic">{g.notes}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => toggleCredit(g)}
                      disabled={updating === g.id}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold tracking-wider uppercase border ${
                        g.creditEnabled
                          ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                          : "bg-white/[0.06] border-white/[0.1] text-white/40"
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      Credit: {g.creditEnabled ? "ON" : "OFF"}
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
    </div>
  );
}
