"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, Truck, ChefHat, XCircle } from "lucide-react";
import { PageHeader, EmptyState, Badge, Spinner } from "@/components/ui";
import { useSessionStore } from "@/store";
import { formatPrice, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  sent: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

export default function OrdersPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const { userSession, orders: localOrders } = useSessionStore();

  // Combine local + remote orders, dedupe by id
  const allOrders = localOrders;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["orders", umbrellaId, userSession?.phone],
    queryFn: async () => {
      const url = `/api/orders?umbrellaId=${umbrellaId}${userSession ? `&phone=${userSession.phone}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.orders as Order[];
    },
    enabled: !!userSession,
    refetchInterval: 15000, // poll every 15s
  });

  const remoteOrders = data ?? [];

  // Merge local and remote by id
  const mergedMap = new Map<string, Order>();
  remoteOrders.forEach((o) => mergedMap.set(o.id, o));
  allOrders.forEach((o) => {
    if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
  });
  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!userSession) {
    return (
      <div>
        <PageHeader
          title="Comenzile mele"
          back={
            <Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
          }
        />
        <EmptyState
          icon="🔐"
          title="Identificare necesară"
          description="Identifică-te pentru a vedea comenzile tale."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Comenzile mele"
        subtitle={`Umbrela ${umbrellaId}`}
        back={
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
        }
        right={
          <button
            onClick={() => refetch()}
            className={cn("w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center", isFetching && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        }
      />

      <div className="px-4 py-4">
        {isLoading && merged.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : merged.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="Nicio comandă încă"
            description="Comenzile tale vor apărea aici după plasare."
            action={
              <Link href={`/u/${umbrellaId}/menu`}>
                <button className="px-6 py-3 bg-ocean-600 text-white rounded-2xl font-semibold font-body text-sm">
                  Vezi meniul
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {merged.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusColors: Record<OrderStatus, string> = {
    pending: "bg-sand-100 text-sand-700",
    sent: "bg-ocean-100 text-ocean-700",
    confirmed: "bg-ocean-100 text-ocean-700",
    preparing: "bg-amber-100 text-amber-700",
    delivering: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const isActive = !["delivered", "rejected", "cancelled"].includes(order.status);

  return (
    <div className={cn("bg-white rounded-3xl shadow-card overflow-hidden", isActive && "ring-1 ring-ocean-200")}>
      {/* Status bar */}
      {isActive && (
        <div className="h-1 bg-gradient-to-r from-ocean-400 to-ocean-600 animate-pulse" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 font-body">
              {formatDate(order.createdAt)}
            </p>
            <p className="text-xs text-gray-400 font-body font-mono">
              #{order.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-body", statusColors[order.status])}>
            {STATUS_ICONS[order.status]}
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-1.5 mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm font-body">
              <span className="text-gray-700">
                {item.quantity}× {item.name}
              </span>
              <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-500 font-body">
            {order.ownerApprovalRequired ? "⏳ Necesită aprobare owner" : ""}
          </span>
          <span className="font-display font-bold text-ocean-700">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
