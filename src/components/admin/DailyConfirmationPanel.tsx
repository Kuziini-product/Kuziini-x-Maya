"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Umbrella,
  AlertTriangle,
} from "lucide-react";
import { useDailyStatus, useConfirmDaily, useDeactivateAll } from "@/hooks/use-admin";
import GuestCardModal from "@/components/admin/GuestCardModal";
import type { GuestProfile } from "@/types";

interface Props {
  adminId: string;
}

export default function DailyConfirmationPanel({ adminId }: Props) {
  const { data, isLoading, refetch } = useDailyStatus();
  const confirmMutation = useConfirmDaily();
  const deactivateMutation = useDeactivateAll();

  const [manualLounger, setManualLounger] = useState<Record<string, string>>({});
  const [editingGuest, setEditingGuest] = useState<GuestProfile | null>(null);

  const confirmed = data?.confirmed ?? [];
  const unconfirmed = data?.unconfirmed ?? [];
  const confirming = confirmMutation.isPending
    ? (confirmMutation.variables as { guestId: string })?.guestId ?? null
    : null;

  function confirmGuest(guestId: string, loungerId?: string) {
    confirmMutation.mutate({
      guestId,
      loungerId: loungerId || "",
      method: "manual",
    });
  }

  function deactivateAll() {
    if (!confirm("Dezactivezi toti oaspetii? Aceasta actiune se face la finalul zilei.")) return;
    deactivateMutation.mutate();
  }

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-6 h-6 th-text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="th-text-muted text-xs">
          {confirmed.length} confirmati · {unconfirmed.length} neconfirmati azi
        </p>
        <button onClick={() => refetch()} className="th-text-muted">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Unconfirmed - priority */}
      {unconfirmed.length > 0 && (
        <div className="mb-6">
          <p className="text-red-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Neconfirmati ({unconfirmed.length})
          </p>
          <div className="space-y-2">
            {unconfirmed.map((g) => (
              <div key={g.id} className="bg-red-400/5 border border-red-400/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <button onClick={() => setEditingGuest(g)} className="th-text text-sm font-medium underline">{g.name}</button>
                    <p className="th-text-muted text-xs">
                      {g.phone} · Sezlong: {(g.loungerIds || [g.loungerId]).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Umbrella className="absolute left-2.5 top-2 w-3.5 h-3.5 th-text-muted" />
                    <input
                      type="text"
                      value={manualLounger[g.id] || ""}
                      onChange={(e) => setManualLounger((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      placeholder={g.loungerId || "Nr. sezlong"}
                      className="w-full th-input border pl-8 pr-2 py-1.5 text-xs outline-none focus:border-maya-gold/50"
                    />
                  </div>
                  <button
                    onClick={() => confirmGuest(g.id, manualLounger[g.id]?.trim().toUpperCase() || g.loungerId)}
                    disabled={confirming === g.id}
                    className="bg-emerald-500 text-white px-5 py-1.5 text-[10px] font-bold tracking-wider uppercase disabled:opacity-50"
                  >
                    {confirming === g.id ? "..." : "Confirma"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <div className="mb-6">
          <p className="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Confirmati ({confirmed.length})
          </p>
          <div className="space-y-1">
            {confirmed.map((g) => (
              <div key={g.id} className="bg-emerald-400/5 border border-emerald-400/10 px-3 py-2 flex items-center justify-between">
                <div>
                  <button onClick={() => setEditingGuest(g)} className="th-text text-sm font-medium underline">{g.name}</button>
                  <p className="th-text-muted text-xs">
                    Sezlong: {(g.loungerIds || [g.loungerId]).join(", ") || "—"} · {g.phone}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {unconfirmed.length === 0 && confirmed.length === 0 && (
        <p className="th-text-faint text-sm text-center py-10">
          Niciun oaspete programat pentru azi.
        </p>
      )}

      {(confirmed.length > 0 || unconfirmed.length > 0) && (
        <button
          onClick={deactivateAll}
          disabled={deactivateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 py-3 text-xs font-bold tracking-wider uppercase mt-4 disabled:opacity-50"
        >
          <AlertTriangle className="w-4 h-4" />
          {deactivateMutation.isPending ? "Se dezactiveaza..." : "Dezactiveaza toti (final de zi)"}
        </button>
      )}

      {editingGuest && (
        <GuestCardModal
          guest={editingGuest}
          adminId={adminId}
          onClose={() => setEditingGuest(null)}
          onUpdated={(g) => { setEditingGuest(g); refetch(); }}
        />
      )}
    </div>
  );
}
