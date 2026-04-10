"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, X } from "lucide-react";
import type { GuestProfile, DailyConfirmation } from "@/types";

interface LoungerConfig {
  id: string;
  zone: string;
}

interface Props {
  adminId: string;
}

export default function LoungerGrid({ adminId }: Props) {
  const [loungers, setLoungers] = useState<LoungerConfig[]>([]);
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [confirmations, setConfirmations] = useState<DailyConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

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
    if (!guest) return "bg-black/[0.04] border-black/[0.08] text-black/40";
    if (guest.status === "active" && confirmedGuestIds.has(guest.id)) {
      return "bg-emerald-400/15 border-emerald-400/30 text-emerald-400";
    }
    return "bg-amber-400/15 border-amber-400/30 text-amber-400";
  }

  // Group loungers by zone
  const zones = loungers.reduce<Record<string, LoungerConfig[]>>((acc, l) => {
    if (!acc[l.zone]) acc[l.zone] = [];
    acc[l.zone].push(l);
    return acc;
  }, {});

  const selectedGuest = selected ? getGuestForLounger(selected) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-6 h-6 text-black/40 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-[10px] text-black/40">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-400/30 border border-emerald-400/50 inline-block" />
            Confirmat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400/30 border border-amber-400/50 inline-block" />
            Neconfirmat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-black/[0.04] border border-black/[0.1] inline-block" />
            Liber
          </span>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="text-black/40"
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
                  onClick={() => setSelected(selected === l.id ? null : l.id)}
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

      {/* Selected lounger popup */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.1] p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#1a1a1a] font-bold">
              Sezlong {selected}
            </p>
            <button onClick={() => setSelected(null)} className="text-black/40">
              <X className="w-5 h-5" />
            </button>
          </div>
          {selectedGuest ? (
            <div className="text-sm">
              <p className="text-[#1a1a1a]">{selectedGuest.name}</p>
              <p className="text-black/40 text-xs">
                {selectedGuest.phone} · {selectedGuest.stayStart} → {selectedGuest.stayEnd}
              </p>
              <p className="text-black/40 text-xs">
                Status: {selectedGuest.status} · Credit: {selectedGuest.creditEnabled ? "DA" : "NU"}
              </p>
            </div>
          ) : (
            <p className="text-black/40 text-sm">Acest sezlong este liber.</p>
          )}
        </div>
      )}
    </div>
  );
}
