"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";
import type { GuestProfile } from "@/types";
import GuestCardModal from "@/components/admin/GuestCardModal";

interface Props {
  adminId: string;
}

export default function PendingRegistrations({ adminId }: Props) {
  const [pending, setPending] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestProfile | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pending-list", adminId }),
      });
      const json = await res.json();
      if (json.success) setPending(json.data);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchPending]);

  async function approve(guestId: string) {
    setProcessing(guestId);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-registration", adminId, guestId }),
      });
      const json = await res.json();
      if (json.success) {
        // Open card modal to assign lounger
        setEditingGuest(json.data);
        fetchPending();
      }
    } finally {
      setProcessing(null);
    }
  }

  async function reject(guestId: string) {
    if (!confirm("Respingi aceasta inregistrare?")) return;
    setProcessing(guestId);
    try {
      await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject-registration", adminId, guestId }),
      });
      fetchPending();
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
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
          {pending.length} {pending.length === 1 ? "cerere" : "cereri"} de validare
        </p>
        <button onClick={() => { setLoading(true); fetchPending(); }} className="th-text-muted">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="th-card border p-8 text-center">
          <Check className="w-10 h-10 th-text-faint mx-auto mb-2" />
          <p className="th-text-muted text-sm">Nicio cerere de validare.</p>
          <p className="th-text-faint text-xs mt-1">Oaspetii care scaneaza QR-ul de la receptie vor aparea aici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((g) => {
            const members = g.members || [{ phone: g.phone, name: g.name, email: g.email }];
            return (
              <div key={g.id} className="th-card border p-4">
                {/* Guest info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="th-text font-bold text-base">{g.name}</p>
                    <div className="flex items-center gap-3 text-xs th-text-muted mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {g.phone}</span>
                      {g.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {g.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-amber-100 text-amber-600">
                      Pending
                    </span>
                  </div>
                </div>

                {/* Stay period */}
                <div className="flex items-center gap-2 text-xs th-text-muted mb-3">
                  <Calendar className="w-3 h-3" />
                  {g.stayStart} → {g.stayEnd}
                </div>

                {/* Members count */}
                {members.length > 1 && (
                  <div className="flex items-center gap-2 text-xs th-text-muted mb-3">
                    <Users className="w-3 h-3" />
                    {members.length} membri: {members.map(m => m.name.split(" ")[0]).join(", ")}
                  </div>
                )}

                {/* Registration time */}
                <p className="th-text-faint text-[10px] mb-3">
                  Inregistrat: {new Date(g.registeredAt).toLocaleString("ro-RO")}
                  {g.registeredBy === "self" && " (self-service)"}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(g.id)}
                    disabled={processing === g.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {processing === g.id ? "..." : "Valideaza"}
                  </button>
                  <button
                    onClick={() => reject(g.id)}
                    disabled={processing === g.id}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs tracking-wider uppercase"
                  >
                    <X className="w-4 h-4" />
                    Respinge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card modal for editing after approval */}
      {editingGuest && (
        <GuestCardModal
          guest={editingGuest}
          adminId={adminId}
          onClose={() => { setEditingGuest(null); fetchPending(); }}
          onUpdated={(g) => setEditingGuest(g)}
        />
      )}
    </div>
  );
}
