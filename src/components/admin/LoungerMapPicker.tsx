"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Map, RefreshCw } from "lucide-react";
import type { GuestProfile } from "@/types";
import { suggestAdjacentLoungers, getOccupiedLoungers } from "@/lib/lounger-utils";

interface LoungerConfig {
  id: string;
  zone: string;
}

interface Props {
  adminId: string;
  /** Currently selected lounger IDs */
  selected: string[];
  /** How many total spots needed (0 = unlimited manual selection) */
  count: number;
  /** Called when selection changes */
  onSelect: (loungerIds: string[]) => void;
  /** Close the picker */
  onClose: () => void;
  /** Exclude these lounger IDs from "occupied" check (e.g., guest's own current loungers) */
  excludeFromOccupied?: string[];
}

export default function LoungerMapPicker({
  adminId,
  selected,
  count,
  onSelect,
  onClose,
  excludeFromOccupied = [],
}: Props) {
  const [loungers, setLoungers] = useState<LoungerConfig[]>([]);
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
        const occ = getOccupiedLoungers(guestJson.data as GuestProfile[], today);
        // Remove excluded IDs (guest's own loungers)
        for (const ex of excludeFromOccupied) occ.delete(ex);
        setOccupied(occ);
      }
    } finally {
      setLoading(false);
    }
  }, [adminId, excludeFromOccupied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When first lounger selected and count > 1, auto-suggest adjacent
  useEffect(() => {
    if (localSelected.length === 1 && count > 1 && loungers.length > 0) {
      const sugg = suggestAdjacentLoungers(localSelected[0], count, occupied, loungers);
      setSuggestions(sugg);
    } else if (localSelected.length === 0) {
      setSuggestions([]);
    }
  }, [localSelected, count, occupied, loungers]);

  function toggleLounger(id: string) {
    if (occupied.has(id)) return;

    setLocalSelected((prev) => {
      if (prev.includes(id)) {
        // Deselect
        const next = prev.filter((l) => l !== id);
        setSuggestions([]);
        return next;
      } else {
        // Select
        const next = [...prev, id];
        // Remove from suggestions if manually selected
        setSuggestions((s) => s.filter((sid) => sid !== id));
        return next;
      }
    });
  }

  function toggleSuggestion(id: string) {
    if (occupied.has(id)) return;
    // Move from suggestion to selected
    setLocalSelected((prev) => [...prev, id]);
    setSuggestions((s) => s.filter((sid) => sid !== id));
  }

  function confirmSelection() {
    onSelect([...localSelected]);
    onClose();
  }

  // Group by zone
  const zones = loungers.reduce<Record<string, LoungerConfig[]>>((acc, l) => {
    if (!acc[l.zone]) acc[l.zone] = [];
    acc[l.zone].push(l);
    return acc;
  }, {});

  const zoneNames = Object.keys(zones);
  const filteredZones = zoneFilter ? { [zoneFilter]: zones[zoneFilter] } : zones;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
      <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-900 font-bold text-lg">Selecteaza sezlonguri</p>
              <p className="text-gray-500 text-xs">
                {localSelected.length} selectate
                {count > 0 && ` din ${count} necesare`}
                {suggestions.length > 0 && ` · ${suggestions.length} sugerate`}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zone filter */}
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setZoneFilter(null)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                !zoneFilter ? "bg-[#C9AB81] text-[#0A0A0A]" : "bg-gray-100 text-gray-500"
              }`}
            >
              Toate
            </button>
            {zoneNames.map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(zoneFilter === z ? null : z)}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                  zoneFilter === z ? "bg-[#C9AB81] text-[#0A0A0A]" : "bg-gray-100 text-gray-500"
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[9px] text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-300 inline-block" /> Liber
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#C9AB81]/30 border border-[#C9AB81] inline-block" /> Selectat
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-orange-100 border border-orange-300 inline-block" /> Sugerat
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 inline-block" /> Ocupat
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : (
            Object.entries(filteredZones).map(([zone, zLoungers]) => (
              <div key={zone} className="mb-5">
                <p className="text-[#C9AB81] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                  {zone} ({zLoungers.length})
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {zLoungers.map((l) => {
                    const isOccupied = occupied.has(l.id);
                    const isSelected = localSelected.includes(l.id);
                    const isSuggested = suggestions.includes(l.id);

                    let cls = "";
                    if (isSelected) {
                      cls = "bg-[#C9AB81]/20 border-[#C9AB81] text-[#C9AB81] ring-1 ring-[#C9AB81] font-bold";
                    } else if (isSuggested) {
                      cls = "bg-orange-100 border-orange-300 text-orange-600 animate-pulse";
                    } else if (isOccupied) {
                      cls = "bg-red-50 border-red-200 text-red-300 cursor-not-allowed";
                    } else {
                      cls = "bg-emerald-50 border-emerald-200 text-emerald-600 active:bg-emerald-100";
                    }

                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          if (isOccupied) return;
                          if (isSuggested) toggleSuggestion(l.id);
                          else toggleLounger(l.id);
                        }}
                        disabled={isOccupied}
                        className={`border p-1 text-center text-[9px] font-medium transition-all ${cls}`}
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

        {/* Footer - confirm */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          {/* Selected chips */}
          {localSelected.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {localSelected.map((lid) => (
                <span key={lid} className="flex items-center gap-1 bg-[#C9AB81]/10 border border-[#C9AB81]/20 px-2 py-0.5 text-[10px] font-bold text-[#C9AB81]">
                  {lid}
                  <button onClick={() => toggleLounger(lid)} className="text-red-400">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {suggestions.map((lid) => (
                <span key={lid} className="flex items-center gap-1 bg-orange-100 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                  {lid} (sugerat)
                  <button onClick={() => toggleSuggestion(lid)} className="text-emerald-500">+</button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={confirmSelection}
            disabled={localSelected.length === 0}
            className="w-full bg-[#C9AB81] text-[#0A0A0A] py-3 font-bold text-sm tracking-wider uppercase disabled:opacity-40"
          >
            Confirma {localSelected.length} {localSelected.length === 1 ? "loc" : "locuri"}
          </button>
        </div>
      </div>
    </div>
  );
}
