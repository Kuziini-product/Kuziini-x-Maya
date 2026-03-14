"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Users, Crown } from "lucide-react";
import { PageHeader, Button, EmptyState, Badge } from "@/components/ui";
import { useSessionStore } from "@/store";
import { formatPrice, formatDate } from "@/lib/utils";
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
        <PageHeader title="Cereri Guest" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></Link>} />
        <EmptyState icon="🔐" title="Identificare necesară" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Cereri Guest" back={<Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></Link>} />
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
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
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
            <h3 className="font-display text-lg font-bold text-gray-900 mb-3">
              În așteptare ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.map((req) => (
                <div key={req.id} className="bg-white rounded-3xl shadow-card p-4 ring-1 ring-ocean-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-sand-600" />
                    </div>
                    <div>
                      <p className="font-semibold font-body text-gray-900 text-sm">
                        {req.guestPhone}
                      </p>
                      <p className="text-xs text-gray-400 font-body">
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
            <h3 className="font-display text-base font-bold text-gray-700 mb-3">
              Rezolvate
            </h3>
            <div className="space-y-2">
              {resolved.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-body text-gray-600">{req.guestPhone}</span>
                  </div>
                  <Badge variant={req.status === "approved" ? "green" : "coral" as any}>
                    {req.status === "approved" ? "✓ Aprobat" : "✗ Refuzat"}
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
