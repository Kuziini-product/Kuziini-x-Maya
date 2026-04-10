"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Plus,
  RotateCcw,
} from "lucide-react";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { useSessionStore, useCartStore } from "@/store";
import { formatPrice, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, OrderItem, ClosedBill, MenuItem } from "@/types";

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
  const router = useRouter();
  const { userSession, orders: localOrders, closedBills } = useSessionStore();
  const addItem = useCartStore((s) => s.addItem);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["orders", umbrellaId, userSession?.phone],
    queryFn: async () => {
      const url = `/api/orders?umbrellaId=${umbrellaId}${userSession ? `&phone=${userSession.phone}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.orders as Order[];
    },
    enabled: !!userSession,
    refetchInterval: 15000,
  });

  const remoteOrders = data ?? [];
  const mergedMap = new Map<string, Order>();
  remoteOrders.forEach((o) => mergedMap.set(o.id, o));
  localOrders.forEach((o) => {
    if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
  });
  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function addItemToCart(item: OrderItem) {
    const menuItem: MenuItem = {
      id: item.menuItemId,
      categorySlug: "food",
      name: item.name,
      description: "",
      price: item.price,
      currency: "RON",
      available: true,
    };
    addItem(menuItem, 1);
    setAddedToast(item.name);
    setTimeout(() => setAddedToast(null), 2000);
  }

  function addAllItemsToCart(items: OrderItem[]) {
    items.forEach((item) => {
      const menuItem: MenuItem = {
        id: item.menuItemId,
        categorySlug: "food",
        name: item.name,
        description: "",
        price: item.price,
        currency: "RON",
        available: true,
      };
      addItem(menuItem, item.quantity);
    });
    setAddedToast("Toate articolele");
    setTimeout(() => setAddedToast(null), 2000);
  }

  if (!userSession) {
    return (
      <div>
        <PageHeader
          title="Comenzile mele"
          back={
            <Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10">
              <ArrowLeft className="w-4 h-4 text-white/70" />
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
    <div className="min-h-dvh bg-[#0A0A0A] text-white pb-24">
      <PageHeader
        title="Comenzile mele"
        subtitle={`Umbrela ${umbrellaId}`}
        right={
          <button
            onClick={() => refetch()}
            className={cn("w-9 h-9 flex items-center justify-center bg-white/10", isFetching && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        }
      />

      <div className="px-4 py-4">
        {/* Active orders */}
        {isLoading && merged.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : merged.length === 0 && closedBills.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="Nicio comandă încă"
            description="Comenzile tale vor apărea aici după plasare."
            action={
              <Link href={`/u/${umbrellaId}/menu`}>
                <button className="px-6 py-3 bg-[#C9AB81] text-[#0A0A0A] font-bold text-xs tracking-[0.15em] uppercase">
                  Vezi meniul
                </button>
              </Link>
            }
          />
        ) : (
          <>
            {merged.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-[#C9AB81] text-xs font-bold tracking-[0.2em] uppercase">
                  Comenzi active
                </h3>
                {merged.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAddItem={addItemToCart}
                    onAddAll={addAllItemsToCart}
                  />
                ))}
              </div>
            )}

            {/* Closed bills history */}
            {closedBills.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase">
                  Istoric note plătite
                </h3>
                {closedBills.map((bill) => (
                  <ClosedBillCard
                    key={bill.id}
                    bill={bill}
                    onAddItem={addItemToCart}
                    onAddAll={addAllItemsToCart}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-3 text-sm font-bold tracking-wide shadow-lg z-50 animate-fade-in">
          ✓ {addedToast} adăugat în coș
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAddItem,
  onAddAll,
}: {
  order: Order;
  onAddItem: (item: OrderItem) => void;
  onAddAll: (items: OrderItem[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<OrderStatus, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    sent: "bg-[#C9AB81]/20 text-[#C9AB81]",
    confirmed: "bg-[#C9AB81]/20 text-[#C9AB81]",
    preparing: "bg-amber-500/20 text-amber-400",
    delivering: "bg-purple-500/20 text-purple-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    cancelled: "bg-white/10 text-white/40",
  };

  const isActive = !["delivered", "rejected", "cancelled"].includes(order.status);
  const isCompleted = order.status === "delivered";
  const isRejected = ["rejected", "cancelled"].includes(order.status);

  const progressSteps = [
    { key: "sent", label: "Trimisă", icon: "📩" },
    { key: "confirmed", label: "Văzută", icon: "👀" },
    { key: "preparing", label: "Se prepară", icon: "👨‍🍳" },
    { key: "delivering", label: "Pe drum", icon: "🏃‍♂️" },
    { key: "delivered", label: "Livrată", icon: "✅" },
  ];
  const statusOrder = ["pending", "sent", "confirmed", "preparing", "delivering", "delivered"];
  const currentIdx = statusOrder.indexOf(order.status);

  return (
    <div className={cn("bg-white/[0.03] border overflow-hidden", isActive ? "border-[#C9AB81]/30" : isRejected ? "border-red-500/20" : "border-white/[0.06]")}>
      {isActive && (
        <div className="h-0.5 bg-gradient-to-r from-[#C9AB81]/60 to-[#C9AB81] animate-pulse" />
      )}

      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-white/30">{formatDate(order.createdAt)}</p>
            <p className="text-xs text-white/30 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold tracking-wider uppercase", statusColors[order.status])}>
              {STATUS_ICONS[order.status]}
              {getOrderStatusLabel(order.status)}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </div>
        </div>

        {/* Progress stepper */}
        {!isRejected && (
          <div className="flex items-center gap-0.5 my-3">
            {progressSteps.map((step, i) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isDone = currentIdx >= stepIdx;
              const isCurrent = currentIdx === stepIdx;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className={cn(
                    "h-1 w-full rounded-full transition-all duration-500",
                    isDone ? "bg-[#C9AB81]" : "bg-white/10",
                    isCurrent && "animate-pulse bg-[#C9AB81]"
                  )} />
                  <span className={cn(
                    "text-[8px] tracking-wider uppercase font-bold transition-colors",
                    isCurrent ? "text-[#C9AB81]" : isDone ? "text-white/40" : "text-white/15"
                  )}>
                    {step.icon}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-xs text-white/40">
            {order.items.length} {order.items.length === 1 ? "articol" : "articole"}
          </span>
          <span className="font-bold text-[#C9AB81]">{formatPrice(order.total)}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          <div className="space-y-2 py-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-white/60">
                  {item.quantity}× {item.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/40">{formatPrice(item.price * item.quantity)}</span>
                  {isCompleted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddItem(item); }}
                      className="w-7 h-7 flex items-center justify-center bg-[#C9AB81]/20 text-[#C9AB81] active:bg-[#C9AB81]/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isCompleted && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddAll(order.items); }}
              className="w-full flex items-center justify-center gap-2 bg-[#C9AB81]/10 border border-[#C9AB81]/20 py-2.5 text-[#C9AB81] text-xs font-bold tracking-[0.1em] uppercase active:bg-[#C9AB81]/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recomandă toată comanda
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ClosedBillCard({
  bill,
  onAddItem,
  onAddAll,
}: {
  bill: ClosedBill;
  onAddItem: (item: OrderItem) => void;
  onAddAll: (items: OrderItem[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const allItems = bill.orders.flatMap((o) => o.items);
  const paymentLabel = bill.paymentMethod === "cash" ? "Cash" : bill.paymentMethod === "card" ? "Card" : "Room Charge";

  const billDate = new Date(bill.closedAt);
  const dateStr = billDate.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = billDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-white/30">{dateStr} · {timeStr}</p>
            <p className="text-xs text-white/20 font-mono">#{bill.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {paymentLabel}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <span className="text-xs text-white/30">
            {allItems.length} {allItems.length === 1 ? "articol" : "articole"}
          </span>
          <span className="font-bold text-white/50">{formatPrice(bill.total)}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04]">
          <div className="space-y-2 py-3">
            {allItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-white/50">
                  {item.quantity}× {item.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/30">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddItem(item); }}
                    className="w-7 h-7 flex items-center justify-center bg-[#C9AB81]/20 text-[#C9AB81] active:bg-[#C9AB81]/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddAll(allItems); }}
            className="w-full flex items-center justify-center gap-2 bg-[#C9AB81]/10 border border-[#C9AB81]/20 py-2.5 text-[#C9AB81] text-xs font-bold tracking-[0.1em] uppercase active:bg-[#C9AB81]/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recomandă toată nota
          </button>
        </div>
      )}
    </div>
  );
}
