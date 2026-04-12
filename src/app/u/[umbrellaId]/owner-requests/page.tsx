"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Users, Crown } from "lucide-react";
import { PageHeader, Button, EmptyState, Badge } from "@/components/ui";
import { useSessionStore } from "@/store";
import { formatDate } from "@/lib/utils";
import type { GuestJoinRequest } from "@/types";

export default function OwnerRequestsPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const { userSession, pendingRequests, updateRequestStatus } = useSessionStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const isOwner = userSession?.role === "owner";

  async function handleDecision(req: GuestJoinRequest, approve: boolean) {
    setLoading((l) => ({ ...l, [req.id]: true }));
    try {
      const endpoint = approve ? "/api/owner/approve" : "/api/owner/reject";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: req.id,
          orderId: req.orderId,
          umbrellaId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        updateRequestStatus(req.id, approve ? "approved" : "rejected");
      }
    } finally {
      setLoading((l) => ({ ...l, [req.id]: false }));
    }
  }

  if (!userSession) {
    return (
      <div>
        <PageHeader title="Cereri Guest" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10"><ArrowLeft className="w-4 h-4 text-white/70" /></Link>} />
        <EmptyState icon="🔐" title="Identificare necesară" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Cereri Guest" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10"><ArrowLeft className="w-4 h-4 text-white/70" /></Link>} />
        <EmptyState icon="👑" title="Doar owner-ul poate vedea cererile" description="Această secțiune este vizibilă doar pentru owner-ul umbrelei." />
      </div>
    );
  }

  const pending = pendingRequests.filter(
    (r) => r.umbrellaId === umbrellaId && r.status === "pending"
  );
  const resolved = pendingRequests.filter(
    (r) => r.umbrellaId === umbrellaId && r.status !== "pending"
  );

  return (
    <div>
      <PageHeader
        title="Cereri Guest"
        subtitle={`Umbrela ${umbrellaId}`}
        back={
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>
        }
        right={
          <Badge variant="ocean">
            <Crown className="w-3 h-3 mr-1" />Owner
          </Badge>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h3 className="text-maya-gold text-xs font-bold tracking-[0.2em] uppercase mb-3">
              În așteptare ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="bg-white/[0.03] border border-maya-gold/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/10">
                      <Users className="w-5 h-5 text-white/50" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {req.guestPhone}
                      </p>
                      <p className="text-xs text-white/30">
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <Badge variant="sand" className="ml-auto">
                      Cerere atașare notă
                    </Badge>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      loading={loading[req.id]}
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={() => handleDecision(req, false)}
                    >
                      Refuză
                    </Button>
                    <Button
                      size="sm"
                      fullWidth
                      loading={loading[req.id]}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => handleDecision(req, true)}
                    >
                      Aprobă
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <h3 className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase mb-3">
              Rezolvate
            </h3>
            <div className="space-y-2">
              {resolved.map((req) => (
                <div key={req.id} className="bg-white/[0.03] border border-white/[0.06] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white/50">{req.guestPhone}</span>
                  </div>
                  <Badge variant={req.status === "approved" ? "green" : "coral" as any}>
                    {req.status === "approved" ? "Aprobat" : "Refuzat"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && resolved.length === 0 && (
          <EmptyState
            icon="✅"
            title="Nicio cerere"
            description="Când un guest vrea să se atașeze la nota ta, vei vedea cererea aici."
          />
        )}
      </div>
    </div>
  );
}
